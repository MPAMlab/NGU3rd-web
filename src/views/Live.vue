<template>
    <div class="live-view p-4 sm:p-8 bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
      <div v-if="isLoading" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
        <p class="text-xl text-gray-300">正在连接到比赛服务器...</p>
      </div>
      <div v-else-if="errorMessage" class="bg-red-700 p-6 rounded-lg shadow-xl text-center">
        <h2 class="text-2xl font-bold mb-2">连接错误</h2>
        <p>{{ errorMessage }}</p>
        <button @click="reconnectWebSocket" class="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold">
          尝试重连
        </button>
      </div>
      <div v-else-if="matchState" class="w-full max-w-4xl bg-gray-800 shadow-2xl rounded-xl overflow-hidden">
        <header class="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 text-center">
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight">电竞比赛直播</h1>
          <p class="text-lg text-indigo-200 mt-1">回合 {{ matchState.round }} - 状态: {{ getStatusText(matchState.status) }}</p>
        </header>
  
        <div v-if="matchState.status === 'archived_in_d1'" class="p-8 text-center">
          <h2 class="text-3xl font-semibold text-yellow-400 mb-4">比赛已结束并归档</h2>
          <p class="text-xl text-gray-300">感谢您的关注！最终比分如下：</p>
        </div>
  
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <!-- Team A -->
          <div class="team-display p-6 sm:p-8 bg-gray-700 md:rounded-bl-xl">
            <h2 class="text-2xl sm:text-3xl font-bold text-center text-blue-400 mb-3">{{ matchState.teamA_name }}</h2>
            <p class="text-center text-lg text-gray-300 mb-4">选手: {{ matchState.teamA_player || 'N/A' }}</p>
            <div class="score text-6xl sm:text-7xl font-mono font-bold text-center text-blue-300 py-4 bg-gray-600 rounded-lg">
              {{ matchState.teamA_score }}
            </div>
          </div>
  
          <!-- Team B -->
          <div class="team-display p-6 sm:p-8 bg-gray-750 md:rounded-br-xl">
            <h2 class="text-2xl sm:text-3xl font-bold text-center text-red-400 mb-3">{{ matchState.teamB_name }}</h2>
            <p class="text-center text-lg text-gray-300 mb-4">选手: {{ matchState.teamB_player || 'N/A' }}</p>
            <div class="score text-6xl sm:text-7xl font-mono font-bold text-center text-red-300 py-4 bg-gray-650 rounded-lg">
              {{ matchState.teamB_score }}
            </div>
          </div>
        </div>
         <footer v-if="matchState.status !== 'archived_in_d1'" class="p-4 bg-gray-800 text-center text-sm text-gray-400 border-t border-gray-700">
          比赛 ID: {{ matchState.matchId }}
        </footer>
        <footer v-else class="p-4 bg-gray-800 text-center text-sm text-gray-400 border-t border-gray-700">
          比赛已结束。感谢观看！
        </footer>
      </div>
       <div v-else class="text-center text-xl text-gray-400">
        等待比赛数据...
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import type { MatchState } from '../types/match'; // Adjust path if needed
  
  const matchState = ref<MatchState | null>(null);
  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  const getStatusText = (status: MatchState['status']): string => {
    switch (status) {
      case 'pending': return '准备中';
      case 'live': return '进行中';
      case 'paused': return '已暂停';
      case 'finished': return '已结束';
      case 'archived_in_d1': return '已归档';
      default: return '未知';
    }
  };
  
  const connectWebSocket = () => {
    isLoading.value = true;
    errorMessage.value = null;
  
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/match/websocket`;
  
    socket = new WebSocket(wsUrl);
  
    socket.onopen = () => {
      console.log('Live WebSocket connected');
      isLoading.value = false;
      errorMessage.value = null;
      reconnectAttempts = 0; // Reset attempts on successful connection
    };
  
    socket.onmessage = (event) => {
      try {
        const data: MatchState = JSON.parse(event.data as string);
        matchState.value = data;
        console.log('Live received state via WebSocket:', data);
        if (data.status === 'archived_in_d1' && socket) {
          // Optional: close the WebSocket from client-side if match is archived
          // to save resources, as no more updates are expected for this specific "live" view.
          // socket.close(1000, "Match archived, closing connection.");
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        // Don't set errorMessage here for parsing errors, as it might be a temporary glitch
      }
    };
  
    socket.onerror = (error) => {
      console.error('Live WebSocket error:', error);
      isLoading.value = false;
      // Don't show error immediately, try to reconnect first
      // errorMessage.value = 'WebSocket 连接发生错误。';
      handleDisconnect();
    };
  
    socket.onclose = (event) => {
      console.log('Live WebSocket disconnected:', event.reason, event.code);
      isLoading.value = false;
      if (event.code !== 1000) { // 1000 is normal closure
          handleDisconnect();
      }
    };
  };
  
  const handleDisconnect = () => {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
          errorMessage.value = `WebSocket 连接已断开。将在 ${delay / 1000} 秒后尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
          setTimeout(() => {
              if (socket?.readyState !== WebSocket.OPEN && socket?.readyState !== WebSocket.CONNECTING) {
                   connectWebSocket();
              }
          }, delay);
      } else {
          errorMessage.value = '无法连接到比赛服务器。请稍后刷新页面或联系管理员。';
      }
  };
  
  const reconnectWebSocket = () => {
      reconnectAttempts = 0; // Reset attempts for manual reconnect
      if (socket) {
          socket.close(); // Ensure old socket is closed before creating a new one
      }
      connectWebSocket();
  };
  
  
  onMounted(() => {
    connectWebSocket();
  });
  
  onUnmounted(() => {
    if (socket) {
      socket.close(1000, "Component unmounted"); // Normal closure
    }
  });
  </script>
  
  <style scoped>
  /* Add any additional scoped styles here if needed */
  .team-display {
    transition: all 0.3s ease-in-out;
  }
  .score {
    transition: color 0.3s ease-in-out, background-color 0.3s ease-in-out;
  }
  </style>
  