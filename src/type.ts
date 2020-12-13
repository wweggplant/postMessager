export interface PostMessagerConfig{ 
  host: Window;
  target: Window;
  origin: string;
  id: string; //唯一标识
  targetId: string; //唯一标识
}
// export interface Message{
//   content: any;
//   fromStr: string;
//   toStr: string;
//   eventName: string; // 事件类型
//   id: number;
//   event?: MessageEvent;
// } 
export interface listenersMap {
  [prop: string]: listenerObject;
}
export interface listenerObject {
  listeners?: Array<Function>;
}
export interface sendConfig {
  origin: string;
}

export abstract class BaseMessageBackend{
  protected host: Window = window
  protected target: Window | null = null
  protected origin: string = ''
  protected id: string = '' // 标识
  protected targetId: string = '' // 标识
  constructor() {

  }
  send(id: string, message: any, config?: sendConfig) :void {
    
  }
  broadcast(message: any) {

  }
}