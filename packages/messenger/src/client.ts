'use strict';
import createDebug from 'debug';
import * as is from 'is-type-of';
import * as net from 'net';
import MessengerBase from './base';
import eventName from './eventName';
const debug = createDebug('pandora:messenger:client');

const defaultOptions = {
  noDelay: true,
  responseTimeout: 20000,
  reConnectTimes: 0,
  reConnectInterval: 1000,
};

const MAX_PACKET_ID = Math.pow(2, 30);

export default class Client extends MessengerBase {
  private _reConnectTimes: number;
  private _socket: net.Socket;
  private _header: Buffer;
  private _bodyLength: number;
  private _queue: Array<any>;
  private _packetId: number;
  private _unref: boolean;

  /**
   * tcp 客户端的基类
   * @param {Object} options
   *   - {Number} headerLength - 通讯协议头部长度, 可选， 不传的话就必须实现getHeader方法
   *   - {Boolean} [noDelay] - 是否开启 Nagle 算法，默认：true，不开启
   *   - {Boolean} [unref] - socket.unref，默认不 false
   *   - {Number} [concurrent] - 并发请求数，默认：0，不控制并发
   *   - {Number} [responseTimeout] - 请求超时
   *   - {Number} [reConnectTimes] - 自动最大重连次数，默认：0，不自动重连，当重连次数超过此值时仍然无法连接就触发close error事件
   *   - {Number} [reConnectInterval] - 重连时间间隔，默认： 1s，当reConnectTimes大于0时才有效
   * @constructor
   */
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    super(options);

