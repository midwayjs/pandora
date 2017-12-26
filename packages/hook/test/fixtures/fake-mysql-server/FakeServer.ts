/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

// Copy from mysqljs/mysql test

// An experimental fake MySQL server for tricky integration tests. Expanded
// as needed.

import * as EventEmitter from 'events';
const fs           = require('fs');
const Charsets     = require('mysql/lib/protocol/constants/charsets');
const Net          = require('net');
const tls          = require('tls');
const buffer       = require('safe-buffer').Buffer;
const Packets      = require('mysql/lib/protocol/packets');
const PacketWriter = require('mysql/lib/protocol/PacketWriter');
const Parser       = require('mysql/lib/protocol/Parser');
const Types        = require('mysql/lib/protocol/constants/types');
const Auth         = require('mysql/lib/protocol/Auth');
const Errors       = require('mysql/lib/protocol/constants/errors');

function extend(dest, src) {
  for (let key in src) {
    dest[key] = src[key];
  }

  return dest;
}

function getSSLConfig() {
  return {
    ca      : fs.readFileSync('./certs/server.crt', 'ascii'),
    cert    : fs.readFileSync('./certs/server.crt', 'ascii'),
    ciphers : 'ECDHE-RSA-AES128-SHA256:AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
    key     : fs.readFileSync('./certs/server.key', 'ascii')
  };
}

export class FakeServer extends EventEmitter {
  _server = null;
  _connections = [];

  listen(port, cb) {
    this._server = Net.createServer(this._handleConnection.bind(this));
    this._server.listen(port, cb);
  }

  _handleConnection(socket) {
    const connection = new FakeConnection(socket);

    if (!this.emit('connection', connection)) {
      connection.handshake();
    }

    this._connections.push(connection);
  }

  destroy() {
    if (this._server._handle) {
      // close server if listening
      this._server.close();
    }

    // destroy all connections
    this._connections.forEach(function(connection) {
      connection.destroy();
    });
  }
}

export class FakeConnection extends EventEmitter {

  _ssl = null;
  _parser = null;
  _handshakeInitializationPacket = null;
  _clientAuthenticationPacket = null;
  _oldPasswordPacket = null;
  _authSwitchResponse = null;
  _handshakeOptions = {};
  _socket = null;
  _stream = null;

  constructor(socket) {
    super();

    this._socket = socket;
    this._stream = socket;
    this._parser = new Parser({onPacket: this._parsePacket.bind(this)});

    socket.on('data', this._handleData.bind(this));
  }

  handshake(options?) {
    this._handshakeOptions = options || {};

    const packetOpiotns = extend({
      scrambleBuff1       : buffer.from('1020304050607080', 'hex'),
      scrambleBuff2       : buffer.from('0102030405060708090A0B0C', 'hex'),
      serverCapabilities1 : 512, // only 1 flag, PROTOCOL_41
      protocol41          : true
    }, this._handshakeOptions);

    this._handshakeInitializationPacket = new Packets.HandshakeInitializationPacket(packetOpiotns);

    this._sendPacket(this._handshakeInitializationPacket);
  }

  deny(message, errno) {
    this._sendPacket(new Packets.ErrorPacket({
      message : message,
      errno   : errno
    }));
  }

  _sendAuthResponse(got, expected) {
    if (expected.toString('hex') === got.toString('hex')) {
      this._sendPacket(new Packets.OkPacket());
    } else {
      this._sendPacket(new Packets.ErrorPacket({
        message : 'expected ' + expected.toString('hex') + ' got ' + got.toString('hex'),
        errno   : Errors.ER_ACCESS_DENIED_ERROR
      }));
    }

    this._parser.resetPacketNumber();
  }

  _sendPacket(packet) {
    const writer = new PacketWriter();
    packet.write(writer);
    this._stream.write(writer.toBuffer(this._parser));
  }

  _handleData(buffer) {
    this._parser.write(buffer);
  }

