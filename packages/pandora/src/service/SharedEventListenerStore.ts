'use strict';
import assert = require('assert');
import * as $ from 'pandora-dollar';

export type RemoteListener = string;

export interface LocalListener {
  (payload: any): any;

  $remoteListener?: RemoteListener;
}

/**
 * SharedEventListenerStore
 * Mapping event's listener (callback) between remote and local
 */
export class SharedEventListenerStore {

  private remoteToLocal: Map<any, any>;

  constructor() {
    this.remoteToLocal = new Map();
  }

  /**
   * Register by remote listener
   * @param {RemoteListener} remoteListener
   * @param {LocalListener} localListener
   * @return {RemoteListener}
   */
  registerByRemoteListener(remoteListener: RemoteListener, localListener: LocalListener) {
    assert(!this.remoteToLocal.has(remoteListener));
    assert(!localListener.$remoteListener);
    localListener.$remoteListener = remoteListener;
    this.remoteToLocal.set(remoteListener, localListener);
    return remoteListener;
  }

  /**
   * Register by local listener
   * @param {LocalListener} localListener
   * @return {RemoteListener}
   */
  registerByLocalListener(localListener: LocalListener) {
    const remoteListener = $.genereateUUID();
    return this.registerByRemoteListener(remoteListener, localListener);
  }

  /**
   * Get remote listener by local listener
   * @param {LocalListener} localListener
   * @return {RemoteListener}
   */
  getRemoteListenerByLocalListener(localListener: LocalListener) {
    assert(localListener.$remoteListener);
    assert(this.remoteToLocal.has(localListener.$remoteListener));
    return localListener.$remoteListener;
  }

  /**
   * Get local listener by remote listener
   * @param {RemoteListener} remoteListener
   * @return {any}
   */
  getLocalListenerByRemoteListener(remoteListener: RemoteListener) {
    assert(this.remoteToLocal.has(remoteListener));
    return this.remoteToLocal.get(remoteListener);
  }

  /**
   * Determine it has that by local listener
   * @param {LocalListener} localListener
   * @return {boolean}
   */
  hasByLocalListener(localListener: LocalListener) {
    if (!localListener.$remoteListener) {
      return false;
    }
    return this.remoteToLocal.has(localListener.$remoteListener);
  }

  /**
   * Determine it has that by remote listener
   * @param {RemoteListener} remoteListener
   * @return {boolean}
   */
  hasByRemoteListener(remoteListener: RemoteListener) {
    return this.remoteToLocal.has(remoteListener);
  }

  /**
   * Delete by local listener
   * @param {LocalListener} localListener
   * @return {boolean}
   */
  deleteByLocalListener(localListener: LocalListener) {
    assert(localListener.$remoteListener);
    return this.remoteToLocal.delete(localListener.$remoteListener);
  }

  /**
   * Delete by remote listener
   * @param {RemoteListener} remoteListener
   * @return {boolean}
   */
  deleteByRemoteListener(remoteListener: RemoteListener) {
    return this.remoteToLocal.delete(remoteListener);
  }

}

