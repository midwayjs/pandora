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

  argv(): any[];
  argv(argv: any[]): ProcessRepresentationChainModifier
  argv(argv?): any {
    if(!argv) {
      return this.representation.argv;
    }
    this.representation.argv = argv;
    return this;
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

