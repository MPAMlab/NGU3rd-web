<!-- src/views/NotFoundPage.vue -->
<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div class="text-center glass p-8 rounded-lg">
        <h1 class="text-6xl font-bold text-purple-500 mb-4">404</h1>
        <p class="text-xl mb-6">页面未找到</p>
        <router-link to="/admin" class="btn-primary inline-block">返回仪表盘</router-link>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  // No script needed
  </script>
  
  <style scoped>
  /* Scoped styles if any */
  </style>
  