import {ObjectDescription} from '../domain';

export class ObjectUtils {
  /**
   * Convert ObjectDescription to it's stringify representation
   * @param {ObjectDescription} objectDescription
   * @return {string}
   */
  static objectDescriptionToId (objectDescription: ObjectDescription) {
    const id = objectDescription.name + (objectDescription.tag ? ( ':' + objectDescription.tag ) : '');
    return id;
  }
}