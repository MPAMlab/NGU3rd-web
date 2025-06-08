// src/router.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
// Import the Pinia store
import { useAppStore } from '@/store'; // Import your Pinia store

// Import your view components
import Index from '@/views/MainSite.vue'; // Assuming this is your main registration/landing page
import Home from '@/views/Home.vue'; // Assuming this is a dashboard or authenticated home
import Teams from '@/views/Teams.vue';
import Songs from '@/views/Songs.vue';
import Schedule from '@/views/Schedule.vue'; // Assuming this is admin-only
import LiveMatch from '@/views/LiveMatch.vue';
import MatchHistory from '@/views/MatchHistory.vue';
import MemberSongPrefs from '@/views/MemberSongPrefs.vue'; // Assuming this is user-authenticated
import NotFoundPage from '@/views/NotFoundPage.vue';
import KindeCallback from '@/views/KindeCallback.vue'; // Import the KindeCallback view
import PrivacyPolicyPage from '@/views/PrivacyPolicyPage.vue'; // Assuming this exists
import MatchSongSelection from '@/views/MatchSongSelection.vue'; // NEW Import
import UserMatches from '@/views/UserMatches.vue'; // NEW Import
import LiveMatchPublic from '@/views/LiveMatchPublic.vue';
import ScheduleSecond from '@/views/ScheduleSecond.vue'; // NEW Import for Semifinal management
import LiveMatchSecond from '@/views/LiveMatchSecond.vue';
import LiveStage from '@/views/LiveStage.vue'; // 如果你有这个组件

// Extend RouteMeta to include custom fields
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean; // Requires user authentication
    requiresAdmin?: boolean; // Requires admin privileges
    hideAppLayout?: boolean; // <-- NEW: Flag to hide App.vue layout elements
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: { title: '首页' },
  },
  {
    path: '/panel/callback', // Kinde callback route
    name: 'kinde-callback',
    component: KindeCallback,
    meta: { title: '认证处理中' },
  },
  {
    path: '/privacy',
    name: 'privacy-policy',
    component: PrivacyPolicyPage,
    meta: { title: '隐私政策' },
  },
  {
    path: '/Home', // Example of an authenticated route
    name: 'Home',
    component: Home,
    meta: { title: '后台首页', requiresAuth: true }, // Add meta field to require authentication
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: { title: '队伍管理' }, // Public or requiresAuth? Let's assume public view for now
  },
  {
    path: '/songs',
    name: 'Songs',
    component: Songs,
    meta: { title: '歌曲列表' }, // Public
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: Schedule,
    meta: { title: '初赛/决赛管理', requiresAdmin: true }, // Admin for Tournament Matches
  },
  // NEW route for Semifinal Management
  {
    path: '/schedule-second',
    name: 'ScheduleSecond',
    component: ScheduleSecond,
    meta: { title: '复赛管理', requiresAdmin: true }, // Admin for Semifinal Matches
  },
  {
    path: '/live-match-admin/:doId', // Admin control route
    name: 'LiveMatchAdmin',
    component: LiveMatch,
    props: true,
    meta: { title: '比赛控制台', requiresAdmin: true },
  },
  {
    path: '/match-history',
    name: 'MatchHistory',
    component: MatchHistory,
    meta: { title: '比赛历史' }, // Public
  },
  {
    path: '/match-selection/:matchId', // NEW Route
    name: 'MatchSongSelection',
    component: MatchSongSelection,
    props: true, // Pass matchId as a prop
    meta: { title: '比赛选歌', requiresAuth: true }, // Requires user authentication
  },
  {
    path: '/my-matches', 
    name: 'UserMatches',
    component: UserMatches,
    meta: { title: '我的比赛', requiresAuth: true }, // 需要用户认证
  },
  {
    path: '/stage',
    name: 'LiveStage',
    component: LiveStage,
    meta: { title: '主舞台', requiresAuth: false },
  },
  {
    path: '/live-match/:doId', // 使用 :doId 参数来获取比赛的 Durable Object ID
    name: 'LiveMatchPublic',
    component: LiveMatchPublic,
    props: true,
    // 添加 hideAppLayout 以隐藏布局元素
    meta: { title: '比赛直播', requiresAuth: false, requiresAdmin: false, hideAppLayout: true }
  },
  {
    path: '/live-match-second/:id', // Use :id for semifinal match ID (from DB)
    name: 'LiveMatchSecond',
    component: LiveMatchSecond,
    props: true, // Pass id as a prop
    meta: { title: '复赛直播', requiresAuth: false, requiresAdmin: false, hideAppLayout: true }, // 添加 hideAppLayout
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

// Global navigation guard
router.beforeEach(async (to, from, next) => {
    const store = useAppStore(); // Get access to the store

    // Ensure auth status is checked on every navigation
    await store.checkAuthStatus();
    console.log(`Router Guard: Navigating to ${to.path}. Authenticated: ${store.isAuthenticated}, UserMember: ${!!store.userMember}, IsAdmin: ${store.isAdminUser}`);

    // Always allow navigation to the Kinde callback page
    if (to.path.startsWith('/panel/callback')) {
        next();
        return;
    }

    // Define public routes explicitly
    const publicRoutes = ['Index', 'Teams', 'Songs', 'MatchHistory', 'NotFound', 'privacy-policy', 'LiveStage'];
    
    // Check if the route is public or has hideAppLayout
    if (publicRoutes.includes(to.name as string) || to.meta.hideAppLayout) {
        next();
        return;
    }

    // Check for routes requiring authentication
    if (to.meta.requiresAuth) {
        if (!store.isAuthenticated) {
            console.warn(`Router Guard: Route ${to.path} requires authentication. Redirecting to login.`);
            next({ name: 'Index' });
            return;
        }
        // If authenticated, proceed
        next();
        return;
    }

    // Check for routes requiring admin privileges
    if (to.meta.requiresAdmin) {
        if (!store.isAuthenticated) {
            console.warn(`Router Guard: Admin route ${to.path} requires authentication. Redirecting to login.`);
            next({ name: 'Index' });
            return;
        }
        if (!store.isAdminUser) {
            console.warn(`Router Guard: Admin route ${to.path} requires admin privileges. User is not admin. Redirecting to home.`);
            next({ name: 'Home' });
            return;
        }
        // If authenticated and is admin, proceed
        next();
        return;
    }

    // If none of the above, allow navigation
    next();
});

// Global after hook to update page title
router.afterEach((to) => {
  const defaultTitle = 'NGU3rd 比赛系统';
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }
});

export default router;
