// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css'; // Import Tailwind CSS

// Kinde Vue SDK initialization (when ready)
// import { createKinde } from '@kinde-oss/kinde-vue';
// const kinde = createKinde({ /* Kinde config */ });

const app = createApp(App);

app.use(createPinia());
app.use(router);
// app.use(kinde); // Use Kinde plugin when ready

app.mount('#app');
