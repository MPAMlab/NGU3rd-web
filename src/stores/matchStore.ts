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
  // Corrected declarations: remove .value here
  const archivedRounds = ref<RoundArchive[]>([]);
  const isLoadingArchivedRounds = ref(false);

  // Corrected declarations: remove .value here
  const archivedMatches = ref<MatchArchiveSummary[]>([]);
  const isLoadingArchivedMatches = ref(false);

  const editingRound = ref<RoundArchive | null>(null); // State to hold the round being edited
  const isLoadingEditRound = ref(false); // Loading state for editing save action

  // --- State for Tournament Management ---
  // Corrected declarations: remove .value here
  const teams = ref<Team[]>([]);
  const isLoadingTeams = ref(false);
  // Corrected declarations: remove .value here
  const members = ref<Member[]>([]); // Store all members, filter by team_code in UI if needed
  const isLoadingMembers = ref(false);
  // Corrected declarations: remove .value here
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
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5; // Corrected spelling


  // Computed property to check if the current match DO instance is archived
  const isCurrentMatchArchived = computed(() => currentMatch.value?.status === 'archived_in_d1');


  // --- Actions for Current Match ---

  async function fetchCurrentMatchState() {
    isLoading.value = true;
    error.value = null; // Clear general error on new fetch
    try {
      const response = await fetch(`${API_BASE_URL}/api/match/state`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data: MatchState = await response.json();
      currentMatch.value = data;
      console.log('Fetched initial match state:', data);
      // After fetching current match, also fetch its archived rounds
      if (data && data.matchId) {
          fetchArchivedRounds(data.matchId);
      } else {
          archivedRounds.value = []; // Clear rounds if no current match data - Use .value
      }
    } catch (e: any) {
      console.error('Error fetching match state:', e);
      error.value = `获取比赛状态失败: ${e.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  // Corrected updateMatch function
  async function updateMatch(payload: Partial<Omit<MatchState, 'matchId' | 'tournamentMatchId' | 'round' | 'teamA_members' | 'teamB_members' | 'teamA_player_order_ids' | 'teamB_player_order_ids' | 'current_player_index_a' | 'current_player_index_b' | 'teamA_player' | 'teamB_player'>>) {
     if (!currentMatch.value) {
         error.value = "没有当前比赛数据可更新。";
         return false;
     }
     if (isCurrentMatchArchived.value) {
        error.value = "比赛已归档，无法更新。";
        return false; // Indicate failure
     }


    isLoadingAction.value = true; // Use action loading for updates too
    error.value = null; // Clear general error
    actionMessage.value = null; // Clear previous action message
    try {
      // Prevent updating core fields via this endpoint
      const updatePayload = { ...payload };
      // The following properties are already excluded by the Omit type in the function signature,
      // so attempting to delete them here is a type error. Remove these lines.
      // delete updatePayload.round; // REMOVED
      // delete updatePayload.teamA_player; // REMOVED
      // delete updatePayload.teamB_player; // REMOVED

      // Status changes via specific actions (archive, new-match), so prevent updating it here.
      // This property *is* allowed by the Omit type, so deleting it is correct.
      delete updatePayload.status; // KEEP THIS LINE


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
             fetchArchivedMatches(); // Refresh the list of overall archived matches
             // archivedRounds list is already tied to currentMatch via watch
             // If this match was from a schedule, also refresh tournament matches list
             if (data.tournamentMatchId) {
                 fetchTournamentMatches();
             }
        }
        // If a new match starts (status changes from archived_in_d1 to pending/live/etc.)
        // the watch on currentMatch will handle fetching new archived rounds.

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
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) { // Corrected spelling
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


  // --- Actions for Round/Match Archiving and New Match ---

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
        // Refresh the list of archived rounds for this match
        if (currentMatch.value) { // Ensure currentMatch is not null before fetching rounds
             fetchArchivedRounds(currentMatch.value.matchId);
        }
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
     // Optional: Prevent advancing if status is 'finished' - depends on workflow
     // if (currentMatch.value.status === 'finished') {
     //    error.value = "比赛已结束，请先归档整场比赛。";
     //    return false;
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
        // currentMatch will be updated by WebSocket, which triggers fetchArchivedRounds via watch
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
        // archivedRounds list is already tied to currentMatch via watch
        // If this match was from a schedule, also refresh tournament matches list
        if (currentMatch.value?.tournamentMatchId) { // Use optional chaining as currentMatch might be null by now if WS updated fast
            fetchTournamentMatches();
        }
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
  async function newMatch() {
     if (!currentMatch.value) {
         console.log("No current match data found, attempting to start a new unscheduled one.");
     } else if (!isCurrentMatchArchived.value) {
        error.value = "当前比赛必须先归档才能开始新比赛。";
        return false;
    }
     if (!confirm("确定要开始一场新的非赛程比赛吗？此操作将清空当前比赛的实时状态。")) {
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
        // The watch on currentMatch will clear archivedRounds
        fetchArchivedMatches(); // Refresh archived matches list in case the old one wasn't listed yet
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
        archivedRounds.value = []; // Clear if no match ID - Use .value
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
        archivedRounds.value = await response.json(); // Use .value
    } catch (e: any) {
        console.error("Error fetching archived rounds:", e);
        // error.value = `获取归档轮次列表失败: ${e.message}`; // Decide if fetching archived lists should set general error
    } finally {
        isLoadingArchivedRounds.value = false;
    }
  }

  async function fetchArchivedMatches() {
    isLoadingArchivedMatches.value = true;
    // error.value = null; // Decide if fetching lists clears general error
    try {
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
                  if (currentMatch.value) {
                      fetchArchivedRounds(currentMatch.value.matchId);
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

  // --- New Actions for Tournament Management ---

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
   async function startScheduledMatch(tournamentMatchId: number) {
       if (currentMatch.value && !isCurrentMatchArchived.value) {
           error.value = "当前已有正在进行的比赛，请先归档。";
           return false;
       }
        if (!confirm("确定要开始这场赛程比赛吗？此操作将清空当前实时比赛状态并加载赛程信息。")) {
           return false; // User cancelled
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
               // currentMatch will be updated by WebSocket
               fetchTournamentMatches(); // Refresh tournament matches list to show status change
               return true;
           } else {
               throw new Error(data.message || '从赛程启动比赛失败，未知错误。');
           }
       } catch (e: any) {
           console.error('Error starting scheduled match:', e);
           error.value = `从赛程启动比赛失败: ${e.message}`;
           return false;
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


    // --- Actions ---
    fetchCurrentMatchState,
    updateMatch,
    connectWebSocket,
    disconnectWebSocket,

    archiveCurrentRound,
    nextRound,
    archiveMatch,
    newMatch, // Keep for unscheduled matches if needed

    fetchArchivedRounds,
    fetchArchivedMatches,

    startEditingRound,
    cancelEditingRound,
    saveEditedRound,

    // New Tournament Management Actions
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    bulkCreateTeams, // Added bulk import action

    fetchMembers,
    fetchMembersByTeamCode, // Added action to fetch members for a specific team
    createMember, // Added
    deleteMember, // Added
    // updateMember, // Implement update member if needed
    bulkCreateMembers, // Added bulk import action

    fetchTournamentMatches,
    createTournamentMatch, // Updated signature
    // updateTournamentMatch, // Implement this
    deleteTournamentMatch,
    bulkCreateTournamentMatches, // Updated signature

    startScheduledMatch, // New action to start from schedule
  };
});
