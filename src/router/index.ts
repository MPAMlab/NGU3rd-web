import { createRouter, createWebHistory } from 'vue-router';
import IndexView from '../views/Index.vue';
import LiveView from '../views/Live.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // BASE_URL is usually '/'
  routes: [
    {
      path: '/',
      name: 'admin',
      component: IndexView,
    },
    {
      path: '/live',
      name: 'live',
      component: LiveView,
    },
    // You can add a 404 route later
    // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFound.vue') }
  ],
});

export default router;
