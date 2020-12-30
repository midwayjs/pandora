import { ACMClient } from 'acm-client';
import { EventEmitter } from 'events';
import * as createDebug from 'debug';

const debug = createDebug('pandora:arms');

interface ControlChannel {
  addListener(event: 'data', listener: (ControlConfig) => void): this;
  on(event: 'data', listener: (ControlConfig) => void): this;
}

class ControlChannel extends EventEmitter {
  private acm: ACMClient;
  private group = 'cn-hangzhou';
  private lastRegistration: Parameters<ACMClient['subscribe']>[0];

  constructor() {
    super();
    this.acm = new ACMClient({
      endpoint: 'acm.aliyun.com',
      namespace: 'c845a7b4-23a1-4f28-a380-5ab30d8a280f',
      accessKey: '*',
      secretKey: '*',
      requestTimeout: 6000,
    });
  }

  async updateCredential(cred: string) {
    const dataId = `arms.trace.${cred.replace(/@/g, '-')}`;
    debug('control channel starts on', dataId);

    const content = await this.acm.getConfig(dataId, this.group);
    this.emitData(content);

    if (this.lastRegistration) {
      this.acm.unSubscribe(this.lastRegistration, this.subscriptionListener);
    }
    const reg = {
      dataId: dataId,
      group: this.group,
    };
    this.acm.subscribe(reg, this.subscriptionListener);
    this.lastRegistration = reg;
  }

  private subscriptionListener = (content: string) => {
    this.emitData(content);
  };

  private emitData(data: string) {
    debug('control channel update', data);
    try {
      const parsed = JSON.parse(data);
      this.emit('data', parsed);
    } catch (e) {
      debug('unexpected error on emit data', e);
    }
  }
}
export default ControlChannel;

export interface ControlConfig {
  profiler: {
    //是否开启链接收集功能
    enable: boolean;
    //采样配置
    sampling: {
      //是否开启采样
      enable: boolean;
      //采样率(10表示10%的采样率)
      rate: number;
    };
    defined: {
      //自定义入口方法
      method: {
        //是否为入口
        entry: boolean;
        //方法全名
        methodFullName: string;
        createTime: number;
        enable: boolean;
        updateTime: number;
        id: string;
      }[];
      //不采集的url,逗号分隔
      excludeurl: string;
    };
  };
}
