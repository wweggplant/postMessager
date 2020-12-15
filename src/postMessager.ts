/// <reference path="index.d.ts" />
import { resolveOrigin, postMessage, SupportPostMessage} from './util'
import { EventHub } from './EventHub';
interface Options {
  name: string; // window的标志名字，用来区分不同的window
  container: container; // 默认当前的Window对象
  domain: string; // 默认当前的URL对象
}
type getTarget =  () => container
enum MessageType {
  heartbeat,
  heartbeatReply,
  reply,
  request
}
const sym  = Symbol("MessageClient");
interface container extends Window {
  [sym]?: PostMessager
}
let uid = 0;
function IDgenerator(prefix: string) {
  return `${prefix}-${uid++}`;
}
const CONNECT_MAX_COUNT = 3
enum SessionStatus  {
  close,
  keep,
  init
}
enum SessionMode {
  passive,
  initiative
}
interface Emiter extends Message{
  [key: string]: any
} 
const IS_DEV = process.env.NODE_ENV === 'development' ? true : false
const warn = (...args: any[]) => {
  console.warn(...args)
}
const depWarn = (...args: any[]) => {
  IS_DEV ? 
  warn(...args): 
  null
}
class Session {
  id?: string;
  readonly origin: container;
  readonly getTarget: getTarget;
  readonly clientId: ClientId;
  readonly domain: string;
  private connetCount: number = 0
  private status: SessionStatus = SessionStatus.init;
  private messageFun?: (event: MessageEvent) => void | undefined
  private interval: number = 0;
  private promise!: Promise<SessionStatus>;
  private mode: SessionMode;
  private sendData: (data: Message) => void 
  private eventHub: EventHub<Emiter>
  constructor(clientId: ClientId, origin: container, getTarget: getTarget, domain: string, mode: SessionMode = SessionMode.initiative) {
    this.mode = mode
    if (this.mode === SessionMode.initiative) {
      this.id = IDgenerator(`${clientId}-session`)
    }
    this.origin = origin
    this.getTarget = getTarget
    this.clientId = clientId
    this.domain = domain
    this.eventHub = new EventHub<Emiter>()
    this.sendData = (message) => {
      const target = this.checkAndGetTarget()
      message.id = IDgenerator(`${this.id}-message`);
      if (this.id) {
        message.sessionId = this.id
      }
      postMessage(target, message, this.domain)
    }
    const target = this.checkAndGetTarget()
    if (target.document.readyState === 'loading') {
      target.document.addEventListener('DOMContentLoaded', () => {
        // 主动模式下, session不用心跳检测
        if (target && this.mode === SessionMode.initiative) {
          this.doHeartbeatDetect()
        }
        this.initListeners()
      })
    } else {
      if (target && this.mode === SessionMode.initiative) {
        this.doHeartbeatDetect()
      }
      this.initListeners()
    }
  }
  checkAndGetTarget(): container{
    try {
      const target = this.getTarget.call(null)
      return target
    } catch (error) {
      if (this.interval) {
        clearInterval(this.interval)
      }
      throw new Error("Session没有获取到target");
    }
  }
  /* 
    执行心跳探测操作, 一次心跳操作如果显示连接成功的, this.connetCount重置为0
    否则this.connetCount++会超过允许的最大次数,则判断连接失败
    这样修改的原因是Promise对象状态一旦确定是不可改变的, 所以设计成为一次心跳新建一个Promise操作
  */
  private doHeartbeatDetect() {
    const maxTime = 500
    clearInterval(this.interval)
    const doInterval = () => {
      this.doOneHeartbeat()
      if (this.connetCount > CONNECT_MAX_COUNT) {
        this.status = SessionStatus.close
        warn('连接失败')
        clearInterval(this.interval)
      } else {
        this.connetCount++
      }
    }
    doInterval()
    this.interval = window.setInterval(doInterval, maxTime)
  }
  /* 
    执行一次心跳操作, 创建一个新的Promise对象
  */
  private doOneHeartbeat(): Promise<SessionStatus>{
    // 发起握手请求
    return new Promise<SessionStatus>((resolve, reject) => {
        if (this.status === SessionStatus.close) {
          reject('连接失败')
          this.eventHub.emit('link:error')
          return
        }
        this.sendData({
          clientId: this.clientId,
          data: {},
          type: MessageType.heartbeat,
          id: this.id
        })
        if (this.messageFun) {
          this.origin.removeEventListener('message', this.messageFun)
        }
        // 监听握手回复的消息
        this.messageFun = (event: MessageEvent) => {
          const message: Message = event.data
          // 校验回复类型和id, id就可以区别 
          if (message.type === MessageType.heartbeatReply && message.sessionId === this.id) {
            if ((<HandshakeReply>message.data).result === true) {
              // session建立成功
              if (this.status !== SessionStatus.keep) {
                this.status = SessionStatus.keep
              }
              resolve(this.status)
              this.connetCount = 0
              if (IS_DEV) {
                console.log('连接状态:保持')
              }
            }
          }
        }
        this.origin.addEventListener('message', this.messageFun)
      })
  }
  send(data: Data) {
    const sendMessge = () => {
      this.sendData({
        clientId: this.clientId,
        data,
        type: MessageType.request,
        id: this.id
      })
    }
    if (this.mode === SessionMode.passive) {
      // 被动模式不负责session管理,直接发送
      sendMessge()
    }
    // TODO 这里有待优化
    setTimeout(() => {
      if (this.status === SessionStatus.keep) {
        sendMessge()
      } else if (this.status === SessionStatus.close) {
        this.status = SessionStatus.init
        this.doOneHeartbeat().then(() => {
          // 连接恢复,重新建立心跳探测
          if (this.getTarget.call(null) && this.mode === SessionMode.initiative) {
            this.doHeartbeatDetect()
          }
          sendMessge()
        }).catch(() => {
          console.error('发送失败')
        })
      }
    }, 500)

  }
  // 回应请求
  reply(handler: (data: Emiter) => Message) {
    this.eventHub.on('request',(request: Message) => {
      if (handler) {
        const reply = handler(request)
        reply.type = MessageType.reply
        this.sendData(reply)
      }
    })
  }
  // 响应heartbeat请求,自动调用
  private replyHeartbeat(message: Message, source: MessageEventSource) {
    // 校验回复类型和id, id就可以区别
    if (!this.id) {
      this.id = message.sessionId // 被动方也有id了, 准备回复成功消息
    }
    if (source) {
      // 回复消息
      postMessage(<Window>source, {
        clientId: message.clientId,
        data: { result: true },
        type: MessageType.heartbeatReply,
        sessionId: this.id
      }, this.domain)
    }
  }
  on(type: any, handler: (data: Emiter) => void) {
    this.eventHub.on(type, handler)
  }
  // 回复消息
  private initListeners() {
    // message
    this.origin.addEventListener('message', (event: MessageEvent) => {
      if (!checkOriginEq(this.domain!, event.origin)){
        warn('消息来源的origin与当前domain不一致, 消息被丢弃')
        return;
      }
      const source = event.source
      const message = resolveMessageData(event.data)
      if (source !== this.getTarget.call(null)) {
        warn('消息来源的target与当前source不一致')
        return;
      }
      if (message.type !== MessageType.heartbeat &&  message.sessionId !== this.id) {
        depWarn('session的id不一致')
      }
      switch (message.type) {
        case MessageType.reply:
          this.eventHub.emit('reply', message)
          break;
        case MessageType.request:
          this.eventHub.emit('request', message)
          break;   
        case MessageType.heartbeat:
          this.replyHeartbeat(message, <Window>source)
          break;
        default:
          break;
      }
    }, false)
  }
  destroy() {
    delete this.eventHub
  }
}
export default class PostMessager {
  readonly id: ClientId = IDgenerator('MessageClient');
  container!: Options["container"];
  domain!: Options["domain"];
  // 连接, 需要主动调用
  connect(getTarget: getTarget): Session{
    if (typeof getTarget !== 'function') {
      throw new Error('connect方法缺少getTarget参数')
    }
    return new Session(this.id, this.container, getTarget, this.domain)
  }
  listen(getTarget: getTarget) {
    if (typeof getTarget !== 'function') {
      throw new Error('connect方法缺少getTarget参数')
    }
    return new Session(this.id, this.container, getTarget, this.domain, SessionMode.passive)
  }
  constructor({ container, domain, name }: Options = { container: window, domain: location.href, name: ''}) {
    if (!container) {
      throw new Error('请传入container参数')
    }
    if (!SupportPostMessage(container)) {
      throw new Error('您的浏览器不支持postMessage')
    }
    if (!name) {
      throw new Error('请传入name参数')
    }
    this.id = IDgenerator(`MessageClient-${name}`);
    // 每个window只有一个client实例
    if (container[sym]) {
      return container[sym] as this
    }
    this.container = container
    this.container[sym] = this
    this.domain = resolveOrigin(domain)
  }
}
const resolveMessageData = (message: Message) => {
  // TODO
  return message
}
const checkOriginEq = function (origin:string, targetOrigin: string) {
  return resolveOrigin(origin) === resolveOrigin(targetOrigin)
}
