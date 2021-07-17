export const NORMAL_TRACE = 1;
export const SLOW_TRACE = 2;
export const TIMEOUT_TRACE = 6;
export const ERROR_TRACE = 8;
export const TRACER_TIMEOUT = 30 * 1000;
export const CURRENT_SPAN = Symbol('CURRENT_SPAN');
export const CURRENT_TRACER = Symbol('CURRENT_TRACER');
export const SKIP_RATE = Symbol('SKIP_RATE');