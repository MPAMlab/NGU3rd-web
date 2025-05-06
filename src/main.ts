import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// Optional: Import a global CSS file if you have one
// import './assets/main.css' 

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
