const debug = require('debug')('pandora:auto-patching:Shimmer');
/**
 * Fork from othiym23/shimmer, add support for generator function and async function
 * TODO: 待原包更新支持 Generator 和 async 方法后，使用原包
 */

export function isAsyncFunction(funktion) {
  return funktion && {}.toString.call(funktion) === '[object AsyncFunction]';
}

export function isGeneratorFunction(funktion) {
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

export function wrap(nodule, name, wrapper) {
  if (!nodule || !nodule[name]) {
    debug('no original function ' + name + ' to wrap');
    return;
  }

  if (!wrapper) {
    debug('no wrapper function');
    debug((new Error()).stack);
    return;
  }

  if (!isFunction(nodule[name]) || !isFunction(wrapper)) {
    debug('original object and wrapper must be functions');
    return;
  }

  const original = nodule[name];
  const wrapped = wrapper(original, name);

  defineProperty(wrapped, '__original', original);
  defineProperty(wrapped, '__unwrap', function() {
    /* istanbul ignore next */
    if (nodule[name] === wrapped) defineProperty(nodule, name, original);
  });
  defineProperty(wrapped, '__wrapped', true);

  defineProperty(nodule, name, wrapped);
  return wrapped;
}

export function massWrap(nodules, names, wrapper) {
  /* istanbul ignore next */
  if (!nodules) {
    debug('must provide one or more modules to patch');
    debug((new Error()).stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }

  if (!(names && Array.isArray(names))) {
    debug('must provide one or more functions to wrap on modules');
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
    debug('no function to unwrap.');
    debug((new Error()).stack);
    return;
  }

  if (!nodule[name].__unwrap) {
    debug('no original to unwrap to -- has ' + name + ' already been unwrapped?');
  } else {
    return nodule[name].__unwrap();
  }
}

export function massUnwrap(nodules, names) {
  /* istanbul ignore next */
  if (!nodules) {
    debug('must provide one or more modules to patch');
    debug((new Error()).stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }

  if (!(names && Array.isArray(names))) {
    debug('must provide one or more functions to unwrap on modules');
    return;
  }

  nodules.forEach(function(nodule) {
    names.forEach(function(name) {
      unwrap(nodule, name);
    });
  });
}