import {DefaultObjectProxyBehaviour} from './DefaultObjectProxyBehaviour';
import {ObjectDescription, ObjectProxyBehaviour} from '../domain';
import {ObjectUtils} from './ObjectUtils';

export class ObjectProxyBehaviourManager {

  protected idToBehaviour: Map<string, ObjectProxyBehaviour> = new Map();

  public setBehaviour(objectDescription: ObjectDescription, behaviour: ObjectProxyBehaviour) {
    const id = ObjectUtils.objectDescriptionToId(objectDescription);
    this.idToBehaviour.set(id, behaviour);
  }

  public removeBehaviour(objectDescription: ObjectDescription) {
    const id = ObjectUtils.objectDescriptionToId(objectDescription);
    this.idToBehaviour.delete(id);
  }

  public getBehaviour(objectDescription: ObjectDescription): ObjectProxyBehaviour {
    const id = ObjectUtils.objectDescriptionToId(objectDescription);
    if(this.idToBehaviour.has(id)) {
      return this.idToBehaviour.get(id);
    } else {
      return DefaultObjectProxyBehaviour;
    }
  }

  private static instance: ObjectProxyBehaviourManager;
  static getInstance() {
    if(!ObjectProxyBehaviourManager.instance) {
      ObjectProxyBehaviourManager.instance = new ObjectProxyBehaviourManager;
    }
    return ObjectProxyBehaviourManager.instance;
  }
}