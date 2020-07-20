import { resolveOrigin, postMessage, SupportPostMessage, generateMessageId, devLog, log, warn } from './util'

interface PostMessagerConfig{ 
  host: Window;
  origin: string;
  id: string; //唯一标识
}

interface Message{
  content: any;
  fromStr: string;
  toStr: string;
  eventName: string; // 事件类型
  id: number;
} 
interface listenersMap {
  [prop: string]: listenerObject;
}
interface listenerObject {
  listeners?: Array<Function>;
}
interface sendConfig {
  origin: string;
  otherWindow?: Window
}
const checkBuiltEvent = function(event: string): boolean {
  return ['receive'].indexOf(event) > -1
}
const checkOriginEq = function (origin:string, targetOrigin: string) {
  return resolveOrigin(origin) === resolveOrigin(targetOrigin)
}
export class PostMessager{
  private host: Window = window
  private origin: string = ''
  public id: string = '' // 标识
  private listenersMap!: listenersMap
  constructor(config: PostMessagerConfig) {
    if(!SupportPostMessage(window)) {
      log('您的浏览器不支持postMessage')
      return;
    }
    if (!config.id) {
      log('请输入name属性作为标识')
    }
    this.id = config.id
    this.host = config.host || window
    this.origin = config.origin || resolveOrigin()
    // 绑定事件
    this.initListener();
  }
  static createListenerObject(listenersMap: listenersMap, evtName: string) {
    listenersMap[evtName] = {
      listeners: []
    }
  }
  private initListener() {
    // 初始化事件绑定
    this.listenersMap = {
      receive: {
        listeners: []
      }
    }
    const listenersHandler = (event: MessageEvent) => {
        if (!checkOriginEq(this.origin, event.origin))
            return;
        // 触发事件
        const { toStr, eventName, content, globalMap} = event.data
        // 验证id或者to属性
        if (toStr === this.id) {
          this._emit(eventName, content, event)
        }
    }
    this.host.addEventListener('message', listenersHandler, false)
  }
  /* 
    本质上,send方法就是出发一次once事件
  */
  send(id: string, message: any, config?: sendConfig) {
    let orgin = config?.origin || '*'
    const _message: Message = {
      content: message,
      toStr: id,
      eventName: 'receive',
      fromStr: this.id,
      id: generateMessageId()
    }
    postMessage(config?.otherWindow || this.host, _message, orgin)
  }
  on(eventName:string, listener: Function) {
    const evtObj = this.listenersMap[eventName]
    if (!evtObj) {
        PostMessager.createListenerObject(this.listenersMap, eventName)
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
  emit(eventName:string, data: any, event: MessageEvent) {
    this._emit(eventName, data, event)
  }
  private _emit(eventName:string, data: any, event: MessageEvent) {
    const evtObj = this.listenersMap[eventName]
    if (!evtObj) {
        devLog('没有这个事件')
        return
    }
    evtObj.listeners?.forEach(cb => {
      cb.call(this, data, event)
    })
  }
}
