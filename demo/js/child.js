const p = new PostMessager({name: 'child', container: window, domain: location.href })

const session = p.listen(() => window.parent)
session.reply(function(message) {
  console.log(message.data, '来自父亲的消息')
  return message
})