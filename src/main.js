import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index'
import VueLazyLoad from 'vue3-lazyload'

const app = createApp(App)

app.use(router)

app.use(VueLazyLoad, {
  // === 优化建议 ===
  // 这里可以不填，或者填一个非常小的透明 Base64，防止出现浏览器默认的“图片破损”图标
  loading: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 
  error: '',   
  lifecycle: {
    loaded: (el) => {
      el.setAttribute('lazy', 'loaded')
    }
  }
})

app.mount('#app')
