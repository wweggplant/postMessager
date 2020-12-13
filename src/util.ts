// import { Message } from "./type"
/// <reference path="index.d.ts" />
let _messageId = 0
export const messageType = 'application/x-postmessager+json'

export const generateMessageId = () => ++_messageId

export const log = (...args: any[]) =>  console.log(...args)
export const warn = (...args: any[]) =>  console.warn(...args)

export const devLog = function(message: string, name: string = 'default'){
  if (process.env.NODE_ENV !== 'production') {
    log(`${name}：`, message)
  }
}

/**
 * Takes a URL and returns the origin
 * @param  {String} url The full URL being requested
 * @return {String}     The URLs origin
 */
export const resolveOrigin = (url: string = ''): string => {
  const a = document.createElement('a')
  a.href = url
  const protocol = a.protocol.length > 4 ? a.protocol : window.location.protocol
  const host = a.host.length ? ((a.port === '80' || a.port === '443') ? a.hostname : a.host) : window.location.host
  return a.origin || `${protocol}//${host}`
}


export const SupportPostMessage = function (win: Window) {
  return 'postMessage' in win
}
/* 
  可以参考: https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage
*/
export const postMessage = function (win: Window, data: Message, targetOrigin: string = '') {
  if (SupportPostMessage(win)) {
    win.postMessage(data, targetOrigin)
  } else {
    log('您的浏览器不支持postMessage')
  }
}

/**
 * Ensures that a message is safe to interpret
 * @param  {Object} message The postmate message being sent
 * @param  {String|Boolean} allowedOrigin The whitelisted origin or false to skip origin check
 * @return {Boolean}
 */
/* const messageTypes = {
  handshake: 1,
  'handshake-reply': 1,
  call: 1,
  emit: 1,
  reply: 1,
  request: 1,
}

export const sanitize = (message: MessageEvent, allowedOrigin: string) => {
  if (
    typeof allowedOrigin === 'string' &&
    message.origin !== allowedOrigin
  ) return false
  if (!message.data) return false
  if (
    typeof message.data === 'object' &&
    !('postmate' in message.data)
  ) return false
  if (message.data.type !== messageType) return false
  // if (!messageTypes[message.data.postmate]) return false
  return true
} */