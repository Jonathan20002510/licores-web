import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './services/http'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
setUnauthorizedHandler(() => router.push('/login'))
app.mount('#app')
