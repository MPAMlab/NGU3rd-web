<template>
    <div class="admin-page">
      <h1>比赛管理后台</h1>

      <div v-if="store.isLoading && !store.currentMatch" class="loading">正在加载数据...</div>
      <div v-if="store.error" class="error-message">错误: {{ store.error }}</div>
      <div v-if="submitMessage" :class="['submit-message', messageType]">{{ submitMessage }}</div>


      <form @submit.prevent="handleSubmit" v-if="!store.isLoading && store.currentMatch && formData">
        <div class="form-grid">
          <div class="form-group">
            <label for="round">当前轮次:</label>
            <input type="number" id="round" v-model.number="formData.round" min="1" required :disabled="store.isCurrentMatchArchived" />
          </div>
          <div class="form-group">
            <label for="status">比赛状态:</label>
            <select id="status" v-model="formData.status" :disabled="store.isCurrentMatchArchived">
              <option value="pending">准备中</option>
              <option value="live">进行中</option>
              <option value="paused">已暂停</option>
              <option value="finished">已结束</option>
              <option value="archived_in_d1" disabled>已归档</option> <!-- Show but disable direct selection -->
            </select>
          </div>
        </div>

        <div class="teams-grid">
          <fieldset class="team-fieldset">
            <legend>队伍A</legend>
            <div class="form-group">
              <label for="teamA_name">名称:</label>
              <input type="text" id="teamA_name" v-model="formData.teamA_name" required :disabled="store.isCurrentMatchArchived" />
            </div>
            <div class="form-group">
              <label for="teamA_player">选手:</label>
              <input type="text" id="teamA_player" v-model="formData.teamA_player" required :disabled="store.isCurrentMatchArchived" />
            </div>
            <div class="form-group">
              <label for="teamA_score">得分:</label>
              <input type="number" id="teamA_score" v-model.number="formData.teamA_score" min="0" required :disabled="store.isCurrentMatchArchived" />
            </div>
          </fieldset>

          <fieldset class="team-fieldset">
            <legend>队伍B</legend>
            <div class="form-group">
              <label for="teamB_name">名称:</label>
              <input type="text" id="teamB_name" v-model="formData.teamB_name" required :disabled="store.isCurrentMatchArchived" />
            </div>
            <div class="form-group">
              <label for="teamB_player">选手:</label>
              <input type="text" id="teamB_player" v-model="formData.teamB_player" required :disabled="store.isCurrentMatchArchived" />
            </div>
            <div class="form-group">
              <label for="teamB_score">得分:</label>
              <input type="number" id="teamB_score" v-model.number="formData.teamB_score" min="0" required :disabled="store.isCurrentMatchArchived" />
            </div>
          </fieldset>
        </div>

        <div class="button-group">
            <button type="submit" :disabled="store.isLoading || store.isCurrentMatchArchived">
              {{ store.isLoading ? '更新中...' : '更新比赛信息' }}
            </button>
             <button type="button" @click="handleArchive" :disabled="store.isLoadingArchive || store.isCurrentMatchArchived">
              {{ store.isLoadingArchive ? '归档中...' : (store.isCurrentMatchArchived ? '已归档' : '结束并归档比赛') }}
            </button>
        </div>

      </form>
       <div v-else-if="!store.isLoading && !store.currentMatch" class="status-message">
          暂无比赛数据。
        </div>


      <!-- Display Archived Matches -->
      <div class="archived-matches-section">
          <h2>已归档比赛记录</h2>
          <div v-if="store.isLoadingArchivedList" class="loading">加载归档记录中...</div>
          <div v-else-if="store.archivedMatches.length === 0" class="status-message">暂无归档记录。</div>
          <ul v-else class="archived-list">
              <li v-for="archivedMatch in store.archivedMatches" :key="archivedMatch.id" class="archived-item">
                  <strong>ID:</strong> {{ archivedMatch.match_do_id }} <br>
                  <strong>队伍:</strong> {{ archivedMatch.team_a_name }} vs {{ archivedMatch.team_b_name }} <br>
                  <strong>比分:</strong> {{ archivedMatch.team_a_score }} : {{ archivedMatch.team_b_score }} <br>
                  <strong>状态:</strong> {{ archivedMatch.status }} <br>
                  <strong>归档时间:</strong> {{ new Date(archivedMatch.archived_at).toLocaleString() }}
              </li>
          </ul>
           <button type="button" @click="store.fetchArchivedMatches()" :disabled="store.isLoadingArchivedList">
              刷新归档列表
          </button>
      </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, onUnmounted } from 'vue';
import { useMatchStore } from '@/stores/matchStore';
import type { MatchState } from '@/types/match';
// Assuming defaultMatchFormData is not strictly needed if initializing from store.currentMatch
// import { defaultMatchFormData } from '@/types/match';

