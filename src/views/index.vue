<template>
    <div class="admin-page">
      <h1>比赛管理后台</h1>

      <div class="navigation-links">
          <router-link to="/admin/teams" class="nav-button">队伍管理</router-link>
          <router-link to="/admin/schedule" class="nav-button">赛程管理</router-link>
          <!-- <router-link to="/admin/members" class="nav-button">队员管理 (全局)</router-link> -->
      </div>

      <!-- Display current match info ONLY if matchDOId is available from route -->
      <div v-if="matchDOId">
          <div v-if="store.isLoading && !store.currentMatch" class="loading">正在加载比赛数据 (ID: {{ matchDOId }})</div>
          <div v-if="store.error && !store.currentMatch" class="status-message error">
            加载比赛数据失败 (ID: {{ matchDOId }}): {{ store.error }}
          </div>
          <!-- Show WS warning only if not archived -->
          <div v-if="!store.isConnected && store.currentMatch && !store.isCurrentMatchArchived" class="status-message warning">
            ⚠️ WebSocket 未连接，数据可能不是最新的。
          </div>
           <div v-if="store.isConnected && !store.currentMatch" class="status-message">
            等待比赛数据 (ID: {{ matchDOId }})
          </div>


          <form @submit.prevent="handleSubmit" v-if="!store.isLoading && store.currentMatch && formData">
            <h2>当前比赛信息 (ID: {{ store.currentMatch.matchId }})</h2>
            <div v-if="store.currentMatch.tournamentMatchId">
                <p>关联赛程 ID: <strong>{{ store.currentMatch.tournamentMatchId }}</strong></p>
                <!-- Optional: Fetch and display more details about the linked tournament match -->
            </div>
            <div v-if="store.isCurrentMatchArchived" class="status-message warning">
                当前比赛已整体归档，无法编辑。请从赛程管理启动新比赛。
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="round">当前轮次:</label>
                <!-- Round is managed by DO, make it read-only -->
                <input type="number" id="round" :value="store.currentMatch.round" disabled />
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
                  <label for="teamA_player">当前选手:</label>
                   <!-- Player name is now derived from DO state, make it read-only -->
                  <input type="text" id="teamA_player" :value="store.currentMatch.teamA_player" disabled />
                </div>
                <div class="form-group">
                  <label for="teamA_score">得分:</label>
                  <input type="number" id="teamA_score" v-model.number="formData.teamA_score" min="0" required :disabled="store.isCurrentMatchArchived" />
                </div>
                 <!-- Optional: Display full member list and current order -->
                 <div v-if="store.currentMatch?.teamA_members?.length">
                     <h4>队伍A 队员列表 (按ID排序):</h4>
                     <ul>
                         <li v-for="member in store.currentMatch.teamA_members" :key="member.id">
                             ID: {{ member.id }}, 昵称: {{ member.nickname }}
                         </li>
                     </ul>
                     <h4>队伍A 出场顺序 (成员ID):</h4>
                     <p>{{ store.currentMatch.teamA_player_order_ids?.join(', ') || '-' }}</p>
                     <h4>队伍A 当前出场索引:</h4>
                     <p>{{ store.currentMatch.current_player_index_a }}</p>
                 </div>
              </fieldset>

              <fieldset class="team-fieldset">
                <legend>队伍B</legend>
                <div class="form-group">
                  <label for="teamB_name">名称:</label>
                  <input type="text" id="teamB_name" v-model="formData.teamB_name" required :disabled="store.isCurrentMatchArchived" />
                </div>
                <div class="form-group">
                  <label for="teamB_player">当前选手:</label>
                   <!-- Player name is now derived from DO state, make it read-only -->
                  <input type="text" id="teamB_player" :value="store.currentMatch.teamB_player" disabled />
                </div>
                <div class="form-group">
                  <label for="teamB_score">得分:</label>
                  <input type="number" id="teamB_score" v-model.number="formData.teamB_score" min="0" required :disabled="store.isCurrentMatchArchived" />
                </div>
                 <!-- Optional: Display full member list and current order -->
                 <div v-if="store.currentMatch?.teamB_members?.length">
                     <h4>队伍B 队员列表 (按ID排序):</h4>
                     <ul>
                         <li v-for="member in store.currentMatch.teamB_members" :key="member.id">
                             ID: {{ member.id }}, 昵称: {{ member.nickname }}
                         </li>
                     </ul>
                     <h4>队伍B 出场顺序 (成员ID):</h4>
                     <p>{{ store.currentMatch.teamB_player_order_ids?.join(', ') || '-' }}</p>
                     <h4>队伍B 当前出场索引:</h4>
                     <p>{{ store.currentMatch.current_player_index_b }}</p>
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
             </div>
          </form>
           <div v-else-if="!store.isLoading && !store.error" class="status-message">
              无法加载比赛数据 (ID: {{ matchDOId }})。请确认 ID 是否正确或比赛是否存在。
               <!-- Optional: Add a link back to Schedule Management -->
                <div class="button-group mt-4">
                    <router-link to="/admin/schedule" class="nav-button">返回赛程管理</router-link>
                </div>
            </div>
      </div>
      <div v-else class="status-message">
          请从赛程管理页面选择一场已启动的比赛进行管理。
           <div class="button-group mt-4">
                <router-link to="/admin/schedule" class="nav-button">前往赛程管理</router-link>
            </div>
      </div>


      <!-- Display Archived Rounds for the Current Match (if matchDOId is available) -->
      <div class="archived-rounds-section" v-if="matchDOId">
          <h2>当前比赛 (ID: {{ matchDOId }}) 的归档轮次</h2>
          <div v-if="store.isLoadingArchivedRounds" class="loading">加载归档轮次中...</div>
          <div v-else-if="store.archivedRounds.length === 0" class="status-message">暂无归档轮次记录。</div>
          <ul v-else class="archived-list">
              <li v-for="archivedRound in store.archivedRounds" :key="archivedRound.id" class="archived-item">
                  <strong>轮次:</strong> {{ archivedRound.round_number }} <br>
                  <strong>队伍:</strong> {{ archivedRound.team_a_name }} vs {{ archivedRound.team_b_name }} <br>
                  <strong>比分:</strong> {{ archivedRound.team_a_score }} : {{ archivedRound.team_b_score }} <br>
                  <span v-if="archivedRound.winner_team_name"><strong>赢家:</strong> {{ archivedRound.winner_team_name }} <br></span>
                  <strong>状态:</strong> {{ archivedRound.status }} <br>
                  <strong>归档时间:</strong> {{ new Date(archivedRound.archived_at).toLocaleString() }}
                  <!-- Add Edit button -->
                  <button @click="store.startEditingRound(archivedRound)" class="edit-button">编辑</button>
              </li>
          </ul>
           <button type="button" @click="store.fetchArchivedRounds(matchDOId)" :disabled="store.isLoadingArchivedRounds">
              刷新归档轮次列表
          </button>
      </div>

       <!-- Display Archived Matches (Summaries) - This section can remain global -->
      <div class="archived-matches-section">
          <h2>已归档比赛记录 (摘要)</h2>
          <div v-if="store.isLoadingArchivedMatches" class="loading">加载归档比赛中...</div>
          <div v-else-if="store.archivedMatches.length === 0" class="status-message">暂无归档比赛记录。</div>
          <ul v-else class="archived-list">
              <li v-for="archivedMatch in store.archivedMatches" :key="archivedMatch.id" class="archived-item">
                  <strong>比赛 ID:</strong> {{ archivedMatch.match_do_id }} <br>
                   <span v-if="archivedMatch.tournament_match_id"><strong>赛程 ID:</strong> {{ archivedMatch.tournament_match_id }} <br></span>
                   <span v-if="archivedMatch.match_name"><strong>名称:</strong> {{ archivedMatch.match_name }} <br></span>
                  <strong>最终轮次:</strong> {{ archivedMatch.final_round }} <br>
                  <strong>最终比分:</strong> {{ archivedMatch.team_a_name }} {{ archivedMatch.team_a_score }} : {{ archivedMatch.team_b_score }} {{ archivedMatch.team_b_name }} <br>
                   <span v-if="archivedMatch.winner_team_name"><strong>赢家:</strong> {{ archivedMatch.winner_team_name }} <br></span>
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

      <!-- Edit Archived Round Modal/Form -->
      <div v-if="store.editingRound" class="modal-overlay">
          <div class="modal-content">
              <h3>编辑归档轮次 {{ store.editingRound.round_number }} (ID: {{ store.editingRound.id }})</h3>
               <div v-if="store.error" class="error-message">{{ store.error }}</div>
               <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>

              <form @submit.prevent="handleSaveEditedRound">
                  <div class="form-grid">
                      <div class="form-group">
                          <label>队伍A 名称:</label>
                          <input type="text" v-model="store.editingRound.team_a_name" required />
                      </div>
                       <div class="form-group">
                          <label>队伍A 选手:</label>
                          <input type="text" v-model="store.editingRound.team_a_player" required />
                      </div>
                      <div class="form-group">
                          <label>队伍A 得分:</label>
                          <input type="number" v-model.number="store.editingRound.team_a_score" min="0" required />
                      </div>

                       <div class="form-group">
                          <label>队伍B 名称:</label>
                          <input type="text" v-model="store.editingRound.team_b_name" required />
                      </div>
                       <div class="form-group">
                          <label>队伍B 选手:</label>
                          <input type="text" v-model="store.editingRound.team_b_player" required />
                      </div>
                      <div class="form-group">
                          <label>队伍B 得分:</label>
                          <input type="number" v-model.number="store.editingRound.team_b_score" min="0" required />
                      </div>

                       <div class="form-group">
                          <label>状态:</label>
                           <select v-model="store.editingRound.status">
                              <option value="pending">准备中</option>
                              <option value="live">进行中</option>
                              <option value="paused">已暂停</option>
                              <option value="finished">已结束</option>
                              <!-- Archived status is for the whole match, not a round -->
                           </select>
                      </div>
                       <div class="form-group">
                          <label>赢家 (自动计算):</label>
                          <input type="text" :value="determineWinnerForEdit(store.editingRound)" disabled />
                      </div>
                  </div>

                  <div class="button-group">
                      <button type="submit" :disabled="store.isLoadingEditRound">
                          {{ store.isLoadingEditRound ? '保存中...' : '保存修改' }}
                      </button>
                      <button type="button" @click="store.cancelEditingRound()" :disabled="store.isLoadingEditRound">
                          取消
                      </button>
                  </div>
              </form>
          </div>
      </div>


    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, onUnmounted } from 'vue';
