<template>
    <div class="admin-page">
      <h1>比赛管理后台</h1>

      <div v-if="store.isLoading && !store.currentMatch" class="loading">正在加载数据...</div>
      <div v-if="store.error" class="error-message">错误: {{ store.error }}</div>
      <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>


      <form @submit.prevent="handleSubmit" v-if="!store.isLoading && store.currentMatch && formData">
        <h2>当前比赛信息 (ID: {{ store.currentMatch.matchId }})</h2>
        <div v-if="store.isCurrentMatchArchived" class="status-message warning">
            当前比赛已整体归档，无法编辑。请开始新比赛。
        </div>

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
              <option value="archived_in_d1" disabled>已归档 (整场)</option> <!-- Show but disable direct selection -->
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
            <button type="submit" :disabled="store.isLoadingAction || store.isCurrentMatchArchived">
              {{ store.isLoadingAction && !store.actionMessage ? '更新中...' : '更新比赛信息' }}
            </button>
             <button type="button" @click="handleArchiveRound" :disabled="store.isLoadingAction || store.isCurrentMatchArchived">
              {{ store.isLoadingAction && !store.actionMessage ? '归档轮次中...' : '归档当前轮次' }}
            </button>
             <button type="button" @click="handleNextRound" :disabled="store.isLoadingAction || store.isCurrentMatchArchived || formData.status === 'finished'">
              {{ store.isLoadingAction && !store.actionMessage ? '进入下一轮中...' : '进入下一轮' }}
            </button>
        </div>
         <div class="button-group mt-4"> <!-- New button group for match actions -->
             <button type="button" @click="handleArchiveMatch" :disabled="store.isLoadingAction || store.isCurrentMatchArchived">
              {{ store.isLoadingAction && !store.actionMessage ? '归档比赛中...' : (store.isCurrentMatchArchived ? '已归档整场比赛' : '归档整场比赛') }}
            </button>
             <button type="button" @click="handleNewMatch" :disabled="store.isLoadingAction || !store.isCurrentMatchArchived">
              {{ store.isLoadingAction && !store.actionMessage ? '开始新比赛中...' : '开始新比赛' }}
            </button>
         </div>


      </form>
       <div v-else-if="!store.isLoading && !store.currentMatch" class="status-message">
          暂无比赛数据。请尝试开始新比赛。
           <div class="button-group mt-4">
                <button type="button" @click="handleNewMatch" :disabled="store.isLoadingAction">
                    {{ store.isLoadingAction ? '开始新比赛中...' : '开始新比赛' }}
                </button>
           </div>
        </div>


      <!-- Display Archived Rounds for the Current Match -->
      <div class="archived-rounds-section" v-if="store.currentMatch">
          <h2>当前比赛 (ID: {{ store.currentMatch.matchId }}) 的归档轮次</h2>
          <div v-if="store.isLoadingArchivedRounds" class="loading">加载归档轮次中...</div>
          <div v-else-if="store.archivedRounds.length === 0" class="status-message">暂无归档轮次记录。</div>
          <ul v-else class="archived-list">
              <li v-for="archivedRound in store.archivedRounds" :key="archivedRound.id" class="archived-item">
                  <strong>轮次:</strong> {{ archivedRound.round_number }} <br>
                  <strong>队伍:</strong> {{ archivedRound.team_a_name }} vs {{ archivedRound.team_b_name }} <br>
                  <strong>比分:</strong> {{ archivedRound.team_a_score }} : {{ archivedRound.team_b_score }} <br>
                  <strong>状态:</strong> {{ archivedRound.status }} <br>
                  <strong>归档时间:</strong> {{ new Date(archivedRound.archived_at).toLocaleString() }}
                  <!-- Add Edit button here if implementing editing -->
                  <!-- <button @click="editRound(archivedRound)">编辑</button> -->
              </li>
          </ul>
           <button type="button" @click="store.fetchArchivedRounds(store.currentMatch.matchId)" :disabled="store.isLoadingArchivedRounds">
              刷新归档轮次列表
          </button>
      </div>

       <!-- Display Archived Matches (Summaries) -->
      <div class="archived-matches-section">
          <h2>已归档比赛记录 (摘要)</h2>
          <div v-if="store.isLoadingArchivedMatches" class="loading">加载归档比赛中...</div>
          <div v-else-if="store.archivedMatches.length === 0" class="status-message">暂无归档比赛记录。</div>
          <ul v-else class="archived-list">
              <li v-for="archivedMatch in store.archivedMatches" :key="archivedMatch.id" class="archived-item">
                  <strong>比赛 ID:</strong> {{ archivedMatch.match_do_id }} <br>
                   <span v-if="archivedMatch.match_name"><strong>名称:</strong> {{ archivedMatch.match_name }} <br></span>
                  <strong>最终轮次:</strong> {{ archivedMatch.final_round }} <br>
                  <strong>最终比分:</strong> {{ archivedMatch.team_a_name }} {{ archivedMatch.team_a_score }} : {{ archivedMatch.team_b_score }} {{ archivedMatch.team_b_name }} <br>
                  <strong>状态:</strong> {{ archivedMatch.status }} <br>
                  <strong>归档时间:</strong> {{ new Date(archivedMatch.archived_at).toLocaleString() }}
                  <!-- Add button to view archived rounds for this match if needed -->
                  <!-- <button @click="viewArchivedRoundsForMatch(archivedMatch.match_do_id)">查看轮次</button> -->
              </li>
          </ul>
           <button type="button" @click="store.fetchArchivedMatches()" :disabled="store.isLoadingArchivedMatches">
              刷新归档比赛列表
          </button>
      </div>


    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, onUnmounted } from 'vue'; // Import onUnmounted
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

