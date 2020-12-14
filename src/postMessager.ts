/// <reference path="index.d.ts" />
import { resolveOrigin, postMessage, SupportPostMessage} from './util'
import { EventHub } from './EventHub';
interface Options {
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
  [sym]?: MessageClient
}
type MessageClientTarget = container
let uid = 0;
function IDgenerator(prefix: string) {
  return `${prefix}${uid++}`;
}
const CONNECT_MAX_COUNT = 3
enum SessionStatus  {
  close,
  keep,
  init
}
class Session {
  readonly id: string;
  readonly origin: container;
  readonly getTarget: getTarget;
  readonly clientId: ClientId;
  readonly domain: string;
  private connetCount: number = 0
  private status: SessionStatus = SessionStatus.init;
  private messageFun?: (event: MessageEvent) => void | undefined
  private interval: number = 0;
  private sendData: (data: Message) => void 
  private eventHubMap: Record<string, EventHub<any>> | undefined = {}
  constructor(clientId: ClientId, origin: container, getTarget: getTarget, domain: string) {
    this.id = IDgenerator('Session')
    this.origin = origin
    this.getTarget = getTarget
    this.clientId = clientId
    this.domain = domain
    this.sendData = (message) => {
      const target = this.checkAndGetTarget()
      postMessage(target, message, this.domain)
    }
    const target = this.checkAndGetTarget()
    if (target) {
      target.addEventListener('load', () => {
        this.doHeartbeatDetect()
      })
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
    this.interval = window.setInterval(() => {
      this.doOneHeartbeat()
      if (this.connetCount > CONNECT_MAX_COUNT) {
        this.status = SessionStatus.close
        console.warn('连接失败')
        clearInterval(this.interval)
      } else {
        this.connetCount++
      }
    }, maxTime)
  }
  /* 
    执行一次心跳操作, 创建一个新的Promise对象
  */
  private doOneHeartbeat(): Promise<SessionStatus>{
    // 发起握手请求
    return new Promise<SessionStatus>((resolve, reject) => {
        if (this.status === SessionStatus.close) {
          reject('连接失败')
          return
        }
        this.sendData({
          clientId: this.clientId,
          data: {},
          type: MessageType.heartbeat,
          sessionId: this.id
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
              console.log('连接成功')
            }
          }
        }
        this.origin.addEventListener('message', this.messageFun)
      })
  }
  destroy() {
    this.eventHubMap = undefined
  }
  send(data: Data) {
    const sendMessge = () => {
      this.sendData({
        clientId: this.clientId,
        data,
        type: MessageType.request,
        sessionId: this.id
      })
    }
    this.status = SessionStatus.init
    this.doOneHeartbeat().then(() => {
      // 连接恢复,重新建立心跳探测
      this.doHeartbeatDetect()
      sendMessge()
    }).catch(() => {
      console.error('发送失败')
    })
  }
}
export default class MessageClient {
  readonly id: ClientId = IDgenerator('MessageClient');
  send() {}
  container!: Options["container"];
  domain!: Options["domain"];
  // sessionPool: Map<string, Session> = new Map()

  // 连接, 需要主动调用
  connect(getTarget: getTarget): Session{
    if (typeof getTarget !== 'function') {
      throw new Error('connect方法缺少getTarget参数')
    }
    return new Session(this.id, this.container, getTarget, this.domain)
  }
  // 响应,自动调用
  heartbeatReply(message: Message, source: MessageEventSource) {
    // 校验回复类型和id, id就可以区别
    const sessionId = message.sessionId
    if (source) {
      postMessage(<Window>source, {
        clientId: message.clientId,
        data: { result: true },
        type: MessageType.heartbeatReply,
        sessionId: sessionId
      }, this.domain)
    }
  }
  /**
   * name
   */
  public static warn(...args: any[]) {
    console.warn(args)
  }
  private static initListener(client: MessageClient) {
    client?.container?.addEventListener('message', (event: MessageEvent) => {
      if (!checkOriginEq(client.domain, event.origin)){
        MessageClient.warn('消息来源的origin与当前domain不一致, 消息被丢弃')
        return;
      }
      
      const source = event.source
      const message = resolveMessageData(event.data)
      console.log(message, 'message')
      switch (message.type) {
        case MessageType.heartbeat:
          // 收到心跳请求，
          client.heartbeatReply(message, <Window>source)
          break;
        case MessageType.heartbeatReply:
          break;
        case MessageType.reply:
          break;
        case MessageType.request:
          break;
        default:
          throw new Error(`未定义的消息类型:${message.type}`);
      }
    }, false)
  }
  constructor({ container, domain }: Options = { container: window, domain: location.href}) {
    if (!container) {
      throw new Error('请传入container参数')
    }
    if (!SupportPostMessage(container)) {
      throw new Error('您的浏览器不支持postMessage')
    }
    // 每个window只有一个client实例
    if (container[sym]) {
      return container[sym] as this
    }
    this.container = container
    this.container[sym] = this
    this.domain = resolveOrigin(domain)
    MessageClient.initListener(this)
  }
}
const resolveMessageData = (message: Message) => {
  // TODO
  return message
}
const checkOriginEq = function (origin:string, targetOrigin: string) {
  return resolveOrigin(origin) === resolveOrigin(targetOrigin)
}
