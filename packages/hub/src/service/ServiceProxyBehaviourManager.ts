import {DefaultServiceProxyBehaviour} from './DefaultServiceProxyBehaviour';
import {ServiceDescription, ServiceProxyBehaviour} from '../domain';
import {ServiceUtils} from './ServiceUtils';

export class ServiceProxyBehaviourManager {

  protected idToBehaviour: Map<string, ServiceProxyBehaviour> = new Map();

  public setBehaviour(serviceDescription: ServiceDescription, behaviour: ServiceProxyBehaviour) {
    const id = ServiceUtils.serviceDescriptionToId(serviceDescription);
    this.idToBehaviour.set(id, behaviour);
  }

  public removeBehaviour(serviceDescription: ServiceDescription) {
    const id = ServiceUtils.serviceDescriptionToId(serviceDescription);
    this.idToBehaviour.delete(id);
  }

  public getBehaviour(serviceDescription: ServiceDescription): ServiceProxyBehaviour {
    const id = ServiceUtils.serviceDescriptionToId(serviceDescription);
    if(this.idToBehaviour.has(id)) {
      return this.idToBehaviour.get(id);
    } else {
      return DefaultServiceProxyBehaviour;
    }
  }

  private static instance: ServiceProxyBehaviourManager;
  static getInstance() {
    if(!ServiceProxyBehaviourManager.instance) {
      ServiceProxyBehaviourManager.instance = new ServiceProxyBehaviourManager;
    }
    return ServiceProxyBehaviourManager.instance;
  }
}