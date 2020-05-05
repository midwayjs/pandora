import {DefaultObjectProxyBehaviour} from './DefaultObjectProxyBehaviour';
import {ObjectDescription, ObjectProxyBehaviour} from '../types';
import {ObjectUtils} from './ObjectUtils';

/**
 * ObjectProxyBehaviourManager
 * Unified management of all Object Proxy Behaviour through Remote and Proxy
 */
export class ObjectProxyBehaviourManager {

  protected idToBehaviour: Map<string, ObjectProxyBehaviour> = new Map();

  /**
   * Set a Behaviour for an ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ObjectProxyBehaviour} behaviour
   */
  public setBehaviour(objectDescription: ObjectDescription, behaviour: ObjectProxyBehaviour) {
    const id = ObjectUtils.objectDescriptionToId(objectDescription);
    this.idToBehaviour.set(id, behaviour);
  }

  /**
   * Remove a Behaviour by an ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ObjectProxyBehaviour} behaviour
   */
  public removeBehaviour(objectDescription: ObjectDescription) {
    const id = ObjectUtils.objectDescriptionToId(objectDescription);
    this.idToBehaviour.delete(id);
  }

  /**
   * Get the Behaviour by an ObjectDescription
   * Default as DefaultObjectProxyBehaviour if there not set Behaviour for this ObjectDescription
   * @param {ObjectDescription} objectDescription
   * @param {ObjectProxyBehaviour} behaviour
   */
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