  _handleQueryPacket(packet) {
    const conn = this;
    let match;
    const sql = packet.sql;

    if ((match = /^SELECT ([0-9]+);?$/i.exec(sql))) {
      const num = match[1];

      this._sendPacket(new Packets.ResultSetHeaderPacket({
        fieldCount: 1
      }));

      this._sendPacket(new Packets.FieldPacket({
        catalog    : 'def',
        charsetNr  : Charsets.UTF8_GENERAL_CI,
        default    : '0',
        name       : num,
        protocol41 : true,
        type       : Types.LONG
      }));

      this._sendPacket(new Packets.EofPacket());

      const writer = new PacketWriter();
      writer.writeLengthCodedString(num);
      this._socket.write(writer.toBuffer(this._parser));

      this._sendPacket(new Packets.EofPacket());
      this._parser.resetPacketNumber();
      return;
    }

    if ((match = /^SELECT CURRENT_USER\(\);?$/i.exec(sql))) {
      this._sendPacket(new Packets.ResultSetHeaderPacket({
        fieldCount: 1
      }));

      this._sendPacket(new Packets.FieldPacket({
        catalog    : 'def',
        charsetNr  : Charsets.UTF8_GENERAL_CI,
        name       : 'CURRENT_USER()',
        protocol41 : true,
        type       : Types.constCHAR
      }));

      this._sendPacket(new Packets.EofPacket());

      const writer = new PacketWriter();
      writer.writeLengthCodedString((this._clientAuthenticationPacket.user || '') + '@localhost');
      this._socket.write(writer.toBuffer(this._parser));

      this._sendPacket(new Packets.EofPacket());
      this._parser.resetPacketNumber();
      return;
    }

    if ((match = /^SELECT SLEEP\(([0-9]+)\);?$/i.exec(sql))) {
      const sec = match[1];
      const time = sec * 1000;

      setTimeout(function () {
        conn._sendPacket(new Packets.ResultSetHeaderPacket({
          fieldCount: 1
        }));

        conn._sendPacket(new Packets.FieldPacket({
          catalog    : 'def',
          charsetNr  : Charsets.UTF8_GENERAL_CI,
          name       : 'SLEEP(' + sec + ')',
          protocol41 : true,
          type       : Types.LONG
        }));

        conn._sendPacket(new Packets.EofPacket());

        const writer = new PacketWriter();
        writer.writeLengthCodedString(0);
        conn._socket.write(writer.toBuffer(conn._parser));

        conn._sendPacket(new Packets.EofPacket());
        conn._parser.resetPacketNumber();
      }, time);
      return;
    }

    if ((match = /^SELECT \* FROM stream LIMIT ([0-9]+);?$/i.exec(sql))) {
      const num = match[1];

      this._writePacketStream(num);
      return;
    }

    if ((match = /^SHOW STATUS LIKE 'Ssl_cipher';?$/i.exec(sql))) {
      this._sendPacket(new Packets.ResultSetHeaderPacket({
        fieldCount: 2
      }));

      this._sendPacket(new Packets.FieldPacket({
        catalog    : 'def',
        charsetNr  : Charsets.UTF8_GENERAL_CI,
        name       : 'constiable_name',
        protocol41 : true,
        type       : Types.constCHAR
      }));

      this._sendPacket(new Packets.FieldPacket({
        catalog    : 'def',
        charsetNr  : Charsets.UTF8_GENERAL_CI,
        name       : 'Value',
        protocol41 : true,
        type       : Types.constCHAR
      }));

      this._sendPacket(new Packets.EofPacket());

      const writer = new PacketWriter();
      writer.writeLengthCodedString('Ssl_cipher');
      writer.writeLengthCodedString(this._ssl ? this._ssl.getCurrentCipher().name : '');
      this._stream.write(writer.toBuffer(this._parser));

      this._sendPacket(new Packets.EofPacket());
      this._parser.resetPacketNumber();
      return;
    }

    if (/INVALID/i.test(sql)) {
      this._sendPacket(new Packets.ErrorPacket({
        errno   : Errors.ER_PARSE_ERROR,
        message : 'Invalid SQL'
      }));
      this._parser.resetPacketNumber();
      return;
    }

    this._sendPacket(new Packets.ErrorPacket({
      errno   : Errors.ER_QUERY_INTERRUPTED,
      message : 'Interrupted unknown query'
    }));

    this._parser.resetPacketNumber();
  }

