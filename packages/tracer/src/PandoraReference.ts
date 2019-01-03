import { Reference } from 'opentracing';
import { EagleeyeContext } from './EagleeyeContext';

export class EagleeyeReference extends Reference {
  protected _type: string;
  protected _referencedContext: EagleeyeContext;

  type(): string {
    return this._type;
  }

  referencedContext(): EagleeyeContext {
    return this._referencedContext;
  }

  constructor(type: string, referencedContext: EagleeyeContext) {
    super(type, referencedContext);
    this._type = type;
    this._referencedContext = referencedContext;
  }
}