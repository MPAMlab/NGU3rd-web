<!-- src/views/admin/members/MemberListPage.vue -->
<template>
    <div class="member-list-page">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">选手列表</h2>
        <button @click="openAddModal" class="btn-primary flex items-center">
          <img src="https://unpkg.com/lucide-static@latest/icons/plus.svg" class="w-5 h-5 mr-2">
          添加选手
        </button>
      </div>
  
      <div v-if="membersStore.isLoading || teamsStore.isLoading" class="text-center text-gray-400">加载中...</div>
      <div v-else-if="membersStore.error || teamsStore.error" class="alert-danger">
        错误: {{ membersStore.error || teamsStore.error }}
      </div>
      <div v-else class="glass rounded-lg p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="pl-4">昵称</th>
                <th>所属队伍</th>
                <th>职业</th>
                <th>元素</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in membersStore.members" :key="member.id" class="glass hover:bg-white/5">
                <td class="py-3 pl-4 rounded-l-lg">
                    <div class="flex items-center space-x-3">
                        <img :src="member.avatarUrl || 'https://via.placeholder.com/40'" alt="头像" class="w-8 h-8 rounded-full object-cover">
                        <span>{{ member.nickname }}</span>
                    </div>
                </td>
                <td class="py-3">{{ getTeamName(member.teamId) }}</td>
                <td class="py-3">{{ member.profession || '未设置' }}</td>
                <td class="py-3">
                    <span :class="['text-xs', member.element ? `element-${member.element}` : 'text-gray-400']">
                        {{ member.element ? `${getElementName(member.element)} (${getElementInitial(member.element)})` : '未设置' }}
                    </span>
                </td>
                <td class="py-3 rounded-r-lg">
                  <button @click="openEditModal(member)" class="text-purple-400 hover:underline mr-4">编辑</button>
                  <button @click="deleteMember(member.id)" class="text-red-400 hover:underline">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <div v-if="membersStore.members.length === 0" class="text-center text-gray-400 py-4">暂无选手</div>
      </div>
  
      <!-- Add/Edit Member Modal -->
      <Modal :show="isModalOpen" @close="closeModal">
        <template #header>
          <h3 class="text-xl font-bold">{{ isEditing ? '编辑选手' : '添加选手' }}</h3>
        </template>
        <template #body>
          <div class="space-y-4">
            <div>
              <label for="member-nickname" class="block text-sm font-medium text-gray-300 mb-1">昵称</label>
              <input type="text" id="member-nickname" v-model="currentMember.nickname" class="w-full input-glass" required>
            </div>
             <div>
              <label for="member-team" class="block text-sm font-medium text-gray-300 mb-1">所属队伍</label>
              <select id="member-team" v-model="currentMember.teamId" class="w-full input-glass" required>
                  <option value="">请选择队伍</option>
                  <option v-for="team in teamsStore.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
             <div>
              <label for="member-profession" class="block text-sm font-medium text-gray-300 mb-1">职业</label>
              <input type="text" id="member-profession" v-model="currentMember.profession" class="w-full input-glass" placeholder="绝剑士, 矩盾手, 炼星师...">
            </div>
             <div>
              <label for="member-element" class="block text-sm font-medium text-gray-300 mb-1">元素属性</label>
               <select id="member-element" v-model="currentMember.element" class="w-full input-glass">
                  <option value="">请选择元素</option>
                  <option value="fire">火 (R)</option>
                  <option value="wood">木 (G)</option>
                  <option value="water">水 (B)</option>
              </select>
            </div>
             <div>
              <label for="member-avatar" class="block text-sm font-medium text-gray-300 mb-1">头像 URL (Optional)</label>
              <input type="text" id="member-avatar" v-model="currentMember.avatarUrl" class="w-full input-glass" placeholder="http://...">
            </div>
          </div>
        </template>
        <template #footer>
          <button @click="saveMember" class="btn-primary" :disabled="membersStore.isLoading">
              {{ membersStore.isLoading ? '保存中...' : '保存' }}
          </button>
          <button @click="closeModal" class="btn-secondary ml-2">取消</button>
        </template>
      </Modal>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useMembersStore } from '@/stores/members';
  import { useTeamsStore } from '@/stores/teams'; // Need teams to select team
  import Modal from '@/components/common/Modal.vue';
  import type { Member } from '@/types';
  
  const membersStore = useMembersStore();
  const teamsStore = useTeamsStore();
  
  const isModalOpen = ref(false);
  const isEditing = ref(false);
  const currentMember = ref<Partial<Member>>({});
  
  onMounted(() => {
    membersStore.loadMembers();
    teamsStore.loadTeams(); // Load teams for the dropdown
  });
  
  const getTeamName = (teamId: string) => {
      const team = teamsStore.getTeamById(teamId);
      return team ? team.name : '未知队伍';
  };
  
  const getElementName = (element: Member['element']) => {
      switch (element) {
          case 'fire': return '火';
          case 'wood': return '木';
          case 'water': return '水';
          default: return '未知';
      }
  };
  
  const getElementInitial = (element: Member['element']) => {
       switch (element) {
          case 'fire': return 'R';
          case 'wood': return 'G';
          case 'water': return 'B';
          default: return '?';
      }
  };
  
  
  const openAddModal = () => {
    isEditing.value = false;
    currentMember.value = { teamId: '' }; // Reset form, default teamId empty
    isModalOpen.value = true;
  };
  
  const openEditModal = (member: Member) => {
    isEditing.value = true;
    currentMember.value = { ...member }; // Populate form
    isModalOpen.value = true;
  };
  
  const closeModal = () => {
    isModalOpen.value = false;
    currentMember.value = {}; // Clear form data
    membersStore.error = null; // Clear store error
  };
  
  const saveMember = async () => {
    try {
      if (isEditing.value && currentMember.value.id) {
        await membersStore.updateMember(currentMember.value.id, currentMember.value);
      } else {
        await membersStore.addMember(currentMember.value);
      }
      closeModal(); // Close modal on success
    } catch (e) {
      // Error is already set in the store action
      console.error("Save member failed:", e);
    }
  };
  
  const deleteMember = async (memberId: string) => {
    if (confirm('确定要删除这位选手吗？')) {
      try {
        await membersStore.removeMember(memberId);
      } catch (e) {
        console.error("Delete member failed:", e);
        alert(`删除失败: ${membersStore.error}`); // Show error to user
      }
    }
  };
  </script>
  
  <style scoped>
  /* Scoped styles for the member list page */
  /* Table styles are in main.css */
  /* Button styles are in main.css */
  /* Input styles are in main.css */
  /* Alert styles are in main.css */
  /* Element colors are in main.css */
  </style>
  