// submitMessage and messageType are now handled by store.actionMessage and store.error
// const submitMessage = ref('');
// const messageType = ref<'success' | 'error'>('success');

// Fetch initial state and archived lists when component is mounted
onMounted(async () => {
  await store.fetchCurrentMatchState(); // This will also trigger fetching archived rounds for this match
  await store.fetchArchivedMatches(); // Fetch list of archived match summaries
  store.connectWebSocket(); // Connect WebSocket for real-time updates
});

// Watch for changes in store.currentMatch to update the form
watch(() => store.currentMatch, (newMatchData) => {
  if (newMatchData) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { matchId, ...dataForForm } = newMatchData;
    // Use Object.assign to update reactive formData
    Object.assign(formData, dataForForm);
    // When currentMatch changes (e.g., new match started), refresh archived rounds for the new ID
    store.fetchArchivedRounds(newMatchData.matchId);
  } else {
     // Reset form if currentMatch becomes null (e.g., error or before new match loads)
     Object.assign(formData, {
        round: 1, teamA_name: '', teamA_score: 0, teamA_player: '',
        teamB_name: '', teamB_score: 0, teamB_player: '', status: 'pending',
     });
     store.archivedRounds = []; // Clear rounds list if no current match
  }
}, { immediate: true, deep: true }); // immediate: true runs the watcher once on mount

async function handleSubmit() {
  // submitMessage.value = ''; // Handled by store
  // Type assertion because formData is Omit<MatchState, 'matchId'>
  const success = await store.updateMatch(formData as Omit<MatchState, 'matchId'>);
  // Feedback is now handled by store.actionMessage or store.error
  // if (success) {
  //   submitMessage.value = '比赛信息更新成功!';
  //   messageType.value = 'success';
  // } else {
  //   submitMessage.value = `更新失败: ${store.error}`;
  //   messageType.value = 'error';
  // }
}

async function handleArchiveRound() {
    // Confirmation is handled in the store action if needed, or add here
    await store.archiveCurrentRound();
    // Feedback handled by store.actionMessage/error
}

async function handleNextRound() {
     // Confirmation is handled in the store action if needed, or add here
    await store.nextRound();
    // Feedback handled by store.actionMessage/error
}

async function handleArchiveMatch() {
    // Confirmation is handled in the store action
    await store.archiveMatch();
    // Feedback handled by store.actionMessage/error
}

async function handleNewMatch() {
    // Confirmation is handled in the store action
    await store.newMatch();
    // Feedback handled by store.actionMessage/error
}


// Clean up WebSocket on unmount
onUnmounted(() => {
    store.disconnectWebSocket();
});

</script>

<style scoped>
/* Keep your existing styles and add new ones */
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

h2 { /* Style for section titles */
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
.button-group button[type="submit"] {
  background-color: #007bff; /* Blue */
}
.button-group button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}

/* Style for Archive Round button */
.button-group button:nth-of-type(2) {
    background-color: #ffc107; /* Yellow/Warning */
    color: #212529; /* Dark text for contrast */
}
.button-group button:nth-of-type(2):hover:not(:disabled) {
    background-color: #e0a800;
}

/* Style for Next Round button */
.button-group button:nth-of-type(3) {
    background-color: #17a2b8; /* Info Blue */
}
.button-group button:nth-of-type(3):hover:not(:disabled) {
    background-color: #138496;
}

/* Style for Archive Match button */
.button-group.mt-4 button:nth-of-type(1) {
    background-color: #dc3545; /* Red/Danger */
}
.button-group.mt-4 button:nth-of-type(1):hover:not(:disabled) {
    background-color: #c82333;
}

/* Style for New Match button */
.button-group.mt-4 button:nth-of-type(2) {
    background-color: #28a745; /* Green/Success */
}
.button-group.mt-4 button:nth-of-type(2):hover:not(:disabled) {
    background-color: #218838;
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

.error-message { /* Use this for store.error */
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.submit-message.success { /* Use this for store.actionMessage */
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.status-message { /* General status message style */
    background-color: #e9ecef;
    color: #495057;
    border: 1px solid #dee2e6;
}
.status-message.warning { /* Style for the archived warning */
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}


/* Archived List Styles */
.archived-rounds-section, .archived-matches-section {
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

/* Style for refresh buttons below lists */
.archived-rounds-section > button,
.archived-matches-section > button {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 15px;
    background-color: #6c757d; /* Secondary grey */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
}
.archived-rounds-section > button:hover:not(:disabled),
.archived-matches-section > button:hover:not(:disabled) {
    background-color: #5a6268;
}


</style>
