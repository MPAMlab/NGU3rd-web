import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MatchState } from '@/types/match';
import { defaultMatchFormData } from '@/types/match';

const API_URL_PREFIX = import.meta.env.VITE_API_URL_PREFIX || '/api/match'; // Fallback if env var is not set
const WS_URL = import.meta.env.VITE_WS_URL || 
               (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + 
               '//' + window.location.host + '/api/match/websocket'; // Dynamic fallback

export const useMatchStore = defineStore('match', () => {
  const currentMatch = ref<MatchState | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isConnected = ref(false);
  let socket: WebSocket | null = null;

  const matchDataForForm = computed(() => {
    if (currentMatch.value) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { matchId, ...formData } = currentMatch.value;
      return formData;
    }
    return { ...defaultMatchFormData };
  });

  async function fetchCurrentMatchState() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${API_URL_PREFIX}/state`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`获取比赛状态失败: ${errData.message || response.statusText}`);
      }
      const data: MatchState = await response.json();
      currentMatch.value = data;
    } catch (e: any) {
      console.error('Error fetching match state:', e);
      error.value = e.message;
      currentMatch.value = null; // Or set to a default error state
    } finally {
      isLoading.value = false;
    }
  }

  async function updateMatch(matchDetails: Omit<MatchState, 'matchId'>) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${API_URL_PREFIX}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchDetails),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`更新比赛失败: ${errData.error || errData.message || response.statusText}`);
      }
      const data: { success: boolean, data: MatchState } = await response.json();
      if (data.success) {
        currentMatch.value = data.data; // Update store with response from POST
                                        // WebSocket will also send this, but this is faster for admin UI
      } else {
        throw new Error('更新操作未成功');
      }
    } catch (e: any) {
      console.error('Error updating match:', e);
      error.value = e.message;
      // Optionally re-fetch state if update fails or rely on current data
      // await fetchCurrentMatchState(); 
    } finally {
      isLoading.value = false;
    }
  }

  function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    console.log('Attempting to connect WebSocket to:', WS_URL);
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      isConnected.value = true;
      error.value = null;
      console.log('WebSocket connection established.');
    };

    socket.onmessage = (event) => {
      try {
        const data: MatchState = JSON.parse(event.data as string);
        currentMatch.value = data;
        console.log('WebSocket message received:', data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        error.value = '无法解析实时数据';
      }
    };

    socket.onclose = (event) => {
      isConnected.value = false;
      console.log('WebSocket connection closed.', event.code, event.reason);
      // Optional: implement reconnection logic
      if (event.code !== 1000) { // 1000 is normal closure
        console.log('Attempting to reconnect WebSocket in 3 seconds...');
        setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = (err) => {
      isConnected.value = false;
      error.value = 'WebSocket 连接错误';
      console.error('WebSocket error:', err);
      // socket.close(); // onclose will be called
    };
  }

  function disconnectWebSocket() {
    if (socket) {
      socket.close(1000, "User disconnected"); // Normal closure
      socket = null;
      isConnected.value = false;
    }
  }

  // Expose state and actions
  return {
    currentMatch,
    isLoading,
    error,
    isConnected,
    matchDataForForm,
    fetchCurrentMatchState,
    updateMatch,
    connectWebSocket,
    disconnectWebSocket,
  };
});
