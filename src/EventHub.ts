type Handler<E> = (data: E) => void

interface Emiter {
    [key: string]: any
}

class EventListener {
    public eventName: string
    public emitter: EventHub<any> | null
    public handler: Handler<any> | null
    public distoried: boolean = false
    constructor(eventName: string, handler: Handler<any>, emitter: EventHub<any>) {
        this.eventName = eventName
        this.handler = handler
        this.emitter = emitter
    }

    public unregister() {
        this.emitter?.off(this.eventName, this)
        this.distory()
    }

    public distory(): boolean {
        if (this.distoried) {
            return false
        }
        this.handler = null
        this.emitter = null
        this.distoried = true
        return true
    }
}

export class EventHub<E extends Emiter> {
    private cached: { [name in keyof E]: EventListener[] } = {} as any

    /**
     * @param: 监听的事件名
     * @param: 事件的处理函数, 在事件触发时会被调用
     */
    public on<N extends keyof E>(eventName: N, handler: Handler<E>) {
        if (!handler) {
            throw new Error('invaild handler')
        }
        if (!this.cached[eventName]) {
            this.cached[eventName] = []
        }
        const listener = new EventListener(eventName as string, handler, this)
        this.cached[eventName].push(listener)
    }

    /**
     * @param eventName: 触发事件的名称
     */
    public emit<N extends keyof E>(eventName: N, data: E[N] | null = null) {
        const listeners = this.cached[eventName]
        listeners?.forEach((listener) => {
            listener.handler?.call(this, data)
        })
    }

    /**
     * 一次性的事件监听,不会被进入事件缓存中,使用后会自动销毁
     * @param: 监听的事件名
     * @param: 事件的处理函数, 在事件触发时会被调用
     */
    public once<N extends keyof E>(eventName: N, handler: Handler<E>) {
        if (!handler) {
            throw new Error('invaild handler')
        }
        if (!this.cached[eventName]) {
            this.cached[eventName] = []
        }
        const listener = new EventListener(eventName as string, (data) => {
            handler(data)
            this.off(eventName, listener)
        }, this)
        this.cached[eventName].push(listener)
    }

    /**
     * @param eventName: 注销事件的名称
     * @param target: 需要注销的事件
     * 不传入 target 默认注销整个事件
     */
    public off<N extends keyof E>(eventName: N, target?: EventListener): boolean {
        if (!this.cached[eventName]) {
            return false
        }
        if (target) {
            for (let listeners = this.cached[eventName], i = 0; i < listeners.length; i++) {
                const listener = listeners[i]
                if (listener !== target) {
                    continue
                }
                this.cached[eventName] = this.cached[eventName].filter((l) => {
                    return l !== listener
                })
                listener.distory()
            }
            if (this.cached[eventName].length === 0) {
                delete this.cached[eventName]
                return true
            }
            return false
        } else {
            //TODO:待优化
            this.cached[eventName] = []
            delete this.cached[eventName]
            return true
        }
    }
}