const store = useMatchStore();
// Initialize formData as an empty object, will be populated by the watch
const formData = reactive<Omit<MatchState, 'matchId'>>({
    round: 1,
    teamA_name: '',
    teamA_score: 0,
    teamA_player: '',
    teamB_name: '',
    teamB_score: 0,
    teamB_player: '',
    status: 'pending',
});

const submitMessage = ref('');
const messageType = ref<'success' | 'error'>('success');

// Fetch initial state and archived list when component is mounted
onMounted(async () => {
  await store.fetchCurrentMatchState();
  await store.fetchArchivedMatches();
  store.connectWebSocket(); // Connect WebSocket for real-time updates
});

// Watch for changes in store.currentMatch to update the form
watch(() => store.currentMatch, (newMatchData) => {
  if (newMatchData) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { matchId, ...dataForForm } = newMatchData;
    // Use Object.assign to update reactive formData
    Object.assign(formData, dataForForm);
  } else {
     // Reset form if currentMatch becomes null (e.g., error)
     Object.assign(formData, {
        round: 1, teamA_name: '', teamA_score: 0, teamA_player: '',
        teamB_name: '', teamB_score: 0, teamB_player: '', status: 'pending',
     });
  }
}, { immediate: true, deep: true }); // immediate: true runs the watcher once on mount

async function handleSubmit() {
  submitMessage.value = '';
  // Type assertion because formData is Omit<MatchState, 'matchId'>
  const success = await store.updateMatch(formData as Omit<MatchState, 'matchId'>);
  if (success) {
    submitMessage.value = '比赛信息更新成功!';
    messageType.value = 'success';
  } else {
    // Error message is already set in the store and displayed by v-if="store.error"
    // Optionally, you could copy it here if you prefer the submitMessage format
    // submitMessage.value = `更新失败: ${store.error}`;
    // messageType.value = 'error';
  }
}

async function handleArchive() {
    if (store.isCurrentMatchArchived) {
        submitMessage.value = "比赛已经归档。";
        messageType.value = 'success'; // Or 'warning'
        return;
    }
    if (!confirm("确定要结束并归档当前比赛吗？此操作会将当前比赛数据存入数据库。")) {
        return;
    }

    submitMessage.value = ''; // Clear previous messages
    const success = await store.archiveCurrentMatch();

    if (success) {
        submitMessage.value = '比赛归档成功！';
        messageType.value = 'success';
        // The watch on store.currentMatch will update the form and disable inputs
        // The fetchArchivedMatches call in the store action will update the list
    } else {
         // Error message is already set in the store
        // submitMessage.value = `归档失败: ${store.error}`;
        // messageType.value = 'error';
    }
}

// Clean up WebSocket on unmount
onUnmounted(() => {
    store.disconnectWebSocket();
});

</script>

<style scoped>
/* Keep your existing styles */
.admin-page {
  max-width: 800px;
  margin: 20px auto; /* Added margin top/bottom */
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

h2 { /* Style for "已归档比赛记录" title */
    color: #333;
    margin-top: 30px;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
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

/* Style for disabled inputs */
.form-group input:disabled,
.form-group select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
}


.button-group { /* Container for multiple buttons */
    display: flex;
    gap: 15px; /* Space between buttons */
    justify-content: center; /* Center buttons */
    margin-top: 20px;
    flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
}

.button-group button {
    flex-grow: 1; /* Allow buttons to grow */
    max-width: 300px; /* Max width for buttons */
    padding: 12px 20px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background-color 0.2s;
}

/* Specific button styles */
button[type="submit"] {
  background-color: #007bff;
}
button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}

/* Style for the new Archive button */
.button-group button:nth-of-type(2) { /* Select the second button in the group */
    background-color: #28a745; /* Green color */
}
.button-group button:nth-of-type(2):hover:not(:disabled) {
    background-color: #218838; /* Darker green on hover */
}

/* Style for the Refresh Archived List button */
.archived-matches-section button {
    display: inline-block; /* Make it inline */
    margin-top: 10px;
    padding: 8px 15px;
    background-color: #17a2b8; /* Info blue color */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
}
.archived-matches-section button:hover:not(:disabled) {
    background-color: #138496;
}


button:disabled {
  background-color: #ccc !important; /* Use !important to override specific styles */
  cursor: not-allowed;
  opacity: 0.7; /* Indicate disabled state */
}


.loading, .error-message, .submit-message, .status-message {
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
.status-message { /* General status message style */
    background-color: #e9ecef;
    color: #495057;
    border: 1px solid #dee2e6;
}


/* Archived List Styles */
.archived-matches-section {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.archived-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.archived-item {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 10px;
    font-size: 0.95em;
    line-height: 1.6;
}

.archived-item strong {
    color: #007bff;
}

</style>
