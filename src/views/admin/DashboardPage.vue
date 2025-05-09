<!-- src/views/admin/DashboardPage.vue -->
<template>
    <div class="dashboard-page">
      <!-- Welcome Section (Adapted from user panel) -->
      <div class="glass rounded-xl p-6 mb-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
          <div class="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                  <h2 class="text-xl font-bold mb-2">欢迎回来，管理员</h2>
                  <p class="text-gray-300 mb-4">您可以在这里管理比赛的各个方面。</p>
                  <!-- <button class="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">查看概览</button> -->
              </div>
              <div class="mt-4 md:mt-0">
                  <div class="glass p-4 rounded-lg inline-block">
                      <div class="flex items-center space-x-3">
                          <div class="bg-purple-500 bg-opacity-20 p-2 rounded-full">
                              <img src="https://unpkg.com/lucide-static@latest/icons/settings.svg" class="w-6 h-6">
                          </div>
                          <div>
                              <p class="text-sm text-gray-300">当前角色</p>
                              <p class="font-bold">STAFF</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  
      <!-- Quick Links / Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <router-link to="/admin/schedule" class="glass rounded-xl p-6 hover:bg-white/5 transition match-card">
              <h3 class="text-lg font-bold mb-2">赛程管理</h3>
              <p class="text-gray-300">查看、创建和编辑比赛轮次。</p>
          </router-link>
           <router-link to="/admin/teams" class="glass rounded-xl p-6 hover:bg-white/5 transition match-card">
              <h3 class="text-lg font-bold mb-2">队伍管理</h3>
              <p class="text-gray-300">管理参赛队伍信息。</p>
          </router-link>
           <router-link to="/admin/members" class="glass rounded-xl p-6 hover:bg-white/5 transition match-card">
              <h3 class="text-lg font-bold mb-2">选手管理</h3>
              <p class="text-gray-300">管理所有选手信息。</p>
          </router-link>
           <router-link to="/admin/match-history" class="glass rounded-xl p-6 hover:bg-white/5 transition match-card">
              <h3 class="text-lg font-bold mb-2">比赛历史</h3>
              <p class="text-gray-300">查看已完成的比赛记录。</p>
          </router-link>
           <!-- Add a link to the live match control if one is ongoing -->
           <div v-if="liveMatchStore.currentDoId" class="glass rounded-xl p-6 hover:bg-white/5 transition match-card border-l-4 border-green-500">
               <h3 class="text-lg font-bold mb-2 flex items-center">
                   <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 circle-pulse"></span>
                   正在进行的比赛
               </h3>
               <p class="text-gray-300 mb-3">当前正在控制一场比赛。</p>
               <router-link :to="`/admin/live-match/${liveMatchStore.currentDoId}`" class="text-purple-400 hover:underline">前往控制台</router-link>
           </div>
      </div>
  
      <!-- Placeholder for recent activity or stats -->
       <div class="glass rounded-xl p-6">
           <h3 class="text-lg font-bold mb-4">最近活动 (Placeholder)</h3>
           <p class="text-gray-400">这里可以显示最近创建的赛程、更新的队伍信息等。</p>
       </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { useLiveMatchStore } from '@/stores/liveMatch';
  
  const liveMatchStore = useLiveMatchStore();
  
  // You might want to load some initial data here, e.g., count of teams, members, upcoming matches
  // import { useTeamsStore } from '@/stores/teams';
  // const teamsStore = useTeamsStore();
  // teamsStore.loadTeams(); // Example
  </script>
  
  <style scoped>
  /* Scoped styles for the dashboard */
  /* circle-pulse is in main.css */
  </style>
  