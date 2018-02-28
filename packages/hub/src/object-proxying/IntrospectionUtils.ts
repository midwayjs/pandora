import {Introspection} from '../domain';

const SKIP_NAMES = ['subscribe', 'unsubscribe'];

export class IntrospectionUtils {

  private static namesOfObject = getAllNames({});

  /**
   * Introspect an Object, get the Definition of that Object
   * @param obj
   * @return {Introspection}
   */
  public static introspect(obj): Introspection {

    const allNames = getAllNames(obj);
    const properties = [];
    const methods = [];

    for(const name of allNames) {
      if(IntrospectionUtils.namesOfObject.indexOf(name) > -1 || SKIP_NAMES.indexOf(name) > -1) {
        continue;
      }
      if(typeof obj[name] === 'function') {
        methods.push({
          name: name,
          length: obj[name].length,
          type: IntrospectionUtils.isGenerator(obj[name]) ? 'generator' : 'function'
        });
      } else {
        properties.push({
          name: name,
          type: typeof obj[name]
        });
      }
    }
    return {properties, methods};

  }

  /**
   * decide a function is a generator function
   * @param fn
   * @return {boolean}
   */
  public static isGenerator(fn) {
    return fn.constructor.name === 'GeneratorFunction';
  }
}

function getAllNames(obj) {
  let props = [];
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
  } while (obj = Object.getPrototypeOf(obj));
  props = <string[]> [...new Set(props)];
  return props;
}
