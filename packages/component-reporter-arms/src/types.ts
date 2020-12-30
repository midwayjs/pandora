import * as grpc from 'grpc';
import { opentelemetryProto } from '@opentelemetry/exporter-collector/build/src/types';
import {
  AggregatorKind,
  MetricDescriptor,
  Point,
} from '@opentelemetry/metrics';
import { Labels } from '@opentelemetry/api';
import { InstrumentationLibrary } from '@opentelemetry/core';
import { Resource } from '@opentelemetry/resources';

export interface ServiceInstance {
  resource: opentelemetryProto.resource.v1.Resource;
  startTimestamp: number;
}

export interface StringMeta {
  resource: opentelemetryProto.resource.v1.Resource;
  id: string;
  value: string;
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

export interface RegisterServiceInstanceResp extends Response {
  pid: string;
}

export interface ErrorResponse extends Error {
  code: Code;
  metadata: grpc.Metadata;
  details: string;
}

export interface ArmsMetaDataRegister {
  registerStringMeta(
    batchStringMeta: StringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ): unknown;
  registerBatchStringMeta(
    batchStringMeta: BatchStringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ): unknown;
}

export interface ArmsServiceRegister {
  registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: RegisterServiceInstanceResp) => void
  ): unknown;
}

export type AnyPoint = Point<any>;
export interface PlainMetricRecord {
  readonly descriptor: MetricDescriptor;
  readonly labels: Labels;
  readonly aggregatorKind: AggregatorKind;
  readonly point: AnyPoint;
  readonly resource: Resource;
  readonly instrumentationLibrary: InstrumentationLibrary;
}

export type AggregationTemporality = opentelemetryProto.metrics.v1.AggregationTemporality;
export const AggregationTemporality =
  opentelemetryProto.metrics.v1.AggregationTemporality;
