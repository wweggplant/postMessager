import { PostMessager } from "./postMessager";
import {
  PostMessagerConfig,
  Message,
  listenersMap,
  BaseMessageBackend,
  sendConfig 
} from "./type";
export class Hub {
  private listenersMap: listenersMap = {
    receive: {
      listeners: []
    }
  }
  constructor() {
  }
  bindToMessage(client: PostMessager) {
    client
  }
  static createListenerObject(listenersMap: listenersMap, evtName: string) {
    listenersMap[evtName] = {
      listeners: []
    }
  }
  on(eventName:string, listener: Function) {
    let evtObj = this.listenersMap[eventName]
    if (!evtObj) {
      Hub.createListenerObject(this.listenersMap, eventName)
      evtObj = this.listenersMap[eventName]
    }

    if (listener) {
      evtObj.listeners?.push(listener)
    }
  }
  off(eventName:string, listener: Function) {
    const listeners = this.listenersMap[eventName].listeners
    if (listeners) {
      const index = listeners.findIndex(function (cb) {
        return listener === cb
      })
      if (index != -1) {
        listeners.splice(index, 1);
      }
    }
  }
  once(eventName:string, listener: Function) {
    let cb =  (data: any, event: MessageEvent) => {
      listener.call(this, data, event)
      this.off(eventName, cb)
    }
    this.on(eventName, cb)
  }
}