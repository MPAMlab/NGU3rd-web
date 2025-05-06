// src/stores/matchStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MatchState, ArchivedMatchSummary } from '@/types/match'; // Adjust path if needed

const API_BASE_URL = ''; // Assuming requests are to the same origin as the frontend

export const useMatchStore = defineStore('match', () => {
  const currentMatch = ref<MatchState | null>(null);
  const isLoading = ref(false); // For fetching/updating current match
  const error = ref<string | null>(null);
  const isConnected = ref(false); // WebSocket connection status

  const archivedMatches = ref<ArchivedMatchSummary[]>([]);
  const isLoadingArchivedList = ref(false);
  const isLoadingArchive = ref(false); // For the archive action

  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  const isCurrentMatchArchived = computed(() => currentMatch.value?.status === 'archived_in_d1');


  // --- Actions for Current Match ---

  async function fetchCurrentMatchState() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/state`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data: MatchState = await response.json();
      currentMatch.value = data;
    } catch (e: any) {
      console.error('Error fetching match state:', e);
      error.value = `获取比赛状态失败: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateMatch(payload: Omit<MatchState, 'matchId'>) {
     if (isCurrentMatchArchived.value) {
        error.value = "比赛已归档，无法更新。";
        return false; // Indicate failure
     }

    isLoading.value = true;
    error.value = null;
    try {
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
        // State will be updated by WebSocket, no need to set currentMatch here
        // currentMatch.value = data.data; // If not using WS, uncomment this
        return true; // Indicate success
      } else {
        throw new Error(data.error || '更新失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error updating match state:', e);
      error.value = `更新比赛状态失败: ${e.message}`;
      return false; // Indicate failure
    } finally {
      isLoading.value = false;
    }
  }

  // --- WebSocket Actions ---

  function connectWebSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting.');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/match/websocket`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnected.value = true;
      error.value = null; // Clear connection error on success
      reconnectAttempts = 0; // Reset attempts
    };

    socket.onmessage = (event) => {
      try {
        const data: MatchState = JSON.parse(event.data as string);
        currentMatch.value = data;
        console.log('Received state via WebSocket:', data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        // Handle parsing error, maybe don't update state if invalid
      }
    };

    socket.onerror = (e) => {
      console.error('WebSocket error:', e);
      isConnected.value = false;
      // Error is often followed by close, handle reconnect in onclose
    };

    socket.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason, event.code);
      isConnected.value = false;
      // Attempt reconnect unless it was a normal closure (code 1000)
      if (event.code !== 1000) {
        handleReconnect();
      }
    };
  }

  function disconnectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "Client disconnecting"); // Normal closure
    }
    socket = null;
    isConnected.value = false;
  }

  function handleReconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
      error.value = `WebSocket 连接已断开。将在 ${delay / 1000} 秒后尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
      setTimeout(() => {
        // Check if a connection is still needed and not already connecting/open
        if (!socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) {
             connectWebSocket();
        }
      }, delay);
    } else {
      error.value = '无法连接到比赛服务器。请稍后刷新页面或联系管理员。';
    }
  }


  // --- Actions for Archiving ---

  async function archiveCurrentMatch() {
    if (isCurrentMatchArchived.value) {
        error.value = "比赛已经归档。";
        return false;
    }
    if (!currentMatch.value) {
         error.value = "没有当前比赛数据可归档。";
         return false;
    }

    isLoadingArchive.value = true;
    error.value = null; // Clear general error, use specific archive error if needed
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({}), // Optional: send a body if your DO expects one
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // The WebSocket should update currentMatch.value to status 'archived_in_d1'
        // Optionally, refetch current state or archived list immediately
        // fetchCurrentMatchState(); // WS should handle this
        fetchArchivedMatches(); // Refresh the list of archived matches
        return true; // Indicate success
      } else {
        throw new Error(data.message || '归档失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error archiving match:', e);
      error.value = `归档比赛失败: ${e.message}`; // Use general error for simplicity
      return false; // Indicate failure
    } finally {
      isLoadingArchive.value = false;
    }
  }

  async function fetchArchivedMatches() {
    isLoadingArchivedList.value = true;
    error.value = null; // Clear general error
    try {
        const response = await fetch(`${API_BASE_URL}/api/archived_matches`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        archivedMatches.value = await response.json();
    } catch (e: any) {
        console.error("Error fetching archived matches:", e);
        error.value = `获取归档列表失败: ${e.message}`; // Use general error
    } finally {
        isLoadingArchivedList.value = false;
    }
  }


  return {
    currentMatch,
    isLoading,
    error,
    isConnected,
    archivedMatches,
    isLoadingArchivedList,
    isLoadingArchive,
    isCurrentMatchArchived, // Expose computed property

    fetchCurrentMatchState,
    updateMatch,
    connectWebSocket,
    disconnectWebSocket,
    archiveCurrentMatch,
    fetchArchivedMatches,
  };
});
