import './assets/main.css'
import store from './store/index'
import router from './router/router'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App)
    .use(store)
    .use(router)
    .mount('#app')