import { useMatchStore } from '@/stores/matchStore';
import type { MatchState, RoundArchive } from '@/types/match';
import { useRoute } from 'vue-router'; // Import useRoute

const store = useMatchStore();
const route = useRoute(); // Get the current route object

// Get the matchDOId from the route parameters (defined in router/index.ts)
// Use defineProps to receive it as a prop if props: true is set in the router
const props = defineProps<{
    matchDOId?: string;
}>();

// Use the prop directly
const matchDOId = props.matchDOId;


// Initialize formData as an empty object, will be populated by the watch
// Only include fields that can be updated via the /update endpoint
const formData = reactive<Partial<Pick<MatchState, 'teamA_name' | 'teamA_score' | 'teamB_name' | 'teamB_score' | 'status'>>>({
    teamA_name: '',
    teamA_score: 0,
    teamB_name: '',
    teamB_score: 0,
    status: 'pending',
});

// Fetch initial state and archived lists when component is mounted
onMounted(async () => {
  // Only fetch/connect if matchDOId is available from the route
  if (matchDOId) {
      // Pass the DO ID to the store actions
      await store.fetchCurrentMatchState(matchDOId);
      // fetchArchivedRounds is called by fetchCurrentMatchState if successful
      store.connectWebSocket(matchDOId); // Connect WebSocket for THIS match DO ID
  }
  // Fetch list of all archived match summaries (this can remain global)
  await store.fetchArchivedMatches();
});

