<!-- src/views/AdminDashboard.vue -->
<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>
<template>
    <div class="flex h-screen">
        <Sidebar />
        <div class="flex-1 overflow-auto p-6">
            <div class="max-w-7xl mx-auto">
                <h1 class="text-2xl font-bold mb-8">管理员仪表盘</h1>
                <div class="glass rounded-xl p-6">
                    <p>这里是管理员仪表盘内容。</p>
                    <p class="text-gray-400 mt-4">待实现...</p>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>/* Add styles if needed */</style>

```vue
<!-- src/views/AdminAchievements.vue -->
<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>
<template>
    <div class="flex h-screen">
        <Sidebar />
        <div class="flex-1 overflow-auto p-6">
            <div class="max-w-7xl mx-auto">
                <h1 class="text-2xl font-bold mb-8">发放成就</h1>
                <div class="glass rounded-xl p-6">
                    <p>这里是发放成就功能。</p>
                    <p class="text-gray-400 mt-4">待实现...</p>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>/* Add styles if needed */</style>

```vue
<!-- src/views/UserBadge.vue -->
<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue';
</script>
<template>
    <div class="flex h-screen">
        <Sidebar />
        <div class="flex-1 overflow-auto p-6">
            <div class="max-w-6xl mx-auto">
                <h1 class="text-2xl font-bold mb-8">选手牌</h1>
                <div class="glass rounded-xl p-6">
                    <p>这里是你的选手牌信息。</p>
                    <p class="text-gray-400 mt-4">待实现...</p>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>/* Add styles if needed */</style>

```vue
<!-- src/views/NotFound.vue -->
<template>
    <div class="min-h-screen flex flex-col items-center justify-center text-white">
        <h1 class="text-4xl font-bold mb-4">404</h1>
        <p class="text-xl mb-8">页面未找到</p>
        <router-link to="/" class="text-purple-400 hover:underline">返回首页</router-link>
    </div>
</template>
<style scoped>/* Add styles if needed */</style>
