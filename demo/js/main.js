let p
let child
const ref = Vue.ref
let app = Vue.createApp({
  setup() {
    let messageFromOrther = ref('')

    Vue.onMounted(function () {
      p = new PostMessager({
        id: 'parent',
        target: document.querySelector('iframe').contentWindow
      })
      p.on('receive', (content, event) => {
        messageFromOrther.value = content.text
      })
    })
    const list = [{ name: 'foo', age: 11}, { name: 'foo2', age: 12}]
    const obj1 = { name: 'foo', age: 11}
    let data = ref([obj1, list])
    let opener =ref(null)
    const openNewWin = (page) => {
      opener.value = window.open(page,"_blank","toolbar=yes, location=yes, directories=no, status=no, menubar=yes, scrollbars=yes, resizable=no, copyhistory=yes, width=400, height=400");
      child = new PostMessager({
        id: 'child2',
        target: opener.value,
        targetId: 'child1'
      });
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
    send() {
      const data = this.data
      p.send('child', { message:  this.form.message, data:  getPlainObject(data[this.form.data]) })
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