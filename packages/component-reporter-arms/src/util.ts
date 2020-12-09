import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as os from 'os';
import { ArmsMetaDataRegister, ArmsServiceRegister } from './types';

export function initWithGrpc(
  address: string
): Promise<[ArmsServiceRegister, ArmsMetaDataRegister]> {
  const credentials: grpc.ChannelCredentials = grpc.credentials.createInsecure();

  const includeDirs = [
    path.resolve(__dirname, 'protos'),
    path.resolve(
      path.dirname(
        require.resolve('@opentelemetry/exporter-collector-grpc/package.json')
      ),
      'build/protos'
    ),
  ];

  return protoLoader
    .load('opentelemetry/proto/arms/arms_service.proto', {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs,
    })
    .then(packageDefinition => {
      const packageObject = grpc.loadPackageDefinition(packageDefinition);

      const ArmsServiceRegisterClass = getGrpcService(
        packageObject,
        'com.alibaba.arms.base.ArmsServiceRegister'
      );
      const ArmsMetadataRegisterClass = getGrpcService(
        packageObject,
        'com.alibaba.arms.base.ArmsMetaDataRegister'
      );
      return [
        (new ArmsServiceRegisterClass(
          address,
          credentials
        ) as unknown) as ArmsServiceRegister,
        (new ArmsMetadataRegisterClass(
          address,
          credentials
        ) as unknown) as ArmsMetaDataRegister,
      ];
    });
}

function getGrpcService(
  grpcObject: grpc.GrpcObject,
  servicePath: string
): typeof grpc.Client {
  let obj: unknown = grpcObject;
  for (const p of servicePath.split('.')) {
    obj = obj[p];
  }
  return obj as typeof grpc.Client;
}

export function resolvePrimaryNetworkInterfaceIPv4Addr(): string | undefined {
  const ifaces = os.networkInterfaces();
  for (const [name, val] of Object.entries(ifaces)) {
    if (name.startsWith('lo')) {
      continue;
    }
    for (const iface of val) {
      if (iface.family !== 'IPv4') {
        continue;
      }
      return iface.address;
    }
  }
  return undefined;
}