// Watch for changes in the route's matchDOId
watch(() => props.matchDOId, async (newMatchDOId, oldMatchDOId) => {
    console.log(`Route matchDOId changed from ${oldMatchDOId} to ${newMatchDOId}`);
    // Disconnect old WebSocket if it exists and was for a different ID
    if (oldMatchDOId && oldMatchDOId !== newMatchDOId) {
        store.disconnectWebSocket(oldMatchDOId);
    }

    // If a new valid matchDOId is present, fetch state and connect WS
    if (newMatchDOId) {
        // Clear previous state immediately to show loading for the new match
        store.currentMatch = null;
        store.archivedRounds = [];
        // Pass the new DO ID to the store actions
        await store.fetchCurrentMatchState(newMatchDOId);
        // fetchArchivedRounds is called by fetchCurrentMatchState if successful
        store.connectWebSocket(newMatchDOId);
    } else {
        // If the new ID is null/undefined, clear current match state and disconnect WS
        store.disconnectWebSocket(); // Disconnect any active WS
        store.currentMatch = null;
        store.archivedRounds = [];
         // Reset form data
         Object.assign(formData, {
            teamA_name: '', teamA_score: 0, teamB_name: '', teamB_score: 0, status: 'pending',
         });
    }
}, { immediate: true, deep: true }); // immediate: true runs the watcher once on mount

