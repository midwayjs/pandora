import { PandoraSpanContext } from '../PandoraSpanContext';

export interface PandoraCodec {
  name: string;

  /**
   * 将上下文的信息放到 carrier 中传递出去
   * @param context {PandoraSpanContext} - 目标上下文
   * @param carrier {any} - 信息承载体
   */
  inject(context: PandoraSpanContext, carrier: any): void;
  /**
   * 将 carrier 携带的信息放到上下文中
   * @param carrier {any} - 请求
   * @returns {PandoraSpanContext} - 上下文对象
   */
  extract(carrier: any): PandoraSpanContext;
}