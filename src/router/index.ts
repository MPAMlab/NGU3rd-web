import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomeView.vue')
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('./views/Teams.vue')
  },
  {
    path: '/members',
    name: 'Members',
    component: () => import('./views/MembersView.vue')
  },
  {
    path: '/songs',
    name: 'Songs',
    component: () => import('./views/SongsView.vue')
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('./views/ScheduleView.vue')
  },
  {
    path: '/live-match/:doId',
    name: 'LiveMatch',
    component: () => import('./views/LiveMatchView.vue'),
    props: true // Pass route params as props
  },
  {
    path: '/match-history',
    name: 'MatchHistory',
    component: () => import('./views/MatchHistoryView.vue')
  },
  {
    path: '/member-song-prefs',
    name: 'MemberSongPrefs',
    component: () => import('./views/MemberSongPrefsView.vue')
  },
  // Add other routes as needed
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
