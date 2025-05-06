<template>
    <div class="admin-panel p-6 bg-gray-800 text-white min-h-screen">
      <h1 class="text-4xl font-bold mb-8 text-center text-indigo-400">比赛控制面板</h1>
  
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-500 text-white rounded">
        错误: {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-4 p-3 bg-green-500 text-white rounded">
        {{ successMessage }}
      </div>
  
      <div v-if="matchState" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Team A -->
        <div class="team-control bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 text-center">{{ matchState.teamA_name }}</h2>
          <div class="mb-4">
            <label for="teamA_name" class="block mb-1 text-sm font-medium">队伍名称:</label>
            <input type="text" id="teamA_name" v-model="editableState.teamA_name" :disabled="isArchived"
                   class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="mb-4">
            <label for="teamA_player" class="block mb-1 text-sm font-medium">选手名称:</label>
            <input type="text" id="teamA_player" v-model="editableState.teamA_player" :disabled="isArchived"
                   class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="flex items-center justify-center space-x-4 mb-4">
            <button @click="decrementScore('teamA_score')" :disabled="isArchived"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-lg font-bold disabled:opacity-50">-</button>
            <span class="text-3xl font-bold w-16 text-center">{{ matchState.teamA_score }}</span>
            <button @click="incrementScore('teamA_score')" :disabled="isArchived"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-lg font-bold disabled:opacity-50">+</button>
          </div>
        </div>
  
        <!-- Team B -->
        <div class="team-control bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 text-center">{{ matchState.teamB_name }}</h2>
          <div class="mb-4">
            <label for="teamB_name" class="block mb-1 text-sm font-medium">队伍名称:</label>
            <input type="text" id="teamB_name" v-model="editableState.teamB_name" :disabled="isArchived"
                   class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="mb-4">
            <label for="teamB_player" class="block mb-1 text-sm font-medium">选手名称:</label>
            <input type="text" id="teamB_player" v-model="editableState.teamB_player" :disabled="isArchived"
                   class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="flex items-center justify-center space-x-4 mb-4">
            <button @click="decrementScore('teamB_score')" :disabled="isArchived"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full text-lg font-bold disabled:opacity-50">-</button>
            <span class="text-3xl font-bold w-16 text-center">{{ matchState.teamB_score }}</span>
            <button @click="incrementScore('teamB_score')" :disabled="isArchived"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-lg font-bold disabled:opacity-50">+</button>
          </div>
        </div>
  
        <!-- Match Info -->
        <div class="md:col-span-2 bg-gray-700 p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-semibold mb-4 text-center">比赛信息</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="round" class="block mb-1 text-sm font-medium">回合:</label>
              <input type="number" id="round" v-model.number="editableState.round" :disabled="isArchived" min="1"
                     class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div>
              <label for="status" class="block mb-1 text-sm font-medium">状态:</label>
              <select id="status" v-model="editableState.status" :disabled="isArchived"
                      class="w-full p-2 bg-gray-600 border border-gray-500 rounded focus:ring-indigo-500 focus:border-indigo-500">
                <option value="pending">准备中</option>,
                <option value="live">进行中</option>
                <option value="paused">已暂停</option>
                <option value="finished">已结束</option>
                <option value="archived_in_d1" disabled>已归档</option> <!-- Show but disable direct selection -->
              </select>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-10">
        <p class="text-xl">正在加载比赛数据...</p>
        <div class="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
      </div>
  
      <div class="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <button @click="updateMatchState" :disabled="isArchived || isLoading"
                class="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:opacity-50">
          {{ isLoading ? '更新中...' : '更新比赛状态' }}
        </button>
        <button @click="archiveMatch" :disabled="isArchived || isLoadingArchive"
                class="w-full sm:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 disabled:opacity-50">
          {{ isLoadingArchive ? '归档中...' : (isArchived ? '已归档' : '结束并归档比赛') }}
        </button>
        <button @click="fetchCurrentState" :disabled="isLoading"
                class="w-full sm:w-auto px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 disabled:opacity-50">
          刷新数据
        </button>
      </div>
  
      <!-- Display Archived Matches (Optional) -->
      <div class="mt-12">
          <h3 class="text-2xl font-semibold mb-4 text-indigo-300">已归档比赛记录</h3>
          <div v-if="isLoadingArchivedList" class="text-center">加载中...</div>
          <div v-else-if="archivedMatches.length === 0" class="text-gray-400">暂无归档记录。</div>
          <ul v-else class="space-y-2">
              <li v-for="archivedMatch in archivedMatches" :key="archivedMatch.id" class="bg-gray-700 p-3 rounded">
                  ID: {{ archivedMatch.match_do_id }} - {{ archivedMatch.team_a_name }} vs {{ archivedMatch.team_b_name }} ({{ archivedMatch.team_a_score }} : {{ archivedMatch.team_b_score }}) - {{ new Date(archivedMatch.archived_at).toLocaleString() }}
              </li>
          </ul>
          <button @click="fetchArchivedMatches" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">刷新归档列表</button>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue';
  import type { MatchState, ArchivedMatchSummary } from '../types/match'; // Adjust path if needed
  
  const API_BASE_URL = ''; // Assuming requests are to the same origin as the frontend
  
  const matchState = ref<MatchState | null>(null);
  const editableState = ref<Partial<MatchState>>({}); // For form bindings
  const errorMessage = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const isLoading = ref(false);
  const isLoadingArchive = ref(false);
  
  const archivedMatches = ref<ArchivedMatchSummary[]>([]);
  const isLoadingArchivedList = ref(false);
  
  
  const isArchived = computed(() => matchState.value?.status === 'archived_in_d1');
  
  let socket: WebSocket | null = null;
  
  const connectWebSocket = () => {
    // Construct WebSocket URL relative to the current host
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/match/websocket`;
  
    socket = new WebSocket(wsUrl);
  
    socket.onopen = () => {
      console.log('Admin WebSocket connected');
      errorMessage.value = null;
    };
  
    socket.onmessage = (event) => {
      try {
        const data: MatchState = JSON.parse(event.data as string);
        matchState.value = data;
        // Update editableState only if it's not currently being edited, or if data is newer
        // This simple version just updates it. For complex forms, you might need more logic.
        editableState.value = { ...data };
        console.log('Admin received state via WebSocket:', data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        errorMessage.value = '无法解析来自服务器的数据。';
      }
    };
  
    socket.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      errorMessage.value = 'WebSocket 连接错误。尝试刷新页面。';
    };
  
    socket.onclose = () => {
      console.log('Admin WebSocket disconnected. Attempting to reconnect...');
      errorMessage.value = 'WebSocket 连接已断开。正在尝试重连...';
      // Simple reconnect logic
      setTimeout(connectWebSocket, 3000);
    };
  };
  
  
  const fetchCurrentState = async () => {
    isLoading.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/state`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data: MatchState = await response.json();
      matchState.value = data;
      editableState.value = { ...data }; // Initialize editable state
    } catch (error: any) {
      console.error('Error fetching match state:', error);
      errorMessage.value = `获取比赛状态失败: ${error.message}`;
    } finally {
      isLoading.value = false;
    }
  };
  
  const updateMatchState = async () => {
    if (!editableState.value || Object.keys(editableState.value).length === 0) {
      errorMessage.value = "没有可更新的数据。";
      return;
    }
    if (isArchived.value) {
      errorMessage.value = "比赛已归档，无法更新。";
      return;
    }
  
    isLoading.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      // Prepare only changed values or send the whole editableState
      // For simplicity, sending the relevant parts of editableState
      const payload: Partial<Omit<MatchState, 'matchId'>> = {
        round: editableState.value.round,
        teamA_name: editableState.value.teamA_name,
        teamA_score: editableState.value.teamA_score,
        teamA_player: editableState.value.teamA_player,
        teamB_name: editableState.value.teamB_name,
        teamB_score: editableState.value.teamB_score,
        teamB_player: editableState.value.teamB_player,
        status: editableState.value.status as MatchState['status'], // Cast here
      };
      // Remove undefined properties if any
      Object.keys(payload).forEach(key => payload[key as keyof typeof payload] === undefined && delete payload[key as keyof typeof payload]);
  
  
      const response = await fetch(`${API_BASE_URL}/api/match/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        successMessage.value = '比赛状态更新成功！';
        // matchState will be updated by WebSocket, or call fetchCurrentState()
      } else {
        throw new Error(data.error || '更新失败，未知错误。');
      }
    } catch (error: any) {
      console.error('Error updating match state:', error);
      errorMessage.value = `更新比赛状态失败: ${error.message}`;
    } finally {
      isLoading.value = false;
    }
  };
  
  const archiveMatch = async () => {
    if (isArchived.value) {
      successMessage.value = "比赛已经归档。";
      return;
    }
    if (!confirm("确定要结束并归档当前比赛吗？此操作会将当前比赛数据存入数据库。")) {
      return;
    }
  
    isLoadingArchive.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Though body might be empty
        },
        // body: JSON.stringify({}), // Optional: send a body if your DO expects one
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        successMessage.value = `比赛归档成功！记录 ID: ${data.d1RecordId}`;
        // The WebSocket should update the state to 'archived_in_d1'
        // Optionally, fetch the state again to be sure
        await fetchCurrentState();
        await fetchArchivedMatches(); // Refresh the list of archived matches
      } else {
        throw new Error(data.message || '归档失败，未知错误。');
      }
    } catch (error: any) {
      console.error('Error archiving match:', error);
      errorMessage.value = `归档比赛失败: ${error.message}`;
    } finally {
      isLoadingArchive.value = false;
    }
  };
  
  
  const incrementScore = (teamScoreKey: 'teamA_score' | 'teamB_score') => {
    if (isArchived.value || !editableState.value) return;
    if (editableState.value[teamScoreKey] !== undefined) {
      editableState.value[teamScoreKey] = (editableState.value[teamScoreKey] ?? 0) + 1;
    }
  };
  
  const decrementScore = (teamScoreKey: 'teamA_score' | 'teamB_score') => {
    if (isArchived.value || !editableState.value) return;
    if (editableState.value[teamScoreKey] !== undefined && (editableState.value[teamScoreKey] ?? 0) > 0) {
      editableState.value[teamScoreKey] = (editableState.value[teamScoreKey] ?? 0) - 1;
    }
  };
  
  const fetchArchivedMatches = async () => {
      isLoadingArchivedList.value = true;
      try {
          const response = await fetch(`${API_BASE_URL}/api/archived_matches`);
          if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
          }
          archivedMatches.value = await response.json();
      } catch (error) {
          console.error("Error fetching archived matches:", error);
          errorMessage.value = "获取归档列表失败。";
      } finally {
          isLoadingArchivedList.value = false;
      }
  };
  
  onMounted(() => {
    fetchCurrentState();
    connectWebSocket();
    fetchArchivedMatches(); // Load archived matches on mount
  });
  
  // Watch for external changes to matchState (e.g., from WebSocket) and update editableState
  // This helps keep the form in sync if data changes outside of direct form input
  watch(matchState, (newState) => {
    if (newState) {
      // A simple merge. For more complex scenarios, you might need a deep merge
      // or more sophisticated logic to avoid overwriting user edits prematurely.
      editableState.value = { ...newState };
    }
  }, { deep: true });
  
  </script>
  
  <style scoped>
  /* Add any additional scoped styles here if needed */
  .disabled\:opacity-50:disabled {
    opacity: 0.5;
  }
  input:disabled, select:disabled, button:disabled {
    cursor: not-allowed;
  }
  </style>
  