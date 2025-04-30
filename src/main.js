import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/layout.css'    // 全局引入

createApp(App)
    .use(router)
    .mount('#app')
