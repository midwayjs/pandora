import {Selector, selectorSchema} from '../domain';

export class SelectorUtils {

  static match (selector: Selector, targetSelector: Selector) {

    let found = 0;
    let shouldFound = 0;

    for (const key of selectorSchema) {
      shouldFound++;
      if(!selector[key] || (selector[key] === targetSelector[key])) {
        found++;
      }
    }

    return shouldFound === found;

  }


}
