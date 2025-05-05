<!-- src/components/Sidebar.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useKindeAuth } from '../composables/useKindeAuth'; // Adjust path

const route = useRoute();
const { userMember, isAdminUser, logout } = useKindeAuth();

const isStaff = computed(() => isAdminUser.value); // Use isAdminUser from composable

// Determine active link based on current route
const isActive = (path: string) => route.path.startsWith(path);

// Placeholder staff info (replace with actual userMember data)
const staffName = computed(() => userMember.value?.nickname || userMember.value?.name || 'Staff');
const staffId = computed(() => userMember.value?.maimai_id || 'N/A');

const handleLogout = async () => {
    await logout();
    // Logout composable handles redirect
};

</script>

<template>
    <!-- 侧边栏 -->
    <div class="w-64 glass hidden md:block flex-shrink-0">
        <div class="p-4 border-b border-white/10 flex items-center space-x-3">
            <img src="/logo.png" alt="NGU3rd Logo" class="h-10 w-10 rounded-full"> <!-- Use your actual logo path -->
            <span class="font-bold text-xl">NGU3rd</span>
            <span v-if="isStaff" class="ml-1 bg-purple-600/50 text-xs px-2 py-0.5 rounded-full">STAFF</span>
        </div>
        <div class="p-4">
            <div v-if="userMember" class="flex items-center space-x-3 mb-6">
                <img :src="userMember.avatar_url || 'https://via.placeholder.com/150'" :alt="`${staffName}头像`" class="h-12 w-12 rounded-full object-cover">
                <div>
                    <p class="font-medium">{{ staffName }}</p>
                    <p class="text-xs text-gray-400">ID: {{ staffId }}</p>
                </div>
            </div>
             <div v-else class="flex items-center space-x-3 mb-6 text-gray-400">
                 <img src="https://via.placeholder.com/150" alt="用户头像" class="h-12 w-12 rounded-full object-cover">
                 <div>
                     <p class="font-medium">未登录</p>
                     <p class="text-xs text-gray-400">请登录</p>
                 </div>
             </div>

            <nav class="space-y-1">
                <!-- User Links -->
                 <router-link v-if="!isStaff" to="/user/matches" :class="['sidebar-item flex items-center space-x-3 p-3 rounded-lg', { 'active': isActive('/user/matches') }]">
                     <img src="https://unpkg.com/lucide-static@latest/icons/trophy.svg" class="w-5 h-5">
                     <span>比赛战绩</span>
                 </router-link>
                 <router-link v-if="!isStaff" to="/user/badge" :class="['sidebar-item flex items-center space-x-3 p-3 rounded-lg', { 'active': isActive('/user/badge') }]">
                     <img src="https://unpkg.com/lucide-static@latest/icons/id-card.svg" class="w-5 h-5">
                     <span>选手牌</span>
                 </router-link>
                 <!-- Add other user links -->

                <!-- Admin Links -->
                 <router-link v-if="isStaff" to="/admin" :class="['sidebar-item flex items-center space-x-3 p-3 rounded-lg', { 'active': isActive('/admin') && route.path === '/admin' }]">
                     <img src="https://unpkg.com/lucide-static@latest/icons/layout-dashboard.svg" class="w-5 h-5">
                     <span>仪表盘</span>
                 </router-link>
                 <router-link v-if="isStaff" to="/admin/matches" :class="['sidebar-item flex items-center space-x-3 p-3 rounded-lg', { 'active': isActive('/admin/matches') }]">
                     <img src="https://unpkg.com/lucide-static@latest/icons/edit-3.svg" class="w-5 h-5">
                     <span>编辑轮次</span>
                 </router-link>
                 <router-link v-if="isStaff" to="/admin/achievements" :class="['sidebar-item flex items-center space-x-3 p-3 rounded-lg', { 'active': isActive('/admin/achievements') }]">
                     <img src="https://unpkg.com/lucide-static@latest/icons/award.svg" class="w-5 h-5">
                     <span>发放成就</span>
                 </router-link>
                 <a href="/live/some-match-id" class="sidebar-item flex items-center space-x-3 p-3 rounded-lg" target="_blank">
                    <img src="https://unpkg.com/lucide-static@latest/icons/tv.svg" class="w-5 h-5">
                    <span>前往直播页</span>
                </a>
                <!-- Add other admin links -->

                <button v-if="isAuthenticated" @click="handleLogout" class="sidebar-item w-full text-left flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-900/30">
                     <img src="https://unpkg.com/lucide-static@latest/icons/log-out.svg" class="w-5 h-5">
                     <span>退出登录</span>
                 </button>
            </nav>
        </div>
    </div>

    <!-- Mobile Navigation (Keep the HTML structure, adapt with Vue) -->
    <div class="fixed bottom-0 left-0 right-0 glass md:hidden z-10">
        <div class="flex justify-around p-3">
            <!-- User Links -->
            <router-link v-if="!isStaff" to="/user/matches" :class="['flex flex-col items-center space-y-1', { 'text-purple-400': isActive('/user/matches'), 'text-gray-400': !isActive('/user/matches') }]">
                <img src="https://unpkg.com/lucide-static@latest/icons/trophy.svg" class="w-6 h-6">
                <span class="text-xs">战绩</span>
            </router-link>
             <router-link v-if="!isStaff" to="/user/badge" :class="['flex flex-col items-center space-y-1', { 'text-purple-400': isActive('/user/badge'), 'text-gray-400': !isActive('/user/badge') }]">
                <img src="https://unpkg.com/lucide-static@latest/icons/id-card.svg" class="w-6 h-6">
                <span class="text-xs">选手牌</span>
            </router-link>
            <!-- Admin Links -->
            <router-link v-if="isStaff" to="/admin" :class="['flex flex-col items-center space-y-1', { 'text-purple-400': isActive('/admin') && route.path === '/admin', 'text-gray-400': !isActive('/admin') || route.path !== '/admin' }]">
                <img src="https://unpkg.com/lucide-static@latest/icons/layout-dashboard.svg" class="w-6 h-6">
                <span class="text-xs">仪表盘</span>
            </router-link>
            <router-link v-if="isStaff" to="/admin/matches" :class="['flex flex-col items-center space-y-1', { 'text-purple-400': isActive('/admin/matches'), 'text-gray-400': !isActive('/admin/matches') }]">
                <img src="https://unpkg.com/lucide-static@latest/icons/edit-3.svg" class="w-6 h-6">
                <span class="text-xs">编辑轮次</span>
            </router-link>
             <router-link v-if="isStaff" to="/admin/achievements" :class="['flex flex-col items-center space-y-1', { 'text-purple-400': isActive('/admin/achievements'), 'text-gray-400': !isActive('/admin/achievements') }]">
                <img src="https://unpkg.com/lucide-static@latest/icons/award.svg" class="w-6 h-6">
                <span class="text-xs">成就</span>
            </router-link>
             <!-- Add other mobile links -->
        </div>
    </div>
</template>

<style scoped>
/* Keep the sidebar-item, active, glass styles from the HTML */
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
.sidebar-item {
    transition: all 0.3s ease;
}
.sidebar-item:hover {
    background: rgba(255, 255, 255, 0.1);
}
.sidebar-item.active {
    background: rgba(255, 255, 255, 0.1);
    border-left: 3px solid #8b5cf6;
}
</style>
