import {ProcessRepresentation} from '../domain';

export class ProcessRepresentationChainModifier {

  representation: ProcessRepresentation;

  constructor(representation: ProcessRepresentation) {
    this.representation = representation;
  }

  name(name): ProcessRepresentationChainModifier {
    this.representation.processName = name;
    return this;
  }

  scale(scale): ProcessRepresentationChainModifier {
    this.representation.scale = scale;
    return this;
  }

  env(env): ProcessRepresentationChainModifier {
    this.representation.env = env;
    return this;
  }

  mode(mode): ProcessRepresentationChainModifier {
    this.representation.mode = mode;
    return this;
  }

  argv(argv): ProcessRepresentationChainModifier {
    this.representation.argv = argv;
    return this;
  }

  order(order): ProcessRepresentationChainModifier {
    this.representation.order = order;
    return this;
  }

}
