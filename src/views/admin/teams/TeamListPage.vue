<!-- src/views/admin/teams/TeamListPage.vue -->
<template>
    <div class="team-list-page">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">队伍列表</h2>
        <button @click="openAddModal" class="btn-primary flex items-center">
          <img src="https://unpkg.com/lucide-static@latest/icons/plus.svg" class="w-5 h-5 mr-2">
          添加队伍
        </button>
      </div>
  
      <div v-if="teamsStore.isLoading" class="text-center text-gray-400">加载中...</div>
      <div v-else-if="teamsStore.error" class="alert-danger">
        错误: {{ teamsStore.error }}
      </div>
      <div v-else class="glass rounded-lg p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="pl-4">队名</th>
                <th>颜色</th>
                <th>成员数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in teamsStore.teams" :key="team.id" class="glass hover:bg-white/5">
                <td class="py-3 pl-4 rounded-l-lg">{{ team.name }}</td>
                <td class="py-3">
                    <span class="inline-block w-6 h-6 rounded-full" :style="{ backgroundColor: team.color || '#ccc' }"></span>
                </td>
                <td class="py-3">{{ getTeamMemberCount(team.id) }}</td>
                <td class="py-3 rounded-r-lg">
                  <button @click="openEditModal(team)" class="text-purple-400 hover:underline mr-4">编辑</button>
                  <button @click="deleteTeam(team.id)" class="text-red-400 hover:underline">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <div v-if="teamsStore.teams.length === 0" class="text-center text-gray-400 py-4">暂无队伍</div>
      </div>
  
      <!-- Add/Edit Team Modal -->
      <Modal :show="isModalOpen" @close="closeModal">
        <template #header>
          <h3 class="text-xl font-bold">{{ isEditing ? '编辑队伍' : '添加队伍' }}</h3>
        </template>
        <template #body>
          <div class="space-y-4">
            <div>
              <label for="team-name" class="block text-sm font-medium text-gray-300 mb-1">队名</label>
              <input type="text" id="team-name" v-model="currentTeam.name" class="w-full input-glass" required>
            </div>
             <div>
              <label for="team-color" class="block text-sm font-medium text-gray-300 mb-1">颜色 (CSS Color)</label>
              <input type="text" id="team-color" v-model="currentTeam.color" class="w-full input-glass" placeholder="#8b5cf6 or purple-500">
            </div>
             <div>
              <label for="team-logo" class="block text-sm font-medium text-gray-300 mb-1">Logo URL (Optional)</label>
              <input type="text" id="team-logo" v-model="currentTeam.logoUrl" class="w-full input-glass" placeholder="http://...">
            </div>
          </div>
        </template>
        <template #footer>
          <button @click="saveTeam" class="btn-primary" :disabled="teamsStore.isLoading">
              {{ teamsStore.isLoading ? '保存中...' : '保存' }}
          </button>
          <button @click="closeModal" class="btn-secondary ml-2">取消</button>
        </template>
      </Modal>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useTeamsStore } from '@/stores/teams';
  import { useMembersStore } from '@/stores/members'; // To get member count
  import Modal from '@/components/common/Modal.vue'; // Import Modal component
  import type { Team } from '@/types';
  
  const teamsStore = useTeamsStore();
  const membersStore = useMembersStore(); // Use members store
  
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentTeam = ref<Partial<Team>>({});
  
  onMounted(() => {
    teamsStore.loadTeams();
    membersStore.loadMembers(); // Load members to count them
  });
  
  const getTeamMemberCount = (teamId: string) => {
      return membersStore.members.filter(member => member.teamId === teamId).length;
  };
  
  const openAddModal = () => {
    isEditing.value = false;
    currentTeam.value = {}; // Reset form
    isModalOpen.value = true;
  };
  
  const openEditModal = (team: Team) => {
    isEditing.value = true;
    currentTeam.value = { ...team }; // Populate form with team data
    isModalOpen.value = true;
  };
  
  const closeModal = () => {
    isModalOpen.value = false;
    currentTeam.value = {}; // Clear form data
    teamsStore.error = null; // Clear store error on modal close
  };
  
  const saveTeam = async () => {
    try {
      if (isEditing.value && currentTeam.value.id) {
        await teamsStore.updateTeam(currentTeam.value.id, currentTeam.value);
      } else {
        await teamsStore.addTeam(currentTeam.value);
      }
      closeModal(); // Close modal on success
    } catch (e) {
      // Error is already set in the store action
      console.error("Save team failed:", e);
    }
  };
  
  const deleteTeam = async (teamId: string) => {
    if (confirm('确定要删除这支队伍吗？')) {
      try {
        await teamsStore.removeTeam(teamId);
      } catch (e) {
        console.error("Delete team failed:", e);
        alert(`删除失败: ${teamsStore.error}`); // Show error to user
      }
    }
  };
  </script>
  
  <style scoped>
  /* Scoped styles for the team list page */
  /* Table styles are in main.css */
  /* Button styles are in main.css */
  /* Input styles are in main.css */
  /* Alert styles are in main.css */
  </style>
  