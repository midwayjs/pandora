import { IEndPoint } from '@pandorajs/component-actuator-server';
import { FileLoggerRotator } from './FileLoggerRotator';
import * as UUID from 'uuid';

export class FileLoggerEndPoint implements IEndPoint {
  prefix = '/file-logger';

  ctx: any;
  fileLoggerRotator: FileLoggerRotator;

  constructor(ctx, fileLoggerRotator: FileLoggerRotator) {
    this.ctx = ctx;
    this.fileLoggerRotator = fileLoggerRotator;
  }

  route(router) {
    router.get('/register', async (ctx, next) => {
      const query = ctx.query;
      const filePath = decodeURIComponent(query.filePath || '');
      const maxFileSize = parseInt(query.maxFileSize, 10) || 100 * 1024 * 1024;
      const rotateDuration =
        parseInt(query.rotateDuration, 10) || 10 * 60 * 1000;

      if (!filePath) {
        return ctx.fail('file path is need');
      }

      try {
        const uuid = UUID.v4();
        this.fileLoggerRotator.receiveStrategy({
          uuid,
          type: 'size-truncate',
          file: filePath,
          rotateDuration,
          maxFileSize,
        });
        ctx.ok(
          `add [${filePath}] rotate by size [${maxFileSize}] bytes with internal [${rotateDuration}]ms, uuid: [${uuid}].`
        );
      } catch (error) {
        ctx.fail(error.message);
      }
    });
  }
}
