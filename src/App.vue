<!-- src/App.vue -->
<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
// Import the store
import { useAppStore } from '@/store'; // Adjust path if necessary

const store = useAppStore();

// Function to handle logout
const handleLogout = () => {
    store.logout();
};

// Function to handle login (can be used for a login button in the nav if desired)
const handleLogin = () => {
    store.login();
};

// You might want to fetch initial data when the app mounts
// onMounted(() => {
//   store.fetchTeams();
//   store.fetchSongs(); // Or fetch songs with default pagination/filters
//   store.fetchMatchHistory();
//   // Note: checkAuthStatus is handled by the router guard now
// });

</script>

<template>
  <div id="app" class="bg-gray-900 text-white min-h-screen flex flex-col">
    <header class="bg-gray-800 text-white p-4 shadow-md">
      <div class="container mx-auto flex justify-between items-center">
        <!-- Site Title / Logo -->
        <RouterLink :to="{ name: 'Index' }" class="text-2xl font-bold text-purple-400 hover:text-purple-300 transition">
          NGU3rd
        </RouterLink>

        <!-- Navigation Links -->
        <nav class="flex items-center space-x-4">
          <!-- Public Links -->
          <RouterLink :to="{ name: 'Index' }" class="hover:text-purple-400 transition">首页</RouterLink>
          <RouterLink :to="{ name: 'Songs' }" class="hover:text-purple-400 transition">歌曲列表</RouterLink>
          <RouterLink :to="{ name: 'MatchHistory' }" class="hover:text-purple-400 transition">比赛历史</RouterLink>
          <RouterLink :to="{ name: 'Teams' }" class="hover:text-purple-400 transition">队伍列表</RouterLink>
          <!-- Add other public links here -->

          <!-- Authenticated User Links (Visible if logged in) -->
          <template v-if="store.isAuthenticated">
             <RouterLink :to="{ name: 'MemberSongPrefs' }" class="hover:text-purple-400 transition">我的选曲偏好</RouterLink>
             <!-- Add other user-specific links here -->
          </template>

          <!-- Admin Links (Visible if logged in AND is admin) -->
          <template v-if="store.isAdminUser">
             <RouterLink :to="{ name: 'Home' }" class="hover:text-purple-400 transition">后台首页</RouterLink>
             <!-- <RouterLink :to="{ name: 'Teams' }" class="hover:text-purple-400 transition">队伍管理</RouterLink> -->
             <RouterLink :to="{ name: 'Schedule' }" class="hover:text-purple-400 transition">赛程管理</RouterLink>
             <!-- Add other admin links here -->
          </template>

          <!-- Auth Buttons -->
          <template v-if="!store.isAuthenticated">
            <!-- Login button can be here or only on the landing page -->
            <!-- <button @click="handleLogin" class="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded transition">登录</button> -->
          </template>
          <template v-else>
            <span class="text-sm text-gray-300">
                {{ store.userMember?.nickname || store.kindeUser?.name || store.kindeUser?.email || '用户' }}
                <span v-if="store.isAdminUser" class="text-xs text-yellow-400">(Admin)</span>
            </span>
            <button @click="handleLogout" class="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded transition">退出登录</button>
          </template>

        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow container mx-auto px-4 py-8">
      <RouterView />
    </main>

    <!-- Footer (Optional) -->
    <footer class="bg-gray-800 text-gray-400 text-center p-4 mt-8">
      <div class="container mx-auto">
        <p>&copy; 2025 NGU Team, MPAM Laboratory. All rights reserved.</p>
        <RouterLink :to="{ name: 'privacy-policy' }" class="text-gray-400 hover:text-purple-400 transition text-sm">隐私政策</RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Add or adjust global styles for App.vue if needed */
</style>
