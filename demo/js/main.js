/* 
const p = new PostMessager({name: 'main', container: window, domain: location.href })
const session = p.connect(() => document.querySelector('iframe').contentWindow)
session.send({
  name: 'test'
})
session.reply(function(message) {
  console.log(message.data, '来自孩子的消息')
  return message
}) 
*/


let p
let session
let session2
let child
const ref = Vue.ref
let app = Vue.createApp({
  setup() {
    let messageFromOrther = ref('')

    Vue.onMounted(function () {
      p = new PostMessager({
        name: 'parent',
        container: window,
        domain: location.href
      })
      session = p.connect(() => document.querySelector('iframe').contentWindow)
      session.reply(function(message) {
        messageFromOrther.value = message.data.text
        return message
      })
    })
    const list = [{ name: 'foo', age: 11}, { name: 'foo2', age: 12}]
    const obj1 = { name: 'foo', age: 11}
    let data = ref([obj1, list])
    let opener =ref(null)
    const openNewWin = (page) => {
      opener.value = window.open(page,"_blank","toolbar=yes, location=yes, directories=no, status=no, menubar=yes, scrollbars=yes, resizable=no, copyhistory=yes, width=400, height=400");
      session2 = p.connect(() => opener.value)
    }
    return {
      data,
      opener,
      messageFromOrther,
      openNewWin
    }

  },
  data() {
    return {
      form: {
        newWinMessage: '',
        message: '',
        data: '0'
      },
      rules: {
        newWinMessage: [
          { validator: (rule, value, callback) => {
            if (!child) {
              return Promise.reject('请先点击「打开新窗口」按钮');
            }
            return Promise.resolve();
          }, trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    sendMessage() {
      session.send({
        message: this.form.message
      })
    },
    send() {
      session.send({
        data:  getPlainObject(this.data[this.form.data])
      })
    },
    sendNewWinMessage() {
      if (child){
        child.targetEmit('some-event', { text: this.form.newWinMessage })
      }
    }
  }
})
function getPlainObject(data) {
  return JSON.parse(JSON.stringify(data))
}
app.use(antd);
app.mount("#app");