  _parsePacket(header) {
    const Packet = this._determinePacket(header);
    const packet = new Packet({protocol41: true});
    let expected;

    packet.parse(this._parser);

    switch (Packet) {
      case Packets.ClientAuthenticationPacket:
        this._clientAuthenticationPacket = packet;
        if ((<any>this._handshakeOptions).oldPassword) {
          this._sendPacket(new Packets.UseOldPasswordPacket());
        } else if ((<any>this._handshakeOptions).authMethodName) {
          this._sendPacket(new Packets.AuthSwitchRequestPacket(this._handshakeOptions));
        } else if ((<any>this._handshakeOptions).password === 'passwd') {
          expected = buffer.from('3DA0ADA7C9E1BB3A110575DF53306F9D2DE7FD09', 'hex');
          this._sendAuthResponse(packet.scrambleBuff, expected);
        } else if ((<any>this._handshakeOptions).user || (<any>this._handshakeOptions).password) {
          throw new Error('not implemented');
        } else {
          this._sendPacket(new Packets.OkPacket());
          this._parser.resetPacketNumber();
        }
        break;
      case Packets.SSLRequestPacket:
        this._startTLS();
        break;
      case Packets.OldPasswordPacket:
        this._oldPasswordPacket = packet;

        expected = Auth.scramble323(this._handshakeInitializationPacket.scrambleBuff(), (<any>this._handshakeOptions).password);

        this._sendAuthResponse(packet.scrambleBuff, expected);
        break;
      case Packets.AuthSwitchResponsePacket:
        this._authSwitchResponse = packet;

        expected = Auth.token((<any>this._handshakeOptions).password, buffer.from('00112233445566778899AABBCCDDEEFF01020304', 'hex'));

        this._sendAuthResponse(packet.data, expected);
        break;
      case Packets.ComQueryPacket:
        if (!this.emit('query', packet)) {
          this._handleQueryPacket(packet);
        }
        break;
      case Packets.ComPingPacket:
        if (!this.emit('ping', packet)) {
          this._sendPacket(new Packets.OkPacket());
          this._parser.resetPacketNumber();
        }
        break;
      case Packets.ComChangeUserPacket:
        if (packet.user === 'does-not-exist') {
          this._sendPacket(new Packets.ErrorPacket({
            errno   : Errors.ER_ACCESS_DENIED_ERROR,
            message : 'User does not exist'
          }));
          this._parser.resetPacketNumber();
          break;
        } else if (packet.database === 'does-not-exist') {
          this._sendPacket(new Packets.ErrorPacket({
            errno   : Errors.ER_BAD_DB_ERROR,
            message : 'Database does not exist'
          }));
          this._parser.resetPacketNumber();
          break;
        }

        this._clientAuthenticationPacket = new Packets.ClientAuthenticationPacket({
          clientFlags   : this._clientAuthenticationPacket.clientFlags,
          filler        : this._clientAuthenticationPacket.filler,
          maxPacketSize : this._clientAuthenticationPacket.maxPacketSize,
          protocol41    : this._clientAuthenticationPacket.protocol41,
          charsetNumber : packet.charsetNumber,
          database      : packet.database,
          scrambleBuff  : packet.scrambleBuff,
          user          : packet.user
        });
        this._sendPacket(new Packets.OkPacket());
        this._parser.resetPacketNumber();
        break;
      case Packets.ComQuitPacket:
        if (!this.emit('quit', packet)) {
          this._socket.end();
        }
        break;
      default:
        throw new Error('Unexpected packet: ' + Packet.name);
    }
  }

  _determinePacket(header) {
    if (!this._clientAuthenticationPacket) {
      // first packet phase

      if (header.length === 32) {
        return Packets.SSLRequestPacket;
      }

      return Packets.ClientAuthenticationPacket;
    }

    if ((<any>this._handshakeOptions).oldPassword && !this._oldPasswordPacket) {
      return Packets.OldPasswordPacket;
    }

    if ((<any>this._handshakeOptions).authMethodName && !this._authSwitchResponse) {
      return Packets.AuthSwitchResponsePacket;
    }

    const firstByte = this._parser.peak();
    switch (firstByte) {
      case 0x01: return Packets.ComQuitPacket;
      case 0x03: return Packets.ComQueryPacket;
      case 0x0e: return Packets.ComPingPacket;
      case 0x11: return Packets.ComChangeUserPacket;
      default:
        throw new Error('Unknown packet, first byte: ' + firstByte);
    }
  }

  destroy() {
    this._socket.destroy();
  }

  _writePacketStream(count) {
    let remaining = count;
    const timer = setInterval(writeRow.bind(this), 20);

    this._socket.on('close', cleanup);
    this._socket.on('error', cleanup);

    this._sendPacket(new Packets.ResultSetHeaderPacket({
      fieldCount: 2
    }));

    this._sendPacket(new Packets.FieldPacket({
      catalog    : 'def',
      charsetNr  : Charsets.UTF8_GENERAL_CI,
      name       : 'id',
      protocol41 : true,
      type       : Types.LONG
    }));

    this._sendPacket(new Packets.FieldPacket({
      catalog    : 'def',
      charsetNr  : Charsets.UTF8_GENERAL_CI,
      name       : 'title',
      protocol41 : true,
      type       : Types.constCHAR
    }));

    this._sendPacket(new Packets.EofPacket());

    function cleanup() {
      clearInterval(timer);
    }

    function writeRow(this: any) {
      if (remaining === 0) {
        cleanup();

        this._socket.removeListener('close', cleanup);
        this._socket.removeListener('error', cleanup);

        this._sendPacket(new Packets.EofPacket());
        this._parser.resetPacketNumber();
        return;
      }

      remaining -= 1;

      const num = count - remaining;
      const writer = new PacketWriter();
      writer.writeLengthCodedString(num);
      writer.writeLengthCodedString('Row #' + num);
      this._socket.write(writer.toBuffer(this._parser));
    }
  }

  _startTLS() {
    // halt parser
    this._parser.pause();
    this._socket.removeAllListeners('data');

    // socket <-> encrypted
    const secureContext = tls.createSecureContext(getSSLConfig());
    const secureSocket  = new tls.TLSSocket(this._socket, {
      secureContext : secureContext,
      isServer      : true
    });

    // cleartext <-> protocol
    secureSocket.on('data', this._handleData.bind(this));
    this._stream = secureSocket;

    const conn = this;
    secureSocket.on('secure', function(this: any) {
      conn._ssl = this.ssl;
    });

    // resume
    const parser = this._parser;
    process.nextTick(function() {
      const buffer = parser._buffer.slice(parser._offset);
      parser._offset = parser._buffer.length;
      parser.resume();
      secureSocket.ssl.receive(buffer);
    });
  }
}