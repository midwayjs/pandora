import {State} from './const';

export type ProcessScale = number | 'auto';
export type CategoryReg = string | 'all' | 'weak-all';
export type Entry = string | {
  new(...x): any;
};

export interface EntryClass {
  new(...x): any;
}

// ************************
// Application and Process

export interface ApplicationRepresentation {
  appName: string;
  appDir: string;
  scale?: ProcessScale;
  globalEnv?: any;
  globalExecArgv?: any[];
  globalArgs?: any[];
  inspector?: true | {
    setPortOnly?: boolean;
    port?: number;
    host?: string;
  };
}

export interface ProcessRepresentation extends ApplicationRepresentation {
  processName: string;
  offset?: number;
  order?: number;
  scale?: ProcessScale;
  env?: any;
  execArgv?: any[];
  args?: any[];
  entryFileBaseDir?: string;
  entryFile?: string;
}

export interface ApplicationStructureRepresentation extends ApplicationRepresentation {
  process: Array<ProcessRepresentation>;
}



// ************************
// Daemon Introspection

export interface ApplicationIntrospectionResult {
  state: State;
  appName: string;
  appDir: string;
  appId: string;
  pids: number[];
  startCount: number;
  restartCount: number;
  uptime: number;
  representation?: ApplicationRepresentation;
  // the field complex for legacy, it is a alias of structure
  complex?: ApplicationStructureRepresentation;
  structure?: ApplicationStructureRepresentation;
  stdoutLogPath?: string;
}

export type VersionsIntrospectionResult = typeof process.versions & {
  pandora: string;
};

export interface DaemonIntrospectionResult {
  versions: VersionsIntrospectionResult;
  cwd: string;
  pid: number;
  uptime: number;
  loadedGlobalConfigPaths: string[];
  loadedEndPoints: string[];
  loadedReporters: string[];
}

export interface Monitor {
  start();
  stop();
}


