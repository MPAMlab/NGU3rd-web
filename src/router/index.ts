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

// Extend RouteMeta to include custom fields
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean; // Requires user authentication
    requiresAdmin?: boolean; // Requires admin privileges
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
    // MODIFIED: Change path to match Kinde configuration
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
    meta: { title: '赛程管理', requiresAdmin: true }, // Add meta field to require admin
  },
  {
    path: '/live-match/:doId',
    name: 'LiveMatch',
    component: LiveMatch,
    props: true,
    meta: { title: '比赛直播/控制台' }, // Public view, but control features might require admin
  },
  {
    path: '/match-history',
    name: 'MatchHistory',
    component: MatchHistory,
    meta: { title: '比赛历史' }, // Public
  },
  {
    path: '/member-song-prefs',
    name: 'MemberSongPrefs',
    component: MemberSongPrefs,
    meta: { title: '选手选曲偏好', requiresAuth: true }, // Requires user authentication
  },
  {
    path: '/match-selection/:matchId', // NEW Route
    name: 'MatchSongSelection',
    component: MatchSongSelection,
    props: true, // Pass matchId as a prop
    meta: { title: '比赛选歌', requiresAuth: true }, // Requires user authentication
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
    // This calls the composable's checkAuthStatus which updates both composable and store state
    await store.checkAuthStatus();
    console.log(`Router Guard: Navigating to ${to.path}. Authenticated: ${store.isAuthenticated}, UserMember: ${!!store.userMember}, IsAdmin: ${store.isAdminUser}`);


    // Always allow navigation to the Kinde callback page
    // Check if the path starts with the callback path
    if (to.path.startsWith('/panel/callback')) { // MODIFIED: Check for the correct callback path
        next();
        return;
    }

    // Define public routes explicitly
    const publicRoutes = ['Index', 'Teams', 'Songs', 'MatchHistory', 'LiveMatch', 'NotFound', 'privacy-policy'];
    if (publicRoutes.includes(to.name as string)) {
        next();
        return;
    }


    // Check for routes requiring authentication
    if (to.meta.requiresAuth) {
        if (!store.isAuthenticated) {
            console.warn(`Router Guard: Route ${to.path} requires authentication. Redirecting to login.`);
            // Redirect to the main page or a dedicated login page
            // You might want to store the 'to.fullPath' to redirect back after successful login
            next({ name: 'Index' }); // Redirect to your main page
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
            next({ name: 'Index' }); // Redirect to main page
            return;
        }
        if (!store.isAdminUser) {
            console.warn(`Router Guard: Admin route ${to.path} requires admin privileges. User is not admin. Redirecting to home.`);
            next({ name: 'Home' }); // Redirect to a non-admin page, e.g., authenticated home
            return;
        }
        // If authenticated and is admin, proceed
        next();
        return;
    }

    // If none of the above, allow navigation (should be covered by publicRoutes, but as a fallback)
    // This line might be redundant if all routes are explicitly handled above.
    // next();
});


// Global after hook to update page title (Keep as is)
router.afterEach((to) => {
  const defaultTitle = 'NGU3rd 比赛系统';
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }
});

export default router;
