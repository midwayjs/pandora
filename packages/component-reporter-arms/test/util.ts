import {
  ArmsMetaDataRegister,
  ArmsServiceRegister,
  ServiceInstance,
  Response,
  BatchStringMeta,
  Code,
  StringMeta,
  RegisterServiceInstanceResp,
} from '../src/types';
import * as grpc from 'grpc';
import ArmsExportController from '../src/ArmsExportController';
import ControlChannel from '../src/ControlChannel';

export class TestArmsMetaDataRegister implements ArmsMetaDataRegister {
  registerStringMeta(
    stringMeta: StringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ) {
    process.nextTick(() => {
      callback(null, { success: true, code: Code.OK, msg: 'ok' });
    });
  }

  registerBatchStringMeta(
    batchStringMeta: BatchStringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ) {
    process.nextTick(() => {
      callback(null, { success: true, code: Code.OK, msg: 'ok' });
    });
  }
}

export class TestArmsServiceRegister implements ArmsServiceRegister {
  failure = false;
  setFailure(failure: boolean) {
    this.failure = failure;
  }

  registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: RegisterServiceInstanceResp) => void
  ) {
    process.nextTick(() => {
      callback(null, {
        success: !this.failure,
        code: this.failure ? Code.INVALID_LICENSE_KEY : Code.OK,
        msg: this.failure ? 'invalid license key' : 'ok',
        pid: 'foobar',
      });
    });
  }
}

export class TestControlChannel extends ControlChannel {
  async updateCredential() {}
}

export class TestArmsExportController extends ArmsExportController {
  constructor(
    public serviceRegister: ArmsServiceRegister = new TestArmsServiceRegister(),
    public metadataRegister: ArmsMetaDataRegister = new TestArmsMetaDataRegister()
  ) {
    super({ endpoint: 'test', ip: '' });
    this['controlChannel'] = new TestControlChannel();
  }

  async register() {
    await this['registerServiceInstance']().catch(e => {
      console.log('mock error', e);
    });
  }
}