    this._unref = !!options.unref;
    this._reConnectTimes = this.options.reConnectTimes;
    this._socket = this.options.socket;
    this._header = null;
    this._bodyLength = null;
    this._queue = [];
    this._packetId = 0;
    if (!this._socket) {
      this._connect();
    } else {
      this._bind();
    }
  }

  createPacketId() {
    this._packetId += 1;
    if (this._packetId >= MAX_PACKET_ID) {
      this._packetId = 1;
    }
    return this._packetId;
  }

  /**
   * 读取 packet 的头部
   * @return {Buffer} header
   */
  getHeader() {
    return this.read(9);
  }

  /*eslint-disable */
  /**
   * 根据头部信息获取 body 的长度
   * @param {Buffer} header - 头部数据
   * @return {Number} bodyLength
   */
  getBodyLength(header) {
    return header.readUInt32BE(5);
  }

  /**
   * 反序列化
   * @param {Buffer} buf - 二进制数据
   * @return {Object} 对象
   */
  decode(buf, header) {
    const first = header.readUInt8(0);
    const id = header.readUInt32BE(1);
    let data;
    if (buf) {
      data = JSON.parse(buf);
    }

    return {
      oneway: !!(first & 0x80),
      isResponse: !(first & 0x40),
      id,
      data,
    };
  }

  /**
   * 序列化消息
   * @param {Buffer} buf - 二进制数据
   * @return {Object} 对象
   */
  encode(message) {
    /*
     *  header 8byte
     * 1byte 8bit用于布尔判断 是否双向通信|响应还是请求|后面6bit保留
     * 4byte packetId 包id最大4位
     * 4byte 消息长度 最大长度不要超过4个字节
     * body
     * nbyte 消息内容
     * */
    let first = 0;
    if (message.oneway) {
      first = first | 0x80;
    }
    if (message.isResponse === false) {
      first = first | 0x40;
    }
    const header = Buffer.alloc(9);
    const data = JSON.stringify(message.data, replaceErrors);
    const body = Buffer.from(data);
    header.fill(0);
    header.writeUInt8(first, 0);
    header.writeUInt32BE(message.id, 1);
    header.writeUInt32BE(Buffer.byteLength(data), 5);
    return Buffer.concat([header, body]);
  }

  /**
   * 当前socket是否可写
   * @property {Boolean} TCPBase#_writable
   */
  get _writable() {
    return this.isOK;
  }

  /*eslint-enable */
  /**
   * 连接是否正常
   * @property {Boolean} TCPBase#isOK
   */
  get isOK() {
    return this._socket && this._socket.writable;
  }

  get shouldUnref() {
    return this._unref && this._ready;
  }

  /**
   * 从socket缓冲区中读取n个buffer
   * @param {Number} n - buffer长度
   * @return {Buffer} - 读取到的buffer
   */
  read(n) {
    return this._socket.read(n);
  }

  send(action, data, callback?, timeout?) {
    return this._send(
      {
        timeout,
        data: {
          action,
          data,
        },
      },
      callback
    );
  }

  /**
   * 发送数据
   * @param {Object} packet
   *   - {Number} id - packet id
   *   - {Buffer} data - 发送的二进制数据
   *   - {Boolean} [oneway] - 是否单向
   *   - {Number} [timeout] - 请求超时时长
   * @param {Function} [callback] - 回调函数，可选
   * @return {void}
   */
  _send(packet, callback?) {
    // 如果有设置并发，不应该再写入，等待正在处理的请求已完成；或者当前没有可用的socket，等待重新连接后再继续send
    if (!this._writable) {
      this._queue.push([packet, callback]);
      // 如果设置重连的话还有可能挽回这些请求
      if (!this._socket && !this._reConnectTimes) {
        this._cleanQueue();
      }
      return;
    }

    packet.id = this.createPacketId();
    if (callback) {
      const timeout = packet.timeout || this.options.responseTimeout;
      const callbackEvent = `response_callback_${packet.id}`;
      const timer = setTimeout(() => {
        this.removeAllListeners(callbackEvent);
        const err = new Error(`target no response in ${timeout}ms`);
        err.name = 'MessengerRequestTimeoutError';
        callback(err);
      }, timeout);
      this.once(callbackEvent, message => {
        clearTimeout(timer);
        callback(null, message);
      });
    }

    this._socket.write(this.encode(packet));
    this._resume();
  }

  // 清理未发出的请求
  _cleanQueue() {
    for (const record of this._queue) {
      const callback = record[1];
      callback && callback(new Error('socket not available'));
    }
    this._queue = [];
  }

  // 缓冲区空闲，重新尝试写入
  _resume() {
    const args = this._queue.shift();
    if (args) {
      this._send(args[0], args[1]);
    }
  }

  // 读取服务器端数据，反序列化成对象
  _readPacket() {
    if (is.nullOrUndefined(this._bodyLength)) {
      this._header = this.getHeader();
      if (!this._header) {
        return false;
      }
      // 通过头部信息获得body的长度
      this._bodyLength = this.getBodyLength(this._header);
    }

    let body;
    // body 可能为空
    if (this._bodyLength > 0) {
      body = this.read(this._bodyLength);
      if (!body) {
        return false;
      }
    }
    this._bodyLength = null;
    const entity = this.decode(body, this._header);
    setImmediate(() => {
      this.emit(eventName, entity.data, res => {
        const id = entity.id;
        this.send(`response_callback_${id}`, res);
      });
    });
    return true;
  }
  /**
   * 主动关闭连接
   * @return {void}
   */
  close() {
    this._reConnectTimes = 0;
    this._close();
  }

  /**
   * 关闭连接
   * @param {Error} err - 导致关闭连接的异常
   * @return {void}
   */
  _close(err?) {
    if (!this._socket) {
      return;
    }
    this._socket.destroy();
    this._handleClose(err);
  }

  _handleClose(err?: Error) {
    if (!this._socket) {
      return;
    }

    this._socket.removeAllListeners();
    this._socket = null;

    if (!this._ready && !this.options.reConnectAtFirstTime) {
      this._reConnectTimes = 0;
    }

    if (err) {
      this._throwError(err);
    }

    // 自动重连接
    if (this._reConnectTimes) {
      const timer = setTimeout(() => {
        this._reConnectTimes--;
        this._connect(() => {
          // 连接成功后重新设置可重连次数
          this._reConnectTimes = this.options.reConnectTimes;
          // 继续处理由于socket断开遗留的请求
          debug(
            '[client] reconnected to the server, process pid is %s',
            process.pid
          );
        });
      }, this.options.reConnectInterval);
      if (this.shouldUnref) {
        timer.unref();
      }
      return;
    }
    this._cleanQueue();
    // 触发 close 事件，告诉使用者连接被关闭了，需要重新处理
    this.emit('close');
    this.removeAllListeners();
  }

  // 连接
  _connect(done?: Function) {
    this._socket = net.connect(this.sockPath);
    this._socket.once('connect', () => {
      this.ready(true);
      done && done();
      if (this.shouldUnref) {
        this._socket.unref();
      }
      this._resume();
      this.emit('connect');
    });
    this._bind();
  }

  _bind() {
    const socket = this._socket;
    socket.setNoDelay(this.options.noDelay);
    socket.on('readable', () => {
      try {
        // 在这里循环读，避免在 _readPacket 里嵌套调用，导致调用栈过长
        let remaining = false;
        do {
          remaining = this._readPacket();
        } while (remaining);
      } catch (err) {
        err.name = 'PacketParsedError';
        this._close(err);
      }
    });

    socket.once('close', () => this._handleClose());
    socket.once('error', err => {
      this._close(err);
    });
  }
}

function replaceErrors(key, value) {
  if (value instanceof Error) {
    const error = {};

    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key];
    });

    return error;
  }

  return value;
}
