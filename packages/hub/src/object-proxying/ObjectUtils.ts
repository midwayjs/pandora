import {ObjectDescription} from '../domain';

export class ObjectUtils {
  static objectDescriptionToId (objectDescription: ObjectDescription) {
    const id = objectDescription.name + objectDescription.tag ? ( ':' + objectDescription.tag ) : '';
    return id;
  }
}