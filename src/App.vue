<!-- src/App.vue -->
<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
// No script needed here usually, unless global logic is required
</script>

<style>
/* Global styles can go here or in main.css */
/* The fade transition styles are in main.css */
</style>
