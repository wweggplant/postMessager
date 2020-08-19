import { resolveOrigin, postMessage, SupportPostMessage, generateMessageId, devLog, warn } from './util'
import {
  PostMessagerConfig,
  Message,
  listenersMap,
  BaseMessageBackend,
  sendConfig 
} from "./type";

/* const checkBuiltEvent = function(event: string): boolean {
  return ['receive'].indexOf(event) > -1
} */
const checkOriginEq = function (origin:string, targetOrigin: string) {
  return resolveOrigin(origin) === resolveOrigin(targetOrigin)
}
export class MessageBackend extends BaseMessageBackend{
  constructor(config: PostMessagerConfig) {
    super()
    if(!SupportPostMessage(window)) {
      warn('您的浏览器不支持postMessage')
      return;
    }
    if (!config.id) {
      warn('请输入name属性作为标识')
      return
    }
    this.id = config.id
    this.host = config.host || window
    this.target = config.target
    this.targetId = config.targetId
    this.origin = config.origin || resolveOrigin()
    // 绑定事件
    this.initListener();
  }

  private initListener() {
    // 初始化事件绑定
    const listenersHandler = (event: MessageEvent) => {
        if (!checkOriginEq(this.origin, event.origin))
            return;
        // 触发事件
    }
    this.host.addEventListener('message', listenersHandler, false)
  }
  /* 
    本质上,send方法就是出发一次once事件
  */
  send(id: string, message: any, config?: sendConfig) {
    if (!this.target) {
      warn('缺少target参数')
      return
    }
    let orgin = config?.origin || '*'
    const _message: Message = {
      content: message,
      toStr: id,
      eventName: 'receive',
      fromStr: this.id,
      id: generateMessageId()
    }
    postMessage(<Window>(this.target), _message, orgin)
  }
}
