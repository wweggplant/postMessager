import util from './util'

interface PostMessagerConfig{ 
    container: Window
}

interface Message{
    content: any;
    from: PostMessager,
    to: PostMessager
}

export class PostMessager{
    private container: Window
    constructor(config: PostMessagerConfig) {
        this.container = config.container
        // 绑定事件
        this.container.addEventListener('message', this.messgeListener, false)
    }
    private messgeListener(event: MessageEvent) {
        // For Chrome, the origin property is in the event.originalEvent
        // object. 
        // 这里不准确，chrome没有这个属性
        // var origin = event.origin || event.originalEvent.origin; 
        var origin = event.origin
        const { property, uid, data } = event.data
        // ...
    }   
    send(target: PostMessager| string, message: any) {
        this.container.postMessage(message, target)
    }
    on(eventName, listener: Function) {

    }
}
