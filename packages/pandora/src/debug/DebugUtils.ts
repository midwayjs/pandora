export class DebugUtils {

  static get isUnderPandoraDev() {
    return !!process.env.PANDORA_DEV;
  }

  static attachExecArgv(targetArgv: string[]) {

    for(const arg of process.execArgv) {
      if(arg.startsWith('--inspect-brk=')) {
        targetArgv.push('--inspect-brk=0');
        break;
      }
      if(arg.startsWith('--inspect=')) {
        targetArgv.push('--inspect=0');
        break;
      }
    }

  }

}