// Watch for changes in store.currentMatch to update the form
// This watcher should only run if matchDOId is present and the state is for that ID
watch(() => store.currentMatch, (newMatchData) => {
  // Ensure newMatchData exists and its ID matches the current route ID
  if (newMatchData && matchDOId && newMatchData.matchId === matchDOId) {
    // Use Object.assign to update reactive formData, excluding properties not in formData type
    // Only assign fields that are part of formData
    formData.teamA_name = newMatchData.teamA_name;
    formData.teamA_score = newMatchData.teamA_score;
    formData.teamB_name = newMatchData.teamB_name;
    formData.teamB_score = newMatchData.teamB_score;
    formData.status = newMatchData.status;

    // Note: round, teamA_player, teamB_player are read-only and derived from DO state,
    // so they are not part of formData but displayed directly from store.currentMatch
    // The template already uses store.currentMatch for these read-only fields.

    // When currentMatch changes (e.g., new match started or state updated),
    // refresh archived rounds for the current match ID if it's not already loading
    // and if the match is not yet archived (archiving triggers a fetch)
    if (!store.isLoadingArchivedRounds && newMatchData.status !== 'archived_in_d1') {
         store.fetchArchivedRounds(newMatchData.matchId);
    }

  } else if (!newMatchData && matchDOId) {
     // If currentMatch becomes null while a matchDOId is expected, it means the match wasn't found or an error occurred
     // The error message will be displayed by the template
     // Optionally reset form, though the v-if handles hiding it
     Object.assign(formData, {
        teamA_name: '', teamA_score: 0, teamB_name: '', teamB_score: 0, status: 'pending',
     });
     store.archivedRounds = []; // Clear rounds list if no current match
  }
  // If matchDOId is null, the first watcher handles clearing state and form
}, { immediate: true, deep: true }); // immediate: true runs the watcher once on mount

async function handleSubmit() {
  if (!matchDOId) return; // Prevent action if no DO ID in route
  // Type assertion because formData is Partial<Pick<MatchState, ...>>
  const updatePayload = {
      teamA_name: formData.teamA_name,
      teamA_score: formData.teamA_score,
      teamB_name: formData.teamB_name,
      teamB_score: formData.teamB_score,
      status: formData.status,
  };
  // Pass the matchDOId to the store action
  await store.updateMatch(matchDOId, updatePayload);
  // Feedback is now handled by store.actionMessage or store.error
}

async function handleArchiveRound() {
    if (!matchDOId) return;
    // Confirmation is handled in the store action if needed, or add here
    // Pass the matchDOId to the store action
    await store.archiveCurrentRound(matchDOId);
    // Feedback handled by store.actionMessage/error
}

async function handleNextRound() {
     if (!matchDOId) return;
     // Confirmation is handled in the store action if needed, or add here
     // Pass the matchDOId to the store action
    await store.nextRound(matchDOId);
    // Feedback handled by store.actionMessage/error
}

async function handleArchiveMatch() {
    if (!matchDOId) return;
    // Confirmation is handled in the store action
    // Pass the matchDOId to the store action
    await store.archiveMatch(matchDOId);
    // Feedback handled by store.actionMessage/error
}

// Removed handleNewMatch as it's now handled via Schedule Management

async function handleSaveEditedRound() {
    if (store.editingRound) {
        // The editingRound object already contains match_do_id and id
        await store.saveEditedRound(store.editingRound);
        // Feedback handled by store.actionMessage/error
    }
}

// Helper to determine winner for display in the edit modal
function determineWinnerForEdit(round: RoundArchive): string {
    if (round.team_a_score > round.team_b_score) {
        return round.team_a_name || '队伍A';
    } else if (round.team_b_score > round.team_a_score) {
        return round.team_b_name || '队伍B';
    } else {
        return '平局';
    }
}


// Clean up WebSocket on unmount
onUnmounted(() => {
    // Disconnect the specific WebSocket connection if one exists
    if (matchDOId) {
        store.disconnectWebSocket(matchDOId);
    }
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

.navigation-links {
    text-align: center;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
}

.nav-button {
    display: inline-block;
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color 0.2s;
}
.nav-button:hover {
    background-color: #0056b3;
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
    position: relative; /* Needed for absolute positioning of edit button */
}

.archived-item strong {
    color: #007bff;
}

.archived-item .edit-button {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    background-color: #6c757d; /* Secondary grey */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    transition: background-color 0.2s;
}
.archived-item .edit-button:hover {
    background-color: #5a6268;
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


/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top */
}

.modal-content {
    background-color: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 90%;
    max-height: 90vh; /* Limit height */
    overflow-y: auto; /* Add scroll if content overflows */
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
    text-align: center;
}

.modal-content .form-grid {
    grid-template-columns: 1fr 1fr; /* Two columns for modal form */
    gap: 15px;
    margin-bottom: 20px;
}

.modal-content .button-group {
    margin-top: 20px;
}

.modal-content .button-group button {
    max-width: 150px; /* Smaller buttons in modal */
}

.modal-content .button-group button[type="submit"] {
    background-color: #28a745; /* Green for save */
}
.modal-content .button-group button[type="submit"]:hover:not(:disabled) {
    background-color: #218838;
}

.modal-content .button-group button:nth-of-type(2) {
    background-color: #6c757d; /* Grey for cancel */
}
.modal-content .button-group button:nth-of-type(2):hover:not(:disabled) {
    background-color: #5a6268;
}

</style>
