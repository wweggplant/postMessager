let child;
const ref = Vue.ref
let app = Vue.createApp({
  setup() {
    let messageFromOrther = ref('')
    let dataFromOrther = ref(null)
    Vue.onMounted(function () {
      child = new PostMessager({
        id: 'child',
        target: parent
      });
      child.on('receive', function(content, event) {
        messageFromOrther.value = content.message
        dataFromOrther.value = JSON.stringify(content.data)
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
      child.send('parent', { text:  this.form.message })
    }
  }
})
app.use(antd);
app.mount("#app");