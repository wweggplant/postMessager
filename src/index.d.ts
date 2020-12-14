type ClientId = string
interface HandshakeReply {
    result: boolean 
}
type Data = string | Record<any, any> | Array<any> | HandshakeReply
interface Message {
    id?: string; // message的id，消息回复时会有用
    replyId?: string; // 消息回复的id
    data: Data
    clientId: ClientId // 实例的id,主要用来在同一个同一source下监听message, 区别不同实例传过来的消息
    type: number
    sessionId: string;
}