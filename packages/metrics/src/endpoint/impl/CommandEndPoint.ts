import {EndPoint} from '../EndPoint';

export class CommandEndPoint extends EndPoint {
  group: string = 'command';

  commandStore = {};

  constructor() {
    // 发布 Math 到 IPC-Hub
    await publishObject('math', Math);
  }
}
