// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import LiveView from '@/views/Live.vue'; // Assuming Live.vue is in src/views
import AdminIndex from '@/views/index.vue'; // This will become the specific match management page
import TeamsManagement from '@/views/TeamsManagement.vue';
import ScheduleManagement from '@/views/ScheduleManagement.vue';
// import MembersManagement from '@/views/MembersManagement.vue'; // If you create a separate one

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // New route for live view with DO ID
      path: '/live/:matchDOId',
      name: 'live-match',
      component: LiveView,
      props: true // Pass route params as props to the component
    },
     {
      // Keep base live route, maybe redirect or show a message
      path: '/live',
      name: 'live-base',
      redirect: { name: 'admin-schedule' } // Redirect to schedule if no ID is provided
      // Alternatively, you could create a simple component here explaining how to view a match
    },
    {
      // New route for admin management of a specific match DO
      path: '/admin/live-match/:matchDOId',
      name: 'admin-live-match',
      component: AdminIndex, // Use the existing AdminIndex component
      props: true // Pass route params as props to the component
    },
    {
      // Keep base admin route, maybe redirect or show a message
      path: '/admin',
      name: 'admin-index',
      redirect: { name: 'admin-schedule' } // Redirect to schedule if no ID is provided
      // Alternatively, you could create a simple component here explaining how to select a match
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
