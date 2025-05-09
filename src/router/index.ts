// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AdminLayout from '@/layouts/AdminLayout.vue';
import DashboardPage from '@/views/admin/DashboardPage.vue';
import TeamListPage from '@/views/admin/teams/TeamListPage.vue';
import MemberListPage from '@/views/admin/members/MemberListPage.vue';
import ScheduleListPage from '@/views/admin/schedule/ScheduleListPage.vue';
import LiveMatchControlPage from '@/views/admin/live/LiveMatchControlPage.vue';
import MatchHistoryPage from '@/views/admin/history/MatchHistoryPage.vue';
import LiveDisplayPage from '@/views/LiveDisplayPage.vue'; // Import Live Display Page
import NotFoundPage from '@/views/NotFoundPage.vue';

// Temporarily bypass auth guard for development
const requireAuth = (to: any, from: any, next: any) => {
  console.warn("Auth guard is currently bypassed for development.");
  // TODO: Implement actual Kinde auth check here
  // const authStore = useAuthStore();
  // if (!authStore.isAuthenticated) {
  //   next({ name: 'Login' }); // Redirect to login if not authenticated
  // } else {
     next(); // Allow access
  // }
};

const routes: Array<RouteRecordRaw> = [
  // Admin Routes
  {
    path: '/admin',
    component: AdminLayout,
    // beforeEnter: requireAuth, // Apply auth guard when ready
    children: [
      {
        path: '', // Default /admin route
        name: 'AdminDashboard',
        component: DashboardPage,
        meta: { title: '仪表盘' },
      },
      {
        path: 'teams',
        name: 'AdminTeams',
        component: TeamListPage,
        meta: { title: '队伍管理' },
      },
      // Team Detail page (if needed, or manage members via modal on TeamListPage)
      // {
      //   path: 'teams/:teamId',
      //   name: 'AdminTeamDetail',
      //   component: TeamDetailPage, // Need to create TeamDetailPage.vue
      //   props: true,
      //   meta: { title: '队伍详情' },
      // },
      {
        path: 'members',
        name: 'AdminMembers',
        component: MemberListPage,
        meta: { title: '选手管理' },
      },
      {
        path: 'schedule',
        name: 'AdminSchedule',
        component: ScheduleListPage,
        meta: { title: '赛程管理' },
      },
      {
        path: 'live-match/:doIdString', // Route for controlling a specific live match DO
        name: 'AdminLiveMatchControl',
        component: LiveMatchControlPage,
        props: true, // Pass doIdString as a prop
        meta: { title: '比赛控制台' },
      },
       {
        path: 'match-history',
        name: 'AdminMatchHistory',
        component: MatchHistoryPage,
        meta: { title: '比赛历史' },
      },
    ],
  },

  // Live Display Route
  {
    path: '/live/:doIdString?', // Optional DO ID in path, or use query param
    name: 'LiveDisplay',
    component: LiveDisplayPage,
    props: true, // Pass doIdString as a prop if in path
    meta: { title: '比赛直播' },
  },
   // Alternative Live Display route using query param:
   // {
   //   path: '/live',
   //   name: 'LiveDisplay',
   //   component: LiveDisplayPage,
   //   meta: { title: '比赛直播' },
   //   // Access ID via route.query.matchId in component
   // },


  // Root redirect
  {
    path: '/',
    redirect: '/admin', // Redirect root to admin dashboard
  },

  // 404 Page
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: NotFoundPage,
    meta: { title: '页面未找到' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Global after hook to update page title
router.afterEach((to) => {
  const defaultTitle = 'NGU3rd';
  document.title = to.meta.title ? `${to.meta.title} - ${defaultTitle}` : defaultTitle;
});

export default router;
