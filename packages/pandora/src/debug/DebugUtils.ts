import {ProcessRepresentation} from '../domain';
import {parseInspectPort} from '../universal/Helpers';

const portOffset = 1;

export class DebugUtils {

  static get isUnderPandoraDev() {
    return !!process.env.PANDORA_DEV;
  }

  static attachExecArgv(representation: ProcessRepresentation, targetArgv: string[]) {

    const prefixes = ['--inspect=', '--inspect-brk='];
    const targetArgvNoInspect = [];
    argLoop: for(const arg of targetArgv) {
      for(const prefix of prefixes) {
        if(arg.startsWith(prefix)) {
          continue argLoop;
        }
      }
      targetArgvNoInspect.push(arg);
    }
    targetArgv.length = 0;
    targetArgv.push.call(targetArgv, targetArgvNoInspect);

    // Always works on daemon process
    for(const arg of process.execArgv) {
      for(const prefix of prefixes) {
        if(arg.startsWith(prefix)) {
          const value = arg.substring(prefix.length);
          const {host, port: parsedPort} = parseInspectPort(value);
          const port = (parsedPort || (<any> process).debugPort) + portOffset * (representation.index + 1);
          targetArgv.push(prefix + (host ? `${host}:${port}` : port) );
          return;
        }
      }
    }

    if(true === representation.inspector) {
      targetArgv.push('--inspect=0');
      return;
    }

    if(representation.inspector) {
      const inspector = representation.inspector;
      const host = inspector.host;
      const port = inspector.port ? inspector.port + portOffset * representation.index : null;
      if(host && port) {
        targetArgv.push(`--inspect=${host}:${port}`);
        return;
      }
      if(host) {
        targetArgv.push(`--inspect=${host}:0`);
        return;
      }
      if(port) {
        targetArgv.push(`--inspect=${port}`);
        return;
      }
    }

  }

}