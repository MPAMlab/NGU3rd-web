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