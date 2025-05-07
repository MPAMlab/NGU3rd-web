// src/stores/matchStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
// Import the new type
import type { MatchState, RoundArchive, MatchArchiveSummary, Team, Member, TournamentMatch, BulkTeamRow, BulkMemberRow, CreateTournamentMatchPayload, BulkTournamentMatchRow } from '@/types/match'; // Adjust path if needed

const API_BASE_URL = ''; // Assuming requests are to the same origin as the frontend

export const useMatchStore = defineStore('match', () => {
  // --- State for Current Match ---
  const currentMatch = ref<MatchState | null>(null);
  const isLoading = ref(false); // For fetching initial current match
  const error = ref<string | null>(null); // General error message
  const isConnected = ref(false); // WebSocket connection status

  // --- State for Archived Data ---
  const archivedRounds = ref<RoundArchive[]>([]);
  const isLoadingArchivedRounds = ref(false);

  const archivedMatches = ref<MatchArchiveSummary[]>([]);
  const isLoadingArchivedMatches = ref(false);

  const editingRound = ref<RoundArchive | null>(null); // State to hold the round being edited
  const isLoadingEditRound = ref(false); // Loading state for editing save action

  // --- State for Tournament Management ---
  const teams = ref<Team[]>([]);
  const isLoadingTeams = ref(false);
  const members = ref<Member[]>([]); // Store all members, filter by team_code in UI if needed
  const isLoadingMembers = ref(false);
  const tournamentMatches = ref<TournamentMatch[]>([]); // Note: This will hold flattened data from the join query
  const isLoadingTournamentMatches = ref(false);

  // --- General Action State ---
  const isLoadingAction = ref(false); // General loading for actions (archive/next/new/update/create team/create match etc.)
  const actionMessage = ref<string | null>(null); // Message after a successful action

  // --- Bulk Import State ---
  const isLoadingBulkImport = ref(false);
  const bulkImportError = ref<string | null>(null);
  const bulkImportMessage = ref<string | null>(null);


  let socket: WebSocket | null = null;
  let currentMatchDOId: string | null = null; // Store the DO ID the store is currently connected to
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;


  // Computed property to check if the current match DO instance is archived
  const isCurrentMatchArchived = computed(() => currentMatch.value?.status === 'archived_in_d1');


  // --- Actions for Current Match (Require matchDOId) ---

  // Modified to accept matchDOId
  async function fetchCurrentMatchState(matchDOId: string) {
    if (!matchDOId) {
        console.warn("fetchCurrentMatchState called without matchDOId");
        currentMatch.value = null; // Clear state if no ID
        archivedRounds.value = []; // Clear rounds
        return;
    }
    isLoading.value = true;
    error.value = null; // Clear general error on new fetch
    try {
      // Use the new API path with the specific DO ID
      const response = await fetch(`${API_BASE_URL}/api/live-match/${matchDOId}/state`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // If 404, maybe the DO doesn't exist or is truly gone
        if (response.status === 404) {
             currentMatch.value = null; // Clear state
             archivedRounds.value = []; // Clear rounds
             throw new Error(`比赛 (ID: ${matchDOId}) 未找到或已失效。`);
        }
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data: MatchState = await response.json();
      currentMatch.value = data;
      console.log('Fetched initial match state:', data);
      // After fetching current match, also fetch its archived rounds
      if (data && data.matchId) {
          fetchArchivedRounds(data.matchId); // Pass the DO ID
      } else {
          archivedRounds.value = []; // Clear rounds list - Use .value
      }
    } catch (e: any) {
      console.error('Error fetching match state:', e);
      error.value = `获取比赛状态失败: ${e.message}`;
      currentMatch.value = null; // Clear state on error
      archivedRounds.value = []; // Clear rounds on error
    } finally {
      isLoading.value = false;
    }
  }

  // Modified to accept matchDOId and only send allowed updates
  async function updateMatch(matchDOId: string, payload: Partial<Pick<MatchState, 'teamA_name' | 'teamA_score' | 'teamB_name' | 'teamB_score' | 'status'>>) {
     if (!matchDOId) {
         error.value = "无法更新比赛状态，缺少比赛ID。";
         return false;
     }
     if (currentMatch.value?.matchId !== matchDOId) {
          console.warn("updateMatch called for a different DO ID than the current state.");
          // Decide how to handle this - maybe fetch the correct state first?
          // For now, proceed with the update for the requested ID.
     }
     if (currentMatch.value?.status === 'archived_in_d1') { // Check status of the *current* loaded match
        error.value = "比赛已归档，无法更新。";
        return false; // Indicate failure
     }


    isLoadingAction.value = true; // Use action loading for updates too
    error.value = null; // Clear general error
    actionMessage.value = null; // Clear previous action message
    try {
      // Only send the fields that are allowed to be updated via this endpoint
      const updatePayload = {
          teamA_name: payload.teamA_name,
          teamA_score: payload.teamA_score,
          teamB_name: payload.teamB_name,
          teamB_score: payload.teamB_score,
          status: payload.status, // Status is allowed to be updated here (except to archived_in_d1)
      };
      // Note: round, teamA_player, teamB_player, member lists, player order, etc. are managed by the DO's internal logic.

      // Use the new API path with the specific DO ID
      const response = await fetch(`${API_BASE_URL}/api/live-match/${matchDOId}/update`, {
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

  // --- WebSocket Actions (Require matchDOId) ---
  // Modified to accept matchDOId
   function connectWebSocket(matchDOId: string) {
    if (!matchDOId) {
        console.warn("connectWebSocket called without matchDOId");
        disconnectWebSocket(); // Ensure any existing connection is closed
        return;
    }

    // If already connected to the *same* DO, do nothing
    if (socket && isConnected.value && currentMatchDOId === matchDOId) {
      console.log(`WebSocket already connected to ${matchDOId}.`);
      return;
    }

    // If connected to a *different* DO, disconnect first
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log(`Disconnecting from previous WebSocket (${currentMatchDOId}) to connect to ${matchDOId}.`);
        disconnectWebSocket();
    }

    currentMatchDOId = matchDOId; // Store the ID we are trying to connect to
    reconnectAttempts = 0; // Reset attempts for the new ID

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the new API path with the specific DO ID
    const wsUrl = `${wsProtocol}//${window.location.host}/api/live-match/${matchDOId}/websocket`;

    console.log(`Attempting to connect WebSocket to ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`WebSocket connected to ${matchDOId}`);
      isConnected.value = true;
      error.value = null; // Clear connection error on success
      reconnectAttempts = 0; // Reset attempts
      // Fetch state immediately after connecting to ensure we have the latest
      // This also handles the case where the DO might have state before WS connects
      fetchCurrentMatchState(matchDOId);
    };

    socket.onmessage = (event) => {
      try {
        const data: MatchState = JSON.parse(event.data as string);
        // Only update state if the message is for the current match DO ID
        if (data.matchId === currentMatchDOId) {
             currentMatch.value = data;
             console.log('Received state via WebSocket:', data);
             // If the match becomes archived via WS, refresh archived lists
             if (data.status === 'archived_in_d1') {
                  fetchArchivedMatches(); // Refresh the list of overall archived matches
                  // archivedRounds list is already tied to currentMatch via watch in component
                  // If this match was from a schedule, also refresh tournament matches list
                  if (data.tournamentMatchId) {
                      fetchTournamentMatches();
                  }
             }
             // If a new match starts (status changes from archived_in_d1 to pending/live/etc.)
             // the watch on currentMatch in the component will handle fetching new archived rounds.
        } else {
            console.warn(`Received WS message for unexpected DO ID: ${data.matchId}. Expected: ${currentMatchDOId}`);
        }

      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
        // Handle parsing error, maybe don't update state if invalid
      }
    };

    socket.onerror = (e) => {
      console.error(`WebSocket error for ${currentMatchDOId}:`, e);
      isConnected.value = false;
      // Error is often followed by close, handle reconnect in onclose
    };

    socket.onclose = (event) => {
      console.log(`WebSocket disconnected from ${currentMatchDOId}:`, event.reason, event.code);
      isConnected.value = false;
      // Attempt reconnect unless it was a normal closure (code 1000)
      // Only attempt reconnect if we still have a DO ID to connect to
      if (event.code !== 1000 && currentMatchDOId) {
        handleReconnect();
      } else {
         // If disconnected normally or no DO ID, clear state
         currentMatch.value = null;
         archivedRounds.value = [];
         currentMatchDOId = null; // Clear the stored ID
      }
    };
  }

  // Modified to disconnect the specific socket
  function disconnectWebSocket(matchDOId?: string) {
    // Only disconnect if the provided ID matches the current one, or if no ID is provided (force disconnect)
    if (socket && (matchDOId === undefined || currentMatchDOId === matchDOId) && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log(`Disconnecting WebSocket from ${currentMatchDOId || 'unknown DO'}`);
      socket.close(1000, "Client disconnecting"); // Normal closure
    }
    // Clear state regardless of whether a specific ID was provided or matched
    socket = null;
    isConnected.value = false;
    currentMatch.value = null; // Clear current match state
    archivedRounds.value = []; // Clear archived rounds for the old match
    currentMatchDOId = null; // Clear the stored ID
  }

  function handleReconnect() {
    // Only attempt reconnect if we still have a DO ID to connect to
    if (currentMatchDOId && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
      error.value = `WebSocket 连接已断开 (ID: ${currentMatchDOId})。将在 ${delay / 1000} 秒后尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;
      setTimeout(() => {
        // Check if a connection is still needed for the *same* ID and not already connecting/open
        if (currentMatchDOId && (!socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING))) {
             connectWebSocket(currentMatchDOId); // Attempt to reconnect to the stored ID
        }
      }, delay);
    } else if (currentMatchDOId) { // If attempts exhausted for a specific ID
      error.value = `无法连接到比赛服务器 (ID: ${currentMatchDOId})。请稍后刷新页面或联系管理员。`;
      currentMatch.value = null; // Clear state
      archivedRounds.value = []; // Clear rounds
      currentMatchDOId = null; // Clear the stored ID
    }
    // If currentMatchDOId is null, no reconnect is needed/attempted
  }


  // --- Actions for Round/Match Archiving and New Match (Require matchDOId) ---

  // Modified to accept matchDOId
  async function archiveCurrentRound(matchDOId: string) {
    if (!matchDOId) {
         error.value = "无法归档轮次，缺少比赛ID。";
         return false;
    }
     if (currentMatch.value?.status === 'archived_in_d1') { // Check status of the *current* loaded match
        error.value = "比赛已整体归档，无法归档轮次。";
        return false;
    }

    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      // Use the new API path with the specific DO ID
      const response = await fetch(`${API_BASE_URL}/api/live-match/${matchDOId}/internal/archive-round`, {
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
        // Refresh the list of archived rounds for this match
        fetchArchivedRounds(matchDOId); // Pass the DO ID
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

  // Modified to accept matchDOId
  async function nextRound(matchDOId: string) {
     if (!matchDOId) {
         error.value = "无法进入下一轮，缺少比赛ID。";
         return false;
    }
     if (currentMatch.value?.status === 'archived_in_d1') { // Check status of the *current* loaded match
        error.value = "比赛已整体归档，无法进入下一轮。";
        return false;
    }
     // Optional: Prevent advancing if status is 'finished' - depends on workflow
     // if (currentMatch.value?.status === 'finished') {
     //    error.value = "比赛已结束，请先归档整场比赛。";
     //    return false;
     // }

    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      // Use the new API path with the specific DO ID
      const response = await fetch(`${API_BASE_URL}/api/live-match/${matchDOId}/internal/next-round`, {
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
        // currentMatch will be updated by WebSocket, which triggers fetchArchivedRounds via watch in component
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

  // Modified to accept matchDOId
  async function archiveMatch(matchDOId: string) {
    if (!matchDOId) {
         error.value = "无法归档整场比赛，缺少比赛ID。";
         return false;
    }
    if (currentMatch.value?.status === 'archived_in_d1') { // Check status of the *current* loaded match
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
      // Use the new API path with the specific DO ID
      const response = await fetch(`${API_BASE_URL}/api/live-match/${matchDOId}/internal/archive-match`, {
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
        // archivedRounds list is already tied to currentMatch via watch in component
        // If this match was from a schedule, also refresh tournament matches list
        if (currentMatch.value?.tournamentMatchId) { // Use optional chaining as currentMatch might be null by now if WS updated fast
            fetchTournamentMatches();
        }
        // After archiving, disconnect the WebSocket as the match is no longer live
        disconnectWebSocket(matchDOId);
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

  // This action is now for starting an *unscheduled* new match (less common)
  // Keep this action if you still need the singleton unscheduled match feature
  // If not, you can remove it and the corresponding worker endpoint.
  // For now, let's keep it but clarify its purpose.
  async function newMatch() {
     // This action starts a new match on the *singleton* DO.
     // It's separate from starting a scheduled match.
     // If you only want scheduled matches, you can remove this.
     console.warn("Calling newMatch for the singleton DO. Consider removing this if only scheduled matches are needed.");

     if (currentMatch.value && !isCurrentMatchArchived.value) {
        error.value = "当前已有正在进行的比赛，请先归档。";
        return false;
    }
     if (!confirm("确定要开始一场新的非赛程比赛吗？此操作将清空当前比赛的实时状态。")) {
        return false; // User cancelled
    }

    isLoadingAction.value = true;
    error.value = null;
    actionMessage.value = null;
    try {
      // This still hits the singleton endpoint
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
        // The watch on currentMatch will clear archivedRounds
        fetchArchivedMatches(); // Refresh archived matches list in case the old one wasn't listed yet
        // The WebSocket connection should automatically reconnect to the singleton if it was disconnected
        // If you removed the singleton routes, this action should also be removed.
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


  // Modified to accept matchDoId in the URL path
  async function fetchArchivedRounds(matchDoId: string) {
    if (!matchDoId) {
        archivedRounds.value = []; // Clear if no match ID - Use .value
        return;
    }
    isLoadingArchivedRounds.value = true;
    // error.value = null; // Decide if fetching archived lists should clear general error
    try {
        // Use the new API path with the specific DO ID
        const response = await fetch(`${API_BASE_URL}/api/archived_rounds/${matchDoId}`);
        if (!response.ok) {
             // If 404, maybe no rounds are archived yet for this match
             if (response.status === 404) {
                 archivedRounds.value = []; // No rounds found
                 console.log(`No archived rounds found for DO ID: ${matchDoId}`);
                 return; // Success, but empty list
             }
            throw new Error(`HTTP error ${response.status}`);
        }
        archivedRounds.value = await response.json(); // Use .value
    } catch (e: any) {
        console.error(`Error fetching archived rounds for ${matchDoId}:`, e);
        // error.value = `获取归档轮次列表失败: ${e.message}`; // Decide if fetching archived lists should set general error
        archivedRounds.value = []; // Clear on error
    } finally {
        isLoadingArchivedRounds.value = false;
    }
  }

  async function fetchArchivedMatches() {
    isLoadingArchivedMatches.value = true;
    // error.value = null; // Decide if fetching lists clears general error
    try {
        // This endpoint lists *all* archived matches, so no DO ID is needed here
        const response = await fetch(`${API_BASE_URL}/api/archived_matches`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        archivedMatches.value = await response.json(); // Use .value
    } catch (e: any) {
        console.error("Error fetching archived matches:", e);
        // error.value = `获取归档比赛列表失败: ${e.message}`; // Decide if fetching archived lists should set general error
    } finally {
        isLoadingArchivedMatches.value = false;
    }
  }


  // --- Actions for Round Editing ---

  function startEditingRound(round: RoundArchive) {
      editingRound.value = { ...round }; // Create a copy to avoid modifying the list directly
      error.value = null; // Clear errors when starting edit
      actionMessage.value = null; // Clear action messages
  }

  function cancelEditingRound() {
      editingRound.value = null;
      error.value = null;
      actionMessage.value = null;
  }

  async function saveEditedRound(round: RoundArchive) {
      if (!round || round.id === undefined) {
          error.value = "无效的归档轮次数据。";
          return false;
      }

      isLoadingEditRound.value = true; // Use specific loading for edit save
      error.value = null; // Clear general error
      actionMessage.value = null; // Clear previous action message
      try {
          // This endpoint updates a specific round archive by its D1 ID
          const response = await fetch(`${API_BASE_URL}/api/archived_rounds/${round.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(round), // Send the edited data
          });

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: response.statusText }));
              throw new Error(errorData.message || `HTTP error ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
              actionMessage.value = data.message || '归档轮次更新成功！';
              cancelEditingRound(); // Close the edit form
              // Find and update the item in the archivedRounds list with the record returned by the server
              const index = archivedRounds.value.findIndex(r => r.id === round.id); // Use .value
              if (index !== -1 && data.updatedRecord) {
                  archivedRounds.value[index] = data.updatedRecord; // Use .value
              } else {
                  // If server didn't return updated record or item not found, refetch the list
                  // Need the current match DO ID to refetch rounds
                  if (currentMatch.value) {
                      fetchArchivedRounds(currentMatch.value.matchId);
                  } else {
                      // If no current match, maybe refetch all archived matches to see if summary changed?
                      fetchArchivedMatches();
                  }
              }
              return true;
          } else {
              throw new Error(data.message || '更新归档轮次失败，未知错误。');
          }

      } catch (e: any) {
          console.error('Error saving edited round:', e);
          error.value = `更新归档轮次失败: ${e.message}`;
          return false;
      } finally {
          isLoadingEditRound.value = false;
      }
  }

  // --- Tournament Management Actions (Keep as is) ---
  async function fetchTeams() {
    isLoadingTeams.value = true;
    try {
        const response = await fetch(`${API_BASE_URL}/api/teams`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const fetchedTeams = await response.json();
        teams.value = fetchedTeams;
        console.log('Fetched teams in store action:', JSON.parse(JSON.stringify(fetchedTeams))); // Log here
    } catch (e: any) {
        console.error("Error fetching teams:", e);
    } finally {
        isLoadingTeams.value = false;
    }
}

  async function createTeam(teamData: Omit<Team, 'id' | 'created_at' | 'current_health' | 'has_revive_mirror' | 'status'>) {
      isLoadingAction.value = true;
      error.value = null;
      actionMessage.value = null;
      try {
          const response = await fetch(`${API_BASE_URL}/api/teams`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(teamData),
          });
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: response.statusText }));
              throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
          }
          const data = await response.json();
          if (data.success) {
              actionMessage.value = data.message || '队伍创建成功！';
              fetchTeams(); // Refresh list
              return true;
          } else {
              throw new Error(data.message || '创建队伍失败，未知错误。');
          }
      } catch (e: any) {
          console.error('Error creating team:', e);
          error.value = `创建队伍失败: ${e.message}`;
          return false;
      } finally {
          isLoadingAction.value = false;
      }
  }

   async function updateTeam(teamId: number, updates: Partial<Omit<Team, 'id' | 'code' | 'created_at'>>) {
       isLoadingAction.value = true;
       error.value = null;
       actionMessage.value = null;
       try {
           const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(updates),
           });
           if (!response.ok) {
               const errorData = await response.json().catch(() => ({ message: response.statusText }));
               throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
           }
           const data = await response.json();
           if (data.success) {
               actionMessage.value = data.message || '队伍更新成功！';
               fetchTeams(); // Refresh list
               return true;
           } else {
               throw new Error(data.message || '更新队伍失败，未知错误。');
           }
       } catch (e: any) {
           console.error('Error updating team:', e);
           error.value = `更新队伍失败: ${e.message}`;
           return false;
       } finally {
           isLoadingAction.value = false;
       }
   }

    async function deleteTeam(teamId: number) {
        if (!confirm("确定要删除这支队伍吗？此操作不可逆。")) {
            return false;
        }
        isLoadingAction.value = true;
        error.value = null;
        actionMessage.value = null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                actionMessage.value = data.message || '队伍删除成功！';
                fetchTeams(); // Refresh list
                return true;
            } else {
                throw new Error(data.message || '删除队伍失败，未知错误。');
            }
        } catch (e: any) {
            console.error('Error deleting team:', e);
            error.value = `删除队伍失败: ${e.message}`;
            return false;
        } finally {
            isLoadingAction.value = false;
        }
    }

    // Bulk Import Teams
    async function bulkCreateTeams(teamsData: BulkTeamRow[]) {
        isLoadingBulkImport.value = true;
        bulkImportError.value = null;
        bulkImportMessage.value = null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamsData),
            });

            const data = await response.json();

            if (response.ok) { // Status 200 or 201
                 bulkImportMessage.value = data.message || '批量导入队伍成功！';
                 fetchTeams(); // Refresh list
                 return true;
            } else if (response.status === 207) { // Multi-Status
                 bulkImportMessage.value = data.message || '批量导入队伍部分成功。';
                 bulkImportError.value = data.errors ? `错误详情: ${JSON.stringify(data.errors)}` : '部分导入失败。';
                 fetchTeams(); // Refresh list to show successful imports
                 return false;
            }
            else { // Other error status
                throw new Error(data.error || data.message || `HTTP error ${response.status}`);
            }
        } catch (e: any) {
            console.error('Error bulk importing teams:', e);
            bulkImportError.value = `批量导入队伍失败: ${e.message}`;
            return false;
        } finally {
            isLoadingBulkImport.value = false;
        }
    }


    // Actions for Members
    async function fetchMembers() {
        isLoadingMembers.value = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/members`);
            if (!response.ok) {
                 throw new Error(`HTTP error ${response.status}`);
            }
            members.value = await response.json(); // Use .value
        } catch (e: any) {
            console.error("Error fetching members:", e);
        } finally {
            isLoadingMembers.value = false;
        }
    }

    async function fetchMembersByTeamCode(teamCode: string) {
         if (!teamCode) return [];
         // This action doesn't update the global members list, just fetches for a specific team
         // You might want a separate state property for members of the currently viewed team
         // For now, let's just return the data.
         try {
             const response = await fetch(`${API_BASE_URL}/api/teams/${teamCode}/members`);
             if (!response.ok) {
                  // Check if the error is 404 (team not found) or something else
                  if (response.status === 404) {
                       console.warn(`Team code ${teamCode} not found when fetching members.`);
                       return []; // Return empty array if team doesn't exist
                  }
                  throw new Error(`HTTP error ${response.status}`);
             }
             return await response.json() as Member[];
         } catch (e: any) {
             console.error(`Error fetching members for team ${teamCode}:`, e);
             // Handle error display in the component that calls this
             return [];
         }
    }

     // Add createMember, updateMember, deleteMember actions similarly...
     // Example createMember:
     async function createMember(memberData: Omit<Member, 'id' | 'joined_at' | 'updated_at'>) {
         isLoadingAction.value = true;
         error.value = null;
         actionMessage.value = null;
         try {
             const response = await fetch(`${API_BASE_URL}/api/members`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(memberData),
             });
             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: response.statusText }));
                 throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
             }
             const data = await response.json();
             if (data.success) {
                 actionMessage.value = data.message || '队员创建成功！';
                 // Decide if you refresh the global members list or just the team's list in the modal
                 // fetchMembers(); // Refresh global list
                 return true;
             } else {
                 throw new Error(data.message || '创建队员失败，未知错误。');
             }
         } catch (e: any) {
             console.error('Error creating member:', e);
             error.value = `创建队员失败: ${e.message}`;
             return false;
         } finally {
             isLoadingAction.value = false;
         }
     }

     // Example deleteMember:
     async function deleteMember(memberId: number) {
         if (!confirm("确定要删除这名队员吗？此操作不可逆。")) {
             return false;
         }
         isLoadingAction.value = true;
         error.value = null;
         actionMessage.value = null;
         try {
             const response = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
                 method: 'DELETE',
             });
             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: response.statusText }));
                 throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
             }
             const data = await response.json();
             if (data.success) {
                 actionMessage.value = data.message || '队员删除成功！';
                 // Decide if you refresh the global members list or just the team's list in the modal
                 // fetchMembers(); // Refresh global list
                 return true;
             } else {
                 throw new Error(data.message || '删除队员失败，未知错误。');
             }
         } catch (e: any) {
             console.error('Error deleting member:', e);
             error.value = `删除队员失败: ${e.message}`;
             return false;
         } finally {
             isLoadingAction.value = false;
         }
     }


    // Bulk Import Members
    async function bulkCreateMembers(membersData: BulkMemberRow[]) {
        isLoadingBulkImport.value = true;
        bulkImportError.value = null;
        bulkImportMessage.value = null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/members/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(membersData),
            });

            const data = await response.json();

            if (response.ok) { // Status 200 or 201
                 bulkImportMessage.value = data.message || '批量导入队员成功！';
                 fetchMembers(); // Refresh global list
                 // If you have a team members modal open, you'd need to refresh that too
                 return true;
            } else if (response.status === 207) { // Multi-Status
                 bulkImportMessage.value = data.message || '批量导入队员部分成功。';
                 bulkImportError.value = data.errors ? `错误详情: ${JSON.stringify(data.errors)}` : '部分导入失败。';
                 fetchMembers(); // Refresh global list to show successful imports
                 return false;
            }
            else { // Other error status
                throw new Error(data.error || data.message || `HTTP error ${response.status}`);
            }
        } catch (e: any) {
            console.error('Error bulk importing members:', e);
            bulkImportError.value = `批量导入队员失败: ${e.message}`;
            return false;
        } finally {
            isLoadingBulkImport.value = false;
        }
    }


  async function fetchTournamentMatches() {
      isLoadingTournamentMatches.value = true;
      // error.value = null; // Decide if fetching lists clears general error
      try {
          const response = await fetch(`${API_BASE_URL}/api/tournament_matches`);
          if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
          }
          tournamentMatches.value = await response.json(); // Use .value
      } catch (e: any) {
          console.error("Error fetching tournament matches:", e);
          // error.value = `获取赛程列表失败: ${e.message}`;
      } finally {
          isLoadingTournamentMatches.value = false;
      }
  }

  // Update the parameter type to the new interface
  async function createTournamentMatch(matchData: CreateTournamentMatchPayload) {
       isLoadingAction.value = true;
       error.value = null;
       actionMessage.value = null;
       try {
           // Perform runtime check here before sending to API
           if (matchData.team1_id === null || matchData.team2_id === null) {
               // This should ideally be caught by client-side validation before calling the store
               // But as a safeguard, throw an error or return false
               console.error("Attempted to create match with null team IDs");
               error.value = "队伍ID不能为空。"; // Set error message
               return false; // Indicate failure
           }

           const response = await fetch(`${API_BASE_URL}/api/tournament_matches`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               // Cast the payload to the expected API type (which is TournamentMatch without some fields)
               // We know team1_id and team2_id are not null here due to the check above
               body: JSON.stringify(matchData as Omit<TournamentMatch, 'id' | 'match_do_id' | 'status' | 'winner_team_id' | 'created_at' | 'team1_code' | 'team1_name' | 'team2_code' | 'team2_name' | 'winner_team_code' | 'winner_team_name'>),
           });
           if (!response.ok) {
               const errorData = await response.json().catch(() => ({ message: response.statusText }));
               throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
           }
           const data = await response.json();
           if (data.success) {
               actionMessage.value = data.message || '赛程创建成功！';
               fetchTournamentMatches(); // Refresh list
               return true;
           } else {
               throw new Error(data.message || '创建赛程失败，未知错误。');
           }
       } catch (e: any) {
           console.error('Error creating tournament match:', e);
           error.value = `创建赛程失败: ${e.message}`;
           return false;
       } finally {
           isLoadingAction.value = false;
       }
   }

   // Add updateTournamentMatch action similarly...
    // Example deleteTournamentMatch:
    async function deleteTournamentMatch(tournamentMatchId: number) {
        if (!confirm("确定要删除这场赛程比赛吗？此操作不可逆。")) {
            return false;
        }
        isLoadingAction.value = true;
        error.value = null;
        actionMessage.value = null;
        try {
            const response = await fetch(`${API_BASE_URL}/api/tournament_matches/${tournamentMatchId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                actionMessage.value = data.message || '赛程删除成功！';
                fetchTournamentMatches(); // Refresh list
                return true;
            } else {
                throw new Error(data.message || '删除赛程失败，未知错误。');
            }
        } catch (e: any) {
            console.error('Error deleting tournament match:', e);
            error.value = `删除赛程失败: ${e.message}`;
            return false;
        } finally {
            isLoadingAction.value = false;
        }
    }

    // Update the parameter type to the new interface array
    async function bulkCreateTournamentMatches(matchesData: CreateTournamentMatchPayload[]) {
        isLoadingBulkImport.value = true;
        bulkImportError.value = null;
        bulkImportMessage.value = null;
        try {
             // Perform runtime check for null IDs in the array before sending
             const invalidMatches = matchesData.filter(m => m.team1_id === null || m.team2_id === null);
             if (invalidMatches.length > 0) {
                  console.error("Attempted bulk create with null team IDs:", invalidMatches);
                  bulkImportError.value = "批量导入数据中包含队伍ID为空的赛程。";
                  return false;
             }


            const response = await fetch(`${API_BASE_URL}/api/tournament_matches/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                 // Cast the payload array to the expected API type array
                body: JSON.stringify(matchesData as Omit<TournamentMatch, 'id' | 'match_do_id' | 'status' | 'winner_team_id' | 'created_at' | 'team1_code' | 'team1_name' | 'team2_code' | 'team2_name' | 'winner_team_code' | 'winner_team_name'>[]),
            });

            const data = await response.json();

            if (response.ok) { // Status 200 or 201
                 bulkImportMessage.value = data.message || '批量导入赛程成功！';
                 fetchTournamentMatches(); // Refresh list
                 return true;
            } else if (response.status === 207) { // Multi-Status
                 bulkImportMessage.value = data.message || '批量导入赛程部分成功。';
                 bulkImportError.value = data.errors ? `错误详情: ${JSON.stringify(data.errors)}` : '部分导入失败。';
                 fetchTournamentMatches(); // Refresh list to show successful imports
                 return false;
            }
            else { // Other error status
                throw new Error(data.error || data.message || `HTTP error ${response.status}`);
            }
        } catch (e: any) {
            console.error('Error bulk importing tournament matches:', e);
            bulkImportError.value = `批量导入赛程失败: ${e.message}`;
            return false;
        } finally {
            isLoadingBulkImport.value = false;
        }
    }


   // Action to start a live match from a scheduled tournament match
   // This action is called from ScheduleManagement.vue
   async function startScheduledMatch(tournamentMatchId: number) {
       // Check if the singleton DO is currently active (if singleton routes are still enabled)
       // Or check if *any* DO is currently connected/managed by the store (less reliable)
       // A better check might be to query the tournament_matches table for any match with status 'live'
       // For simplicity now, let's just check if currentMatch is loaded and not archived
       if (currentMatch.value && !isCurrentMatchArchived.value) {
           error.value = "当前已有正在进行的比赛，请先归档。";
           return { success: false, matchDOId: null, error: error.value }; // Return failure with error
       }
        if (!confirm("确定要开始这场赛程比赛吗？此操作将清空当前实时比赛状态并加载赛程信息。")) {
           return { success: false, matchDOId: null, error: "用户取消操作。" }; // Return failure
       }

       isLoadingAction.value = true;
       error.value = null;
       actionMessage.value = null;
       try {
           const response = await fetch(`${API_BASE_URL}/api/tournament_matches/${tournamentMatchId}/start_live`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
           });
           if (!response.ok) {
               const errorData = await response.json().catch(() => ({ message: response.statusText }));
               throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
           }
           const data = await response.json();
           if (data.success) {
               actionMessage.value = data.message || '已成功从赛程启动比赛！';
               fetchTournamentMatches(); // Refresh tournament matches list to show status change
               // The worker returns the new matchDOId
               return { success: true, matchDOId: data.matchDOId, tournamentMatchId: data.tournamentMatchId }; // Return success with the new DO ID
           } else {
               throw new Error(data.message || '从赛程启动比赛失败，未知错误。');
           }
       } catch (e: any) {
           console.error('Error starting scheduled match:', e);
           error.value = `从赛程启动比赛失败: ${e.message}`;
           return { success: false, matchDOId: null, error: error.value }; // Return failure with error
       } finally {
           isLoadingAction.value = false;
       }
   }


  return {
    // --- State & Computed ---
    currentMatch,
    isLoading,
    error,
    isConnected,
    archivedRounds, // Return the ref itself
    isLoadingArchivedRounds,
    archivedMatches, // Return the ref itself
    isLoadingArchivedMatches,
    editingRound,
    isLoadingEditRound,
    isCurrentMatchArchived,

    teams, // Return the ref itself
    isLoadingTeams,
    members, // Return the ref itself
    isLoadingMembers,
    tournamentMatches, // Return the ref itself
    isLoadingTournamentMatches,

    isLoadingAction,
    actionMessage,

    isLoadingBulkImport, // Expose bulk import state
    bulkImportError,
    bulkImportMessage,


    // --- Actions (Modified to accept matchDOId where applicable) ---
    fetchCurrentMatchState, // Needs matchDOId
    updateMatch, // Needs matchDOId
    connectWebSocket, // Needs matchDOId
    disconnectWebSocket, // Can take optional matchDOId

    archiveCurrentRound, // Needs matchDOId
    nextRound, // Needs matchDOId
    archiveMatch, // Needs matchDOId
    newMatch, // (Optional) For singleton unscheduled match

    fetchArchivedRounds, // Needs matchDOId
    fetchArchivedMatches, // Global list, no matchDOId needed

    startEditingRound,
    cancelEditingRound,
    saveEditedRound, // Uses round.id internally

    // Tournament Management Actions (No matchDOId needed)
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    bulkCreateTeams,

    fetchMembers,
    fetchMembersByTeamCode,
    createMember,
    deleteMember,
    bulkCreateMembers,

    fetchTournamentMatches,
    createTournamentMatch,
    deleteTournamentMatch,
    bulkCreateTournamentMatches,

    startScheduledMatch, // Called from ScheduleManagement, returns matchDOId
  };
});
