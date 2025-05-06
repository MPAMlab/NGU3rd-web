// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useKindeAuth } from '../composables/useKindeAuth'; // Adjust path if needed

// Import Views
import IndexPage from '../views/index.vue'; // Your existing Index/Registration page
import KindeCallback from '../views/KindeCallback.vue'; // Your existing Kinde callback page
import LivePage from '../views/LivePage.vue'; // New Live page
import AdminDashboard from '../views/AdminDashboard.vue'; // New Admin Dashboard (Placeholder)
import AdminMatches from '../views/AdminMatches.vue'; // New Admin Matches page
import AdminAchievements from '../views/AdminAchievements.vue'; // New Admin Achievements (Placeholder)
import UserMatches from '../views/UserMatches.vue'; // New User Matches page
import UserBadge from '../views/UserBadge.vue'; // New User Badge (Placeholder)
import NotFound from '../views/NotFound.vue'; // Optional: 404 page

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home', // Or 'registration'
      component: IndexPage
    },
    {
      path: '/callback',
      name: 'kinde-callback',
      component: KindeCallback
    },
    {
      path: '/live/:matchId', // Dynamic match ID
      name: 'live',
      component: LivePage,
      props: true, // Pass matchId as a prop to the component
    },
    // User Panel Routes (Require Authentication)
    {
      path: '/user/matches',
      name: 'user-matches',
      component: UserMatches,
      meta: { requiresAuth: true }
    },
     {
      path: '/user/badge',
      name: 'user-badge',
      component: UserBadge,
      meta: { requiresAuth: true }
    },
    // Admin Panel Routes (Require Admin Authentication)
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboard,
      meta: { requiresAdminAuth: true }
    },
    {
      path: '/admin/matches',
      name: 'admin-matches',
      component: AdminMatches,
      meta: { requiresAdminAuth: true }
    },
     {
      path: '/admin/achievements',
      name: 'admin-achievements',
      component: AdminAchievements,
      meta: { requiresAdminAuth: true }
    },
    // Catch-all 404 route
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFound, // Create a simple NotFound.vue component
    }
  ]
});

router.beforeEach(async (to, from, next) => {
    const { checkAuthStatus, isAuthenticated, isAdminUser, userMember } = useKindeAuth();

    // Ensure auth status is checked before navigating
    // This is crucial for protecting routes
    await checkAuthStatus();
    console.log(`Router Guard: Navigating to ${to.path}. Authenticated: ${isAuthenticated.value}, UserMember: ${!!userMember.value}, IsAdmin: ${isAdminUser.value}`);

    // Allow access to public routes
    if (to.name === 'home' || to.name === 'kinde-callback' || to.name === 'live' || to.name === 'not-found') {
        next();
        return;
    }

    // Check for routes requiring authentication
    if (to.meta.requiresAuth) {
        if (isAuthenticated.value) {
            // User is authenticated, check if they have a member record
            if (userMember.value) {
                 next(); // User is authenticated and registered
            } else {
                 // Authenticated but not registered - maybe redirect to registration step?
                 console.warn(`Authenticated user ${useKindeAuth().kindeUser.value?.id} is not registered. Redirecting to home.`);
                 // You might want a specific route for "finish registration"
                 next({ name: 'home', query: { redirect: to.fullPath } }); // Redirect to home, maybe with a query param
            }
        } else {
            // Not authenticated, redirect to home/login
            console.warn(`Access to ${to.path} requires authentication. Redirecting to home.`);
            next({ name: 'home', query: { redirect: to.fullPath } }); // Redirect to home, store target path
        }
        return;
    }

    // Check for routes requiring admin authentication
    if (to.meta.requiresAdminAuth) {
        if (isAuthenticated.value && isAdminUser.value) {
            next(); // User is authenticated and is an admin
        } else if (isAuthenticated.value && !isAdminUser.value) {
             // Authenticated but not an admin - redirect to forbidden or home
             console.warn(`Access to ${to.path} requires admin privileges. User ${useKindeAuth().kindeUser.value?.id} is not an admin. Redirecting to home.`);
             // You might want a specific 'forbidden' page
             next({ name: 'home', query: { redirect: to.fullPath } });
        }
        else {
            // Not authenticated - redirect to home/login
            console.warn(`Access to ${to.path} requires admin authentication. Redirecting to home.`);
            next({ name: 'home', query: { redirect: to.fullPath } });
        }
        return;
    }

    // If none of the above, allow navigation (should be covered by public routes)
    next();
});


export default router;
