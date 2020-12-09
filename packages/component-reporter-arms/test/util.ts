import {
  ArmsMetaDataRegister,
  ArmsServiceRegister,
  ServiceInstance,
  Response,
  BatchStringMeta,
  Code,
  StringMeta,
} from '../src/types';
import * as grpc from 'grpc';
import ArmsExportController from '../src/ArmsExportController';

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
  registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ) {
    process.nextTick(() => {
      callback(null, { success: true, code: Code.OK, msg: 'ok' });
    });
  }
}

export class TestArmsExportController extends ArmsExportController {
  constructor(
    public serviceRegister: ArmsServiceRegister = new TestArmsServiceRegister(),
    public metadataRegister: ArmsMetaDataRegister = new TestArmsMetaDataRegister()
  ) {
    super({ endpoint: 'test', ip: '' });
  }
}
