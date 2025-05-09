<!-- src/layouts/AdminLayout.vue -->
<template>
    <div class="flex h-screen bg-gray-100 text-white">
      <!-- Sidebar -->
      <aside class="w-64 glass hidden md:block flex-shrink-0 overflow-y-auto">
        <div class="p-4 border-b border-white/10 flex items-center space-x-3">
          <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2FtZSUyMGxvZ298ZW58MHx8MHx8fDA%3D" alt="NGU3rd Logo" class="h-10 w-10 rounded-full">
          <span class="font-bold text-xl">NGU3rd</span>
          <span class="ml-1 bg-purple-600/50 text-xs px-2 py-0.5 rounded-full">STAFF</span>
        </div>
        <div class="p-4">
          <!-- Staff Info (from prototype) -->
          <div class="flex items-center space-x-3 mb-6">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmVzc2lvbmFsJTIwcG9ydHJhaXR8ZW58MHx8MHx8fDA%3D" alt="staff头像" class="h-12 w-12 rounded-full">
              <div>
                  <p class="font-medium">赵管理</p>
                  <p class="text-xs text-gray-400">Staff ID: STAFF001</p>
              </div>
          </div>
          <nav class="space-y-1">
            <router-link to="/admin" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/layout-dashboard.svg" class="w-5 h-5">
              <span>仪表盘</span>
            </router-link>
            <router-link to="/admin/teams" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/users.svg" class="w-5 h-5">
              <span>队伍管理</span>
            </router-link>
             <router-link to="/admin/members" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/user.svg" class="w-5 h-5">
              <span>选手管理</span>
            </router-link>
            <router-link to="/admin/schedule" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/calendar.svg" class="w-5 h-5">
              <span>赛程管理</span>
            </router-link>
             <router-link to="/admin/match-history" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/archive.svg" class="w-5 h-5">
              <span>比赛历史</span>
            </router-link>
             <a href="/live" target="_blank" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg">
              <img src="https://unpkg.com/lucide-static@latest/icons/tv.svg" class="w-5 h-5">
              <span>前往直播页</span>
            </a>
            <!-- Add more links as needed -->
          </nav>
        </div>
         <!-- Logout Button (Placeholder) -->
         <div class="p-4 mt-auto border-t border-white/10">
             <button @click="logout" class="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-700 text-left font-medium flex items-center space-x-2">
                 <img src="https://unpkg.com/lucide-static@latest/icons/log-out.svg" class="w-5 h-5">
                 <span>登出</span>
             </button>
         </div>
      </aside>
  
      <!-- Mobile Bottom Nav (from user panel prototype - keep for potential future use) -->
      <!-- <div class="fixed bottom-0 left-0 right-0 glass md:hidden z-10">
          <div class="flex justify-around p-3">
              <router-link to="/admin" class="flex flex-col items-center space-y-1 text-purple-400">
                  <img src="https://unpkg.com/lucide-static@latest/icons/layout-dashboard.svg" class="w-6 h-6">
                  <span class="text-xs">仪表盘</span>
              </router-link>
               ... other mobile links
          </div>
      </div> -->
  
  
      <!-- Main content -->
      <main class="flex-1 overflow-y-auto p-6">
        <div class="max-w-7xl mx-auto">
           <!-- Top Bar (from prototype) -->
           <div class="flex justify-between items-center mb-8">
               <h1 class="text-2xl font-bold">{{ route.meta.title || '管理后台' }}</h1>
               <div class="flex items-center space-x-4">
                   <button class="glass p-2 rounded-lg">
                       <img src="https://unpkg.com/lucide-static@latest/icons/bell.svg" class="w-5 h-5">
                   </button>
                   <!-- Mobile menu button (if needed) -->
               </div>
           </div>
  
           <!-- Router View for nested pages -->
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useRouter, useRoute } from 'vue-router';
  // import { useAuthStore } from '@/stores/auth'; // Import auth store when ready
  
  const router = useRouter();
  const route = useRoute(); // To access current route meta for title
  // const authStore = useAuthStore(); // Use auth store when ready
  
  const logout = async () => {
    console.warn("Logout button clicked, logout not implemented.");
    // TODO: Implement Kinde logout
    // await authStore.logout();
    // router.push('/login'); // Redirect to login page after logout
  };
  </script>
  
  <style scoped>
  /* Scoped styles for the layout */
  /* Sidebar item active style is in main.css using router-link-active */
  </style>
  