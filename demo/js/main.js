let p;
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
    return {
      data,
      messageFromOrther,
    }

  },
  data() {
    return {
      form: {
        message: '',
        data: '0'
      }
    }
  },
  methods: {
    send() {
      const data = this.data
      p.send('child', { message:  this.form.message, data:  getPlainObject(data[this.form.data]) })
    }
  }
})
function getPlainObject(data) {
  return JSON.parse(JSON.stringify(data))
}
app.use(antd);
app.mount("#app");