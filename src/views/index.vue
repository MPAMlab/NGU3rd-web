<template>
    <div class="admin-page">
      <h1>比赛管理后台</h1>
  
      <div v-if="store.isLoading" class="loading">正在加载数据...</div>
      <div v-if="store.error" class="error-message">错误: {{ store.error }}</div>
  
      <form @submit.prevent="handleSubmit" v-if="!store.isLoading && formData">
        <div class="form-grid">
          <div class="form-group">
            <label for="round">当前轮次:</label>
            <input type="number" id="round" v-model.number="formData.round" min="1" required />
          </div>
          <div class="form-group">
            <label for="status">比赛状态:</label>
            <select id="status" v-model="formData.status">
              <option value="pending">准备中</option>
              <option value="live">进行中</option>
              <option value="paused">已暂停</option>
              <option value="finished">已结束</option>
            </select>
          </div>
        </div>
  
        <div class="teams-grid">
          <fieldset class="team-fieldset">
            <legend>队伍A</legend>
            <div class="form-group">
              <label for="teamA_name">名称:</label>
              <input type="text" id="teamA_name" v-model="formData.teamA_name" required />
            </div>
            <div class="form-group">
              <label for="teamA_player">选手:</label>
              <input type="text" id="teamA_player" v-model="formData.teamA_player" required />
            </div>
            <div class="form-group">
              <label for="teamA_score">得分:</label>
              <input type="number" id="teamA_score" v-model.number="formData.teamA_score" min="0" required />
            </div>
          </fieldset>
  
          <fieldset class="team-fieldset">
            <legend>队伍B</legend>
            <div class="form-group">
              <label for="teamB_name">名称:</label>
              <input type="text" id="teamB_name" v-model="formData.teamB_name" required />
            </div>
            <div class="form-group">
              <label for="teamB_player">选手:</label>
              <input type="text" id="teamB_player" v-model="formData.teamB_player" required />
            </div>
            <div class="form-group">
              <label for="teamB_score">得分:</label>
              <input type="number" id="teamB_score" v-model.number="formData.teamB_score" min="0" required />
            </div>
          </fieldset>
        </div>
        
        <button type="submit" :disabled="store.isLoading">
          {{ store.isLoading ? '更新中...' : '更新比赛信息' }}
        </button>
      </form>
      <div v-if="submitMessage" :class="['submit-message', messageType]">{{ submitMessage }}</div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, reactive } from 'vue';
  import { useMatchStore } from '@/stores/matchStore';
  import type { MatchState } from '@/types/match';
  import { defaultMatchFormData } from '@/types/match';
  
  const store = useMatchStore();
  const formData = reactive({ ...defaultMatchFormData }); // Local reactive copy for the form
  const submitMessage = ref('');
  const messageType = ref<'success' | 'error'>('success');
  
  // Fetch initial state when component is mounted
  onMounted(async () => {
    await store.fetchCurrentMatchState();
  });
  
  // Watch for changes in store.currentMatch to update the form
  // This ensures if data is fetched or updated (e.g. by another tab via WebSocket if admin also listened), form reflects it.
  watch(() => store.currentMatch, (newMatchData) => {
    if (newMatchData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { matchId, ...dataForForm } = newMatchData;
      Object.assign(formData, dataForForm);
    } else {
      Object.assign(formData, defaultMatchFormData); // Reset if no data
    }
  }, { immediate: true, deep: true });
  
  
  async function handleSubmit() {
    submitMessage.value = '';
    // Type assertion because formData is Omit<MatchState, 'matchId'>
    await store.updateMatch(formData as Omit<MatchState, 'matchId'>);
    if (store.error) {
      submitMessage.value = `更新失败: ${store.error}`;
      messageType.value = 'error';
    } else {
      submitMessage.value = '比赛信息更新成功!';
      messageType.value = 'success';
    }
  }
  </script>
  
  <style scoped>
  .admin-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 25px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .teams-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 25px;
  }
  
  .team-fieldset {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 20px;
  }
  
  .team-fieldset legend {
    font-weight: bold;
    color: #007bff;
    padding: 0 10px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
  }
  
  .form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #555;
  }
  
  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  button[type="submit"] {
    display: block;
    width: 100%;
    padding: 12px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background-color 0.2s;
  }
  
  button[type="submit"]:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  button[type="submit"]:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .loading, .error-message, .submit-message {
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 4px;
  }
  
  .loading {
    color: #007bff;
  }
  
  .error-message, .submit-message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  .submit-message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  </style>
  