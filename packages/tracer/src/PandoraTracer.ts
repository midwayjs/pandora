import { Tracer } from 'opentracing';
import { PandoraSpan } from './PandoraSpan';

export class PandoraTracer extends Tracer {
  
  startSpan(operationName: string, options: SpanOptions): PandoraSpan {
    
  }
}