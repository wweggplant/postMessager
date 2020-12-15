/* const p = new PostMessager({name: 'child', container: window, domain: location.href })

const session = p.listen(() => window.parent)
session.reply(function(message) {
  console.log(message.data, '来自父亲的消息')
  return message
})
 */

let child;
let session;
const ref = Vue.ref
let app = Vue.createApp({
  setup() {
    let messageFromOrther = ref('')
    let dataFromOrther = ref(null)
    Vue.onMounted(function () {
      child = new PostMessager({
        name: 'child',
        container: window,
        domain: location.href
      });
      session = child.listen(() => window.top)
      session.reply(function(message) {
        messageFromOrther.value = message.data.message
        dataFromOrther.value = JSON.stringify(message.data)
        return message
      })
    })
    return {
      messageFromOrther,
      dataFromOrther
    }
  },
  data() {
    return {
      form: {
        message: ''
      }
    }
  },
  methods: {
    send() {
      session.send({ text:  this.form.message })
    }
  }
})
app.use(antd);
app.mount("#app");