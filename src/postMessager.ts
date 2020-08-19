import { resolveOrigin, postMessage, SupportPostMessage, generateMessageId, devLog, warn } from './util'
import {
  PostMessagerConfig,
  Message,
  listenersMap,
  BaseMessageBackend,
  sendConfig 
} from "./type";
import { Hub } from './hub';
import { MessageBackend } from './MessagerBackend';

/* const checkBuiltEvent = function(event: string): boolean {
  return ['receive'].indexOf(event) > -1
} */
const checkOriginEq = function (origin:string, targetOrigin: string) {
  return resolveOrigin(origin) === resolveOrigin(targetOrigin)
}
export class PostMessager{
  private backend: BaseMessageBackend
  private hub: Hub
  constructor(config: PostMessagerConfig) {
    this.hub = new Hub();
    this.backend = new MessageBackend(config)
  }
  /* 
    本质上,send方法就是出发一次once事件
  */
  send(id: string, message: any, config?: sendConfig) {

  }
  on(eventName:string, listener: Function) {

  }
  off(eventName:string, listener: Function) {

  }
  once(eventName:string, listener: Function) {

  }
  targetEmit(eventName:string, data: any, event: MessageEvent) {

  }
  private _emit(eventName:string, data: any, event: MessageEvent) {
  }
}
