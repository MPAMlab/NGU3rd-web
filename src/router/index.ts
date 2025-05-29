// src/router.ts (or src/router/index.ts)
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// Import your view components
import Home from '@/views/Home.vue';
import Teams from '@/views/Teams.vue';
import Songs from '@/views/Songs.vue';
import Schedule from '@/views/Schedule.vue';
import LiveMatch from '@/views/LiveMatch.vue'; // Assuming this is for viewing/controlling a live match
import MatchHistory from '@/views/MatchHistory.vue';
import MemberSongPrefs from '@/views/MemberSongPrefs.vue';
import NotFoundPage from '@/views/NotFoundPage.vue';
import Index from '@/views/index.vue';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: { title: '首页' },
  },
  {
    path: '/Home',
    name: 'Home',
    component: Home,
    meta: { title: '后台首页' },
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: { title: '队伍管理' },
  },
  {
    path: '/songs',
    name: 'Songs',
    component: Songs,
    meta: { title: '歌曲列表' },
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: Schedule,
    meta: { title: '赛程管理' },
  },
  {
    path: '/live-match/:doId', // Assuming 'doId' is the parameter for your live match view
    name: 'LiveMatch',
    component: LiveMatch,
    props: true, // Pass route params as props to the component
    meta: { title: '比赛直播/控制台' },
  },
  {
    path: '/match-history',
    name: 'MatchHistory',
    component: MatchHistory,
    meta: { title: '比赛历史' },
  },
  {
    path: '/member-song-prefs',
    name: 'MemberSongPrefs',
    component: MemberSongPrefs,
    meta: { title: '选手选曲偏好' },
  },
  // 404 Page - Must be the last route
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
      return { top: 0, behavior: 'smooth' };
    }
  },
});

// Global after hook to update page title
router.afterEach((to) => {
  const defaultTitle = 'NGU3rd 比赛系统'; // Set your default application title
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }
});

export default router;
