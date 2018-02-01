import {ProcessRepresentation, ProcessScale} from '../domain';
import {ProcfileReconciler} from './ProcfileReconciler';

export class ProcessRepresentationChainModifier {

  representation: ProcessRepresentation;
  procfileReconciler: ProcfileReconciler;

  constructor(representation: ProcessRepresentation, procfileReconciler: ProcfileReconciler) {
    this.representation = representation;
    this.procfileReconciler = procfileReconciler;
  }

  name(): string;
  name(name: string): ProcessRepresentationChainModifier;
  name(name?): any {
    if(!name) {
      return this.representation.processName;
    }
    this.representation.processName = name;
    return this;
  }

  entry(): string;
  entry(entry: string): ProcessRepresentationChainModifier;
  entry(entry?): any {
    if(!entry) {
      return this.representation.entryFile;
    }
    this.representation.entryFile = entry;
    return this;
  }


  scale(): ProcessScale;
  scale(scale: ProcessScale): ProcessRepresentationChainModifier;
  scale(scale?): any {
    if(!scale) {
      return this.representation.scale;
    }
    this.representation.scale = scale;
    return this;
  }

  env(): any;
  env(env: any): ProcessRepresentationChainModifier;
  env(env?): any {
    if(!env) {
      return this.representation.env;
    }
    this.representation.env = env;
    return this;
  }

  args(): any[];
  args(args: any[]): ProcessRepresentationChainModifier;
  args(args?): any {
    if(!args) {
      return this.representation.args;
    }
    this.representation.args = args;
    return this;
  }

  nodeArgs(): any[];
  nodeArgs(nodeArgs: any[]): ProcessRepresentationChainModifier;
  nodeArgs(nodeArgs?): any {
    if(!nodeArgs) {
      return this.representation.execArgv;
    }
    this.representation.execArgv = nodeArgs;
    return this;
  }

  argv(argv?) {
    console.warn('Pandora.js: process().argv() has been deprecated, replace it to .nodeArgs()');
    return this.nodeArgs(argv);
  }

  order(): number;
  order(order: number): ProcessRepresentationChainModifier;
  order(order?): any {
    if(!order) {
      return this.representation.order;
    }
    this.representation.order = order;
    return this;
  }

  drop() {
    this.procfileReconciler.dropProcessByName(this.representation.processName);
  }

}

