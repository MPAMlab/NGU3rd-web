// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import LiveView from '@/views/Live.vue'; // Assuming Live.vue is in src/views
import AdminIndex from '@/views/index.vue'; // Assuming Index.vue is in src/views
import TeamsManagement from '@/views/TeamsManagement.vue';
import ScheduleManagement from '@/views/ScheduleManagement.vue';
// import MembersManagement from '@/views/MembersManagement.vue'; // If you create a separate one

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/live',
      name: 'live',
      component: LiveView,
    },
    {
      path: '/admin',
      name: 'admin-index',
      component: AdminIndex,
    },
    {
        path: '/admin/teams',
        name: 'admin-teams',
        component: TeamsManagement,
    },
     {
        path: '/admin/schedule',
        name: 'admin-schedule',
        component: ScheduleManagement,
    },
    // {
    //     path: '/admin/members', // If you create a separate global members page
    //     name: 'admin-members',
    //     component: MembersManagement,
    // },
    // Add other routes as needed
  ],
});

export default router;
