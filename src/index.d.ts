type ClientId = string
interface HandshakeReply {
    result: boolean 
}
type Data = string | Record<any, any> | Array<any> | HandshakeReply
interface Message {
    data: Data
    clientId: ClientId // 实例的id,主要用来在同一个同一source下监听message, 区别不同实例传过来的消息
    type: number
    sessionId: string;
}