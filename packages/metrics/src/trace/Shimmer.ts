/**
 * Fork from othiym23/shimmer, support generator function and async function
 * 待原包更新支持 Generator 和 async 方法后，回归原包
 */

const debug = require('debug')('Pandora:Metrics:Shimmer');

function isAsyncFunction(funktion) {
  return funktion && {}.toString.call(funktion) === '[object AsyncFunction]';
}

function isGeneratorFunction(funktion) {
  const constructor = funktion.constructor;

  if (!constructor) {
    return false;
  }

  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) {
    return true;
  }

  return 'function' === typeof constructor.prototype.next && 'function' === typeof constructor.prototype.throw;
}

function isFunction(funktion) {
  return funktion && ({}.toString.call(funktion) === '[object Function]' || isGeneratorFunction(funktion) || isAsyncFunction(funktion));
}

// Default to complaining loudly when things don't go according to plan.
let logger = debug;

// Sets a property on an object, preserving its enumerability.
// This function assumes that the property is already writable.
function defineProperty(obj, name, value) {
  const enumerable = !!obj[name] && obj.propertyIsEnumerable(name);
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: enumerable,
    writable: true,
    value: value
  });
}

// Keep initialization idempotent.
export function shimmer(options) {
  if (options && options.logger) {
    if (!isFunction(options.logger)) logger('new logger isn\'t a function, not replacing');
    else logger = options.logger;
  }
}

export function wrap(nodule, name, wrapper) {
  if (!nodule || !nodule[name]) {
    logger('no original function ' + name + ' to wrap');
    return;
  }

  if (!wrapper) {
    logger('no wrapper function');
    logger((new Error()).stack);
    return;
  }

  if (!isFunction(nodule[name]) || !isFunction(wrapper)) {
    logger('original object and wrapper must be functions');
    return;
  }

  const original = nodule[name];
  const wrapped = wrapper(original, name);

  defineProperty(wrapped, '__original', original);
  defineProperty(wrapped, '__unwrap', function() {
    if (nodule[name] === wrapped) defineProperty(nodule, name, original);
  });
  defineProperty(wrapped, '__wrapped', true);

  defineProperty(nodule, name, wrapped);
  return wrapped;
}

export function massWrap(nodules, names, wrapper) {
  if (!nodules) {
    logger('must provide one or more modules to patch');
    logger((new Error()).stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }

  if (!(names && Array.isArray(names))) {
    logger('must provide one or more functions to wrap on modules');
    return;
  }

  nodules.forEach(function(nodule) {
    names.forEach(function(name) {
      wrap(nodule, name, wrapper);
    });
  });
}

export function unwrap(nodule, name) {
  if (!nodule || !nodule[name]) {
    logger('no function to unwrap.');
    logger((new Error()).stack);
    return;
  }

  if (!nodule[name].__unwrap) {
    logger('no original to unwrap to -- has ' + name + ' already been unwrapped?');
  } else {
    return nodule[name].__unwrap();
  }
}

export function massUnwrap(nodules, names) {
  if (!nodules) {
    logger('must provide one or more modules to patch');
    logger((new Error()).stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }

  if (!(names && Array.isArray(names))) {
    logger('must provide one or more functions to unwrap on modules');
    return;
  }

  nodules.forEach(function(nodule) {
    names.forEach(function(name) {
      unwrap(nodule, name);
    });
  });
}