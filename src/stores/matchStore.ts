// src/stores/matchStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MatchState, RoundArchive, MatchArchiveSummary } from '@/types/match'; // Adjust path if needed

const API_BASE_URL = ''; // Assuming requests are to the same origin as the frontend

export const useMatchStore = defineStore('match', () => {
  const currentMatch = ref<MatchState | null>(null);
  const isLoading = ref(false); // For fetching/updating current match
  const error = ref<string | null>(null);
  const isConnected = ref(false); // WebSocket connection status

  const archivedRounds = ref<RoundArchive[]>([]);
  const isLoadingArchivedRounds = ref(false);

  const archivedMatches = ref<MatchArchiveSummary[]>([]);
  const isLoadingArchivedMatches = ref(false);

  const isLoadingAction = ref(false); // General loading for actions (archive/next/new)
  const actionMessage = ref<string | null>(null); // Message after an action

  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Computed property to check if the current match DO instance is archived
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
      // After fetching current match, also fetch its archived rounds
      if (data && data.matchId) {
          fetchArchivedRounds(data.matchId);
      }
    } catch (e: any) {
      console.error('Error fetching match state:', e);
      error.value = `获取比赛状态失败: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateMatch(payload: Partial<Omit<MatchState, 'matchId'>>) {
     if (isCurrentMatchArchived.value) {
        error.value = "比赛已归档，无法更新。";
        return false; // Indicate failure
     }
     if (!currentMatch.value) {
         error.value = "没有当前比赛数据可更新。";
         return false;
     }

    isLoadingAction.value = true; // Use action loading for updates too
    error.value = null;
    actionMessage.value = null;
    try {
      // Prevent updating round or status to archived_in_d1 via this endpoint
      const updatePayload = { ...payload };
      if (updatePayload.round !== undefined && updatePayload.round !== currentMatch.value.round) {
           // Disallow changing round directly via update
           delete updatePayload.round;
      }
       if (updatePayload.status === 'archived_in_d1') {
           delete updatePayload.status; // Status to archived_in_d1 only via archiveMatch
       }


      const response = await fetch(`${API_BASE_URL}/api/match/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // State will be updated by WebSocket
        actionMessage.value = '比赛信息更新成功!';
        return true; // Indicate success
      } else {
        throw new Error(data.error || '更新失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error updating match state:', e);
      error.value = `更新比赛状态失败: ${e.message}`;
      return false; // Indicate failure
    } finally {
      isLoadingAction.value = false;
    }
  }

  // --- WebSocket Actions ---
  // (Keep the existing WebSocket logic as is)
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
        // If the match becomes archived via WS, refresh archived lists
        if (data.status === 'archived_in_d1') {
             fetchArchivedMatches();
             // fetchArchivedRounds(data.matchId); // Rounds are already fetched for the current match
        }
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


  // --- New Actions for Round/Match Archiving and New Match ---

  async function archiveCurrentRound() {
    if (!currentMatch.value) {
         error.value = "没有当前比赛数据可归档轮次。";
         return false;
    }
     if (isCurrentMatchArchived.value) {
        error.value = "比赛已整体归档，无法归档轮次。";
        return false;
    }

    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/archive-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        actionMessage.value = data.message || '当前轮次归档成功！';
        fetchArchivedRounds(currentMatch.value.matchId); // Refresh the list of archived rounds for this match
        return true;
      } else {
        throw new Error(data.message || '归档轮次失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error archiving round:', e);
      error.value = `归档当前轮次失败: ${e.message}`;
      return false;
    } finally {
      isLoadingAction.value = false;
    }
  }

  async function nextRound() {
     if (!currentMatch.value) {
         error.value = "没有当前比赛数据可进入下一轮。";
         return false;
    }
     if (isCurrentMatchArchived.value) {
        error.value = "比赛已整体归档，无法进入下一轮。";
        return false;
    }
     if (currentMatch.value.status === 'finished') {
        // Optional: Prevent advancing if status is 'finished'
        // error.value = "比赛已结束，请先归档整场比赛。";
        // return false;
        // Or allow advancing after 'finished' to start a new round
     }


    // Optional: Auto-archive current round before advancing
    // const archiveResult = await archiveCurrentRound();
    // if (!archiveResult.success) {
    //      console.warn("Failed to auto-archive current round before advancing:", archiveResult.message);
    //      // Decide if you want to stop here or proceed anyway
    //      // error.value = "自动归档当前轮次失败，无法进入下一轮。";
    //      // return false;
    // }


    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        actionMessage.value = data.message || '已进入下一轮！';
        // currentMatch will be updated by WebSocket
        // fetchArchivedRounds(currentMatch.value.matchId); // Rounds are fetched when currentMatch updates
        return true;
      } else {
        throw new Error(data.message || '进入下一轮失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error advancing round:', e);
      error.value = `进入下一轮失败: ${e.message}`;
      return false;
    } finally {
      isLoadingAction.value = false;
    }
  }


  async function archiveMatch() {
    if (!currentMatch.value) {
         error.value = "没有当前比赛数据可归档整场比赛。";
         return false;
    }
    if (isCurrentMatchArchived.value) {
        actionMessage.value = "比赛已经归档。"; // Use action message for non-error feedback
        return true; // Consider it a success if it's already archived
    }
     if (!confirm("确定要结束并归档当前比赛吗？此操作会将当前比赛最终数据存入数据库，并标记比赛为结束。")) {
        return false; // User cancelled
    }


    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/archive-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        actionMessage.value = data.message || `比赛归档成功！记录 ID: ${data.d1RecordId}`;
        // currentMatch status will be updated by WebSocket to 'archived_in_d1'
        fetchArchivedMatches(); // Refresh the list of archived matches
        // fetchArchivedRounds(currentMatch.value.matchId); // Rounds are already fetched
        return true;
      } else {
        throw new Error(data.message || '归档整场比赛失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error archiving match:', e);
      error.value = `归档整场比赛失败: ${e.message}`;
      return false;
    } finally {
      isLoadingAction.value = false;
    }
  }

  async function newMatch() {
     if (!currentMatch.value) {
         error.value = "没有当前比赛数据可开始新比赛。";
         return false;
    }
     if (!isCurrentMatchArchived.value) {
        error.value = "当前比赛必须先归档才能开始新比赛。";
        return false;
    }
     if (!confirm("确定要开始一场新比赛吗？此操作将清空当前比赛的实时状态。")) {
        return false; // User cancelled
    }

    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/new-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        actionMessage.value = data.message || '已成功开始新比赛！';
        // currentMatch will be reset by WebSocket
        archivedRounds.value = []; // Clear archived rounds list as it's for the previous match
        // archivedMatches list is separate
        return true;
      } else {
        throw new Error(data.message || '开始新比赛失败，未知错误。');
      }
    } catch (e: any) {
      console.error('Error starting new match:', e);
      error.value = `开始新比赛失败: ${e.message}`;
      return false;
    } finally {
      isLoadingAction.value = false;
    }
  }


  async function fetchArchivedRounds(matchDoId: string) {
    if (!matchDoId) {
        archivedRounds.value = []; // Clear if no match ID
        return;
    }
    isLoadingArchivedRounds.value = true;
    // error.value = null; // Decide if fetching archived lists should clear general error
    try {
        // Note: The worker currently fetches rounds for the *singleton* DO ID.
        // If you implement unique DO IDs per match, you'd need to pass the ID here
        // and modify the worker endpoint /api/archived_rounds/:match_do_id
        const response = await fetch(`${API_BASE_URL}/api/archived_rounds`); // Worker fetches for singleton ID
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        archivedRounds.value = await response.json();
    } catch (e: any) {
        console.error("Error fetching archived rounds:", e);
        // error.value = `获取归档轮次列表失败: ${e.message}`; // Decide if fetching archived lists should set general error
    } finally {
        isLoadingArchivedRounds.value = false;
    }
  }

  async function fetchArchivedMatches() {
    isLoadingArchivedMatches.value = true;
    // error.value = null; // Decide if fetching archived lists should clear general error
    try {
        const response = await fetch(`${API_BASE_URL}/api/archived_matches`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        archivedMatches.value = await response.json();
    } catch (e: any) {
        console.error("Error fetching archived matches:", e);
        // error.value = `获取归档比赛列表失败: ${e.message}`; // Decide if fetching archived lists should set general error
    } finally {
        isLoadingArchivedMatches.value = false;
    }
  }


  return {
    currentMatch,
    isLoading, // For initial fetch
    error, // General error
    isConnected,
    archivedRounds,
    isLoadingArchivedRounds,
    archivedMatches,
    isLoadingArchivedMatches,
    isLoadingAction, // For specific actions
    actionMessage, // Message after action success

    isCurrentMatchArchived, // Computed property

    fetchCurrentMatchState,
    updateMatch,
    connectWebSocket,
    disconnectWebSocket,

    archiveCurrentRound,
    nextRound,
    archiveMatch,
    newMatch,

    fetchArchivedRounds, // Exposed for potential manual refresh
    fetchArchivedMatches, // Exposed for potential manual refresh
  };
});
