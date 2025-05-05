<!-- src/App.vue -->
<script setup lang="ts">
// You might keep the Kinde auth check here or rely solely on the router guard
// import { onMounted } from 'vue';
// import { useKindeAuth } from './composables/useKindeAuth';
// const { checkAuthStatus } = useKindeAuth();
// onMounted(() => { checkAuthStatus(); });
</script>

<template>
  <router-view />
</template>

<style>
/* Global styles if any */
body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    min-height: 100vh;
    color: white;
}
/* Add other global styles or import a CSS file */
</style>
