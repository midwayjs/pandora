import * as grpc from 'grpc';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import { MetricDescriptor, Point } from '@opentelemetry/metrics';
import { Labels } from '@opentelemetry/api';
import { InstrumentationLibrary } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';

export interface ServiceInstance {
  resource: opentelemetryProto.resource.v1.Resource;
  startTimestamp: number;
}

export interface BatchStringMeta {
  resource: opentelemetryProto.resource.v1.Resource;
  metas: opentelemetryProto.common.v1.StringKeyValue[];
}

export enum Code {
  //成功
  OK = 0,
  //非法的licenseKey
  INVALID_LICENSE_KEY = 1,
  //指定服务不存在
  SERVICE_NOT_EXIST = 2,
  //其他错误
  OTHER = 15,
}

export interface Response {
  success: boolean;
  code: Code;
  msg: string;
}

export interface ErrorResponse extends Error {
  code: Code;
  metadata: grpc.Metadata;
  details: string;
}

export interface ArmsRegisterClient {
  registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ): unknown;
  registerBatchStringMeta(
    batchStringMeta: BatchStringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ): unknown;
}

export interface PlainMetricRecord {
  readonly descriptor: MetricDescriptor;
  readonly labels: Labels;
  readonly point: Point;
  readonly resource: Resource;
  readonly instrumentationLibrary: InstrumentationLibrary;
}
