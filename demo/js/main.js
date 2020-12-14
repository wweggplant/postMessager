const p = new PostMessager({name: 'main', container: window, domain: location.href })
const session = p.connect(() => document.querySelector('iframe').contentWindow)
session.send({
  name: 'test'
})
session.reply(function(message) {
  console.log(message.data, '来自孩子的消息')
  return message
})