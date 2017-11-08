import {Introspection} from '../domain';

export class IntrospectionUtils {

  private static namesOfObject = getAllNames({});

  public static introspect(obj): Introspection {

    const allNames = getAllNames(obj);
    const properties = [];
    const methods = [];

    for(const name of allNames) {
      if(IntrospectionUtils.namesOfObject.indexOf(name) > -1) {
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
