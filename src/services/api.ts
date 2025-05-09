// src/services/api.ts
import type {
    ApiResponse,
    Team,
    Member,
    TournamentMatch,
    MatchState,
    CalculateRoundPayload,
    ResolveDrawPayload,
    Song,
    MatchSong // ADDED MatchSong import
  } from '@/types';
  
  const API_BASE_URL = '/api'; // Adjust if your Worker API is hosted elsewhere
  
  async function callApi<T>(endpoint: string, method: string = 'GET', data?: any): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header here when Kinde is integrated
        // 'Authorization': `Bearer ${getAuthToken()}`, // Placeholder
      },
    };
  
    if (data) {
      options.body = JSON.stringify(data);
    }
  
    try {
      const response = await fetch(url, options);
      const result: ApiResponse<T> = await response.json();
  
      if (!response.ok || !result.success) {
        console.error(`API Error: ${method} ${url}`, result.error || response.statusText);
        // Handle specific error statuses (e.g., 401 Unauthorized)
        // if (response.status === 401) {
        //   // Redirect to login or refresh token
        // }
        throw new Error(result.error || `API request failed with status ${response.status}`);
      }
  
      return result;
  
    } catch (error: any) {
      console.error(`API Fetch Error: ${method} ${url}`, error);
      // Provide a user-friendly error message
      throw new Error(`网络请求失败: ${error.message || '未知错误'}`);
    }
  }
  
  // --- Teams API ---
  export const fetchTeams = (): Promise<ApiResponse<Team[]>> => {
    // TODO: Implement actual API call
     console.warn("API: fetchTeams not implemented, using mock data.");
     const mockTeams: Team[] = [
      { id: 'team-a', name: '音游大师队', color: 'blue', logoUrl: 'https://via.placeholder.com/50/3b82f6/ffffff?text=A' },
      { id: 'team-b', name: '节奏猎人队', color: 'red', logoUrl: 'https://via.placeholder.com/50/ef4444/ffffff?text=B' },
      { id: 'team-c', name: '星光舞者队', color: 'purple', logoUrl: 'https://via.placeholder.com/50/8b5cf6/ffffff?text=C' },
      { id: 'team-d', name: '旋律掌控者队', color: 'green', logoUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=D' },
     ];
     return Promise.resolve({ success: true, data: mockTeams });
    // return callApi<Team[]>('/teams');
  };
  
  export const createTeam = (teamData: Partial<Team>): Promise<ApiResponse<Team>> => {
    // TODO: Implement actual API call
     console.warn("API: createTeam not implemented, using mock data.");
     const mockTeam: Team = { id: `team-${Date.now()}`, name: teamData.name || '新队伍', color: teamData.color || 'gray' };
     return Promise.resolve({ success: true, data: mockTeam });
    // return callApi<Team>('/teams', 'POST', teamData);
  };
  
  export const updateTeam = (teamId: string, teamData: Partial<Team>): Promise<ApiResponse<Team>> => {
    // TODO: Implement actual API call
     console.warn("API: updateTeam not implemented, using mock data.");
     const mockTeam: Team = { id: teamId, name: teamData.name || '更新队伍', color: teamData.color || 'gray' };
     return Promise.resolve({ success: true, data: mockTeam });
    // return callApi<Team>(`/teams/${teamId}`, 'PUT', teamData);
  };
  
  export const deleteTeam = (teamId: string): Promise<ApiResponse<void>> => {
    // TODO: Implement actual API call
     console.warn("API: deleteTeam not implemented, using mock data.");
     return Promise.resolve({ success: true });
    // return callApi<void>(`/teams/${teamId}`, 'DELETE');
  };
  
  // --- Members API ---
  export const fetchMembers = (): Promise<ApiResponse<Member[]>> => {
    // TODO: Implement actual API call
     console.warn("API: fetchMembers not implemented, using mock data.");
     const mockMembers: Member[] = [
          {id: 'pa1', nickname: '李小明', teamId: 'team-a', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1160&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', element: 'fire', profession: '绝剑士'},
          {id: 'pa2', nickname: '王小红', teamId: 'team-a', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', element: 'wood', profession: '矩盾手'},
          {id: 'pa3', nickname: '张小强', teamId: 'team-a', avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', element: 'water', profession: '炼星师'},
          {id: 'pb1', nickname: '陈一鸣', teamId: 'team-b', avatarUrl: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWFuJTIwYXNpYW58ZW58MHx8MHx8fDA%3D', element: 'water', profession: '炼星师'},
          {id: 'pb2', nickname: '林小雨', teamId: 'team-b', avatarUrl: 'https://images.unsplash.com/photo-1542178243-bc20204b769e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHdvbWFuJTIwYXNpYW58ZW58MHx8MHx8fDA%3D', element: 'fire', profession: '绝剑士'},
          {id: 'pb3', nickname: '黄小龙', teamId: 'team-b', avatarUrl: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fG1hbiUyMGFzaWFufGVufDB8fDB8fHww', element: 'wood', profession: '矩盾手'}
     ];
     return Promise.resolve({ success: true, data: mockMembers });
    // return callApi<Member[]>('/members');
  };
  
  export const createMember = (memberData: Partial<Member>): Promise<ApiResponse<Member>> => {
    // TODO: Implement actual API call
     console.warn("API: createMember not implemented, using mock data.");
     const mockMember: Member = { id: `member-${Date.now()}`, nickname: memberData.nickname || '新选手', teamId: memberData.teamId || '', avatarUrl: memberData.avatarUrl, element: memberData.element, profession: memberData.profession };
     return Promise.resolve({ success: true, data: mockMember });
    // return callApi<Member>('/members', 'POST', memberData);
  };
  
  export const updateMember = (memberId: string, memberData: Partial<Member>): Promise<ApiResponse<Member>> => {
    // TODO: Implement actual API call
     console.warn("API: updateMember not implemented, using mock data.");
     const mockMember: Member = { id: memberId, nickname: memberData.nickname || '更新选手', teamId: memberData.teamId || '', avatarUrl: memberData.avatarUrl, element: memberData.element, profession: memberData.profession };
     return Promise.resolve({ success: true, data: mockMember });
    // return callApi<Member>(`/members/${memberId}`, 'PUT', memberData);
  };
  
  export const deleteMember = (memberId: string): Promise<ApiResponse<void>> => {
    // TODO: Implement actual API call
     console.warn("API: deleteMember not implemented, using mock data.");
     return Promise.resolve({ success: true });
    // return callApi<void>(`/members/${memberId}`, 'DELETE');
  };
  
  // --- Songs API (if you have a song database) ---
  export const fetchSongs = (): Promise<ApiResponse<Song[]>> => {
      // TODO: Implement actual API call
      console.warn("API: fetchSongs not implemented, using mock data.");
      const mockSongs: Song[] = [
          { id: 's1', title: 'Butterfly', difficulty: '12+', element: 'fire', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', bpm: 185 },
          { id: 's2', title: '终末的花束', difficulty: '12', element: 'fire', coverUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWMlMjBjb3ZlcnxlbnwwfHwwfHx8MA%3D%3D', bpm: 150 },
          { id: 's3', title: 'Good Song', difficulty: '13', element: 'water', coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', bpm: 200 },
           { id: 's4', title: 'Another Track', difficulty: '11', element: 'wood', coverUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=Song4', bpm: 160 },
           { id: 's5', title: 'Fifth Song', difficulty: '10', element: 'fire', coverUrl: 'https://via.placeholder.com/50/ef4444/ffffff?text=Song5', bpm: 140 },
           { id: 's6', title: 'Sixth Song', difficulty: '14', element: 'water', coverUrl: 'https://via.placeholder.com/50/3b82f6/ffffff?text=Song6', bpm: 220 },
           { id: 's7', title: 'Seventh Song', difficulty: '12', element: 'wood', coverUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=Song7', bpm: 170 },
           { id: 's8', title: 'Eighth Song', difficulty: '13+', element: 'fire', coverUrl: 'https://via.placeholder.com/50/ef4444/ffffff?text=Song8', bpm: 190 },
           { id: 's9', title: 'Ninth Song', difficulty: '11', element: 'water', coverUrl: 'https://via.placeholder.com/50/3b82f6/ffffff?text=Song9', bpm: 155 },
           { id: 's10', title: 'Tenth Song', difficulty: '10+', element: 'wood', coverUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=Song10', bpm: 145 },
           { id: 's11', title: 'Eleventh Song', difficulty: '14+', element: 'fire', coverUrl: 'https://via.placeholder.com/50/ef4444/ffffff?text=Song11', bpm: 210 },
           { id: 's12', title: 'Twelfth Song', difficulty: '12', element: 'water', coverUrl: 'https://via.placeholder.com/50/3b82f6/ffffff?text=Song12', bpm: 165 },
           { id: 's13', title: 'Thirteenth Song', difficulty: '13', element: 'wood', coverUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=Song13', bpm: 180 },
      ];
      return Promise.resolve({ success: true, data: mockSongs });
      // return callApi<Song[]>('/songs');
  };
  
  
  // --- Tournament/Match API ---
  export const fetchSchedule = (): Promise<ApiResponse<TournamentMatch[]>> => {
    // TODO: Implement actual API call
     console.warn("API: fetchSchedule not implemented, using mock data.");
     const mockSchedule: TournamentMatch[] = [
          // ADDED "completed" status here for mock data consistency with type
          { id: 'match-1', roundName: "初赛 - 第1轮", status: "archived_in_d1", teamA_id: "team-a", teamB_id: "team-b", teamA_name: "音游大师队", teamB_name: "节奏猎人队", winner_team_id: "team-a", scheduledTime: '2023-12-10T14:00:00Z', final_score_a: 35, final_score_b: 0 },
          { id: 'match-2', roundName: "初赛 - 第2轮", status: "ongoing", teamA_id: "team-a", teamB_id: "team-b", teamA_name: "音游大师队", teamB_name: "节奏猎人队", match_do_id: 'do-match-2', scheduledTime: '2023-12-12T16:00:00Z' }, // This one is ongoing
          { id: 'match-3', roundName: "初赛 - 第3轮", status: "scheduled", teamA_id: "team-c", teamB_id: "team-d", teamA_name: "星光舞者队", teamB_name: "旋律掌控者队", scheduledTime: '2023-12-15T14:30:00Z' },
          { id: 'match-4', roundName: "复赛 - 第1轮", status: "scheduled", teamA_id: "team-a", teamB_id: "team-c", teamA_name: "音游大师队", teamB_name: "星光舞者队", scheduledTime: '2023-12-20T19:00:00Z' },
     ];
     return Promise.resolve({ success: true, data: mockSchedule });
    // return callApi<TournamentMatch[]>('/tournament_matches');
  };
  
  export const createMatch = (matchData: Partial<TournamentMatch>): Promise<ApiResponse<TournamentMatch>> => {
    // TODO: Implement actual API call
     console.warn("API: createMatch not implemented, using mock data.");
     const mockMatch: TournamentMatch = { id: `match-${Date.now()}`, status: 'scheduled', ...matchData, teamA_id: matchData.teamA_id || '', teamB_id: matchData.teamB_id || '', roundName: matchData.roundName || '新轮次' };
     return Promise.resolve({ success: true, data: mockMatch });
    // return callApi<TournamentMatch>('/tournament_matches', 'POST', matchData);
  };
  
  export const updateMatch = (matchId: string, matchData: Partial<TournamentMatch>): Promise<ApiResponse<TournamentMatch>> => {
    // TODO: Implement actual API call
     console.warn("API: updateMatch not implemented, using mock data.");
     const mockMatch: TournamentMatch = { id: matchId, status: 'scheduled', roundName: '更新轮次', teamA_id: 'team-a', teamB_id: 'team-b', ...matchData };
     return Promise.resolve({ success: true, data: mockMatch });
    // return callApi<TournamentMatch>(`/tournament_matches/${matchId}`, 'PUT', matchData);
  };
  
  export const deleteMatch = (matchId: string): Promise<ApiResponse<void>> => {
    // TODO: Implement actual API call
     console.warn("API: deleteMatch not implemented, using mock data.");
     return Promise.resolve({ success: true });
    // return callApi<void>(`/tournament_matches/${matchId}`, 'DELETE');
  };
  
  export const startLiveMatch = (matchId: string, playerOrderA: string[], playerOrderB: string[], songs: MatchSong[]): Promise<ApiResponse<{ match_do_id: string }>> => {
    // TODO: Implement actual API call to Worker that creates/gets DO
     console.warn(`API: startLiveMatch called for ${matchId}, using mock DO ID.`);
     // In a real scenario, this API call would trigger the Worker to create/get the DO
     // and return its ID.
     const mockDoId = `do-${matchId}`; // Simulate a DO ID based on match ID
     // You might also need to pass player order and initial songs to the backend here
     // return callApi<{ match_do_id: string }>(`/tournament_matches/${matchId}/start_live`, 'POST', { playerOrderA, playerOrderB, songs });
     return Promise.resolve({ success: true, data: { match_do_id: mockDoId } });
  };
  
  export const fetchMatchState = (doId: string): Promise<ApiResponse<MatchState>> => {
      // TODO: Implement actual API call to get current DO state via HTTP
      console.warn(`API: fetchMatchState called for DO ${doId}, using mock data.`);
       const mockState: MatchState = {
          match_do_id: doId,
          tournament_match_id: doId.replace('do-', 'match-'), // Simulate link back
          status: 'ongoing', // Simulate ongoing state
          round: 1,
          teamA_id: 'team-a',
          teamB_id: 'team-b',
          teamA_name: '音游大师队',
          teamB_name: '节奏猎人队',
          teamA_score: 100,
          teamB_score: 100,
          teamA_player_order: ['pa1', 'pa2', 'pa3'],
          teamB_player_order: ['pb1', 'pb2', 'pb3'], // Corrected property name
          teamA_current_player_id: 'pa1',
          teamB_current_player_id: 'pb1',
          teamA_current_player_name: '李小明',
          teamB_current_player_name: '陈一鸣',
          teamA_current_player_profession: '绝剑士',
          teamB_current_player_profession: '炼星师',
          teamA_mirror_available: true,
          teamB_mirror_available: true,
          // CHANGED: current_song type to MatchSong and added picker_team_id, coverUrl, bpm
          current_song: { song_id: 's2', song_title: '终末的花束', song_difficulty: '12', song_element: 'fire', coverUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWMlMjBjb3ZlcnxlbnwwfHwwfHx8MA%3D%3D', bpm: 150, picker_team_id: 'team-a', status: 'ongoing' },
          roundSummary: null,
       };
       // Simulate different states based on DO ID or other logic if needed for testing
       if (doId === 'do-match-2') {
           mockState.round = 3;
           mockState.teamA_score = 85;
           mockState.teamB_score = 60;
           mockState.teamA_current_player_id = 'pa3';
           mockState.teamB_current_player_id = 'pb3';
           mockState.teamA_current_player_name = '张小强';
           mockState.teamB_current_player_name = '黄小龙';
           mockState.teamA_current_player_profession = '炼星师';
           mockState.teamB_current_player_profession = '矩盾手';
           mockState.teamA_mirror_available = false; // Simulate mirror used
           // CHANGED: current_song type to MatchSong and added picker_team_id, coverUrl, bpm
           mockState.current_song = { song_id: 's1', song_title: 'Butterfly', song_difficulty: '12+', song_element: 'fire', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', bpm: 185, picker_team_id: 'team-b', status: 'ongoing' };
           // Simulate a round summary for match-2 ongoing state
           mockState.roundSummary = {
               round: 2, // Summary of the *previous* round
               teamA_player_id: 'pa2',
               teamB_player_id: 'pb2',
               teamA_percentage: 98.7654,
               teamB_percentage: 99.1234,
               teamA_damage_digits: [1,2,3,4],
               teamB_damage_digits: [5,6,7,8],
               teamA_base_damage: 10,
               teamB_base_damage: 20,
               teamA_max_digit_damage: 4,
               teamB_max_digit_damage: 8,
               teamA_effect_value: 0,
               teamB_effect_value: 0,
               teamA_final_damage_dealt: 15,
               teamB_final_damage_dealt: 25,
               teamA_score_change: -15,
               teamB_score_change: -25,
               teamA_new_score: 85, // Score after round 2
               teamB_new_score: 60, // Score after round 2
               teamA_mirror_triggered: false,
               teamB_mirror_triggered: false,
               log: ["模拟日志：队伍A造成15伤害，队伍B造成25伤害。"]
           };
           mockState.status = 'round_finished'; // Simulate it's waiting for next round
       }
  
  
      return Promise.resolve({ success: true, data: mockState });
      // return callApi<MatchState>(`/live-match/${doId}/state`);
  };
  
  
  // --- Durable Object API (forwarded via Worker) ---
  // These map directly to the internal DO endpoints
  export const calculateRound = (doId: string, payload: CalculateRoundPayload): Promise<ApiResponse<MatchState>> => {
    // TODO: Implement actual API call
     console.warn(`API: calculateRound called for DO ${doId} with payload`, payload);
     // Simulate state update (simplified mock)
     // In a real scenario, the DO would calculate and return the *new* state
     const mockState: MatchState = {
          match_do_id: doId,
          tournament_match_id: doId.replace('do-', 'match-'),
          status: 'round_finished', // Simulate round finished
          round: 3, // Simulate round number
          teamA_id: 'team-a',
          teamB_id: 'team-b',
          teamA_name: '音游大师队',
          teamB_name: '节奏猎人队',
          teamA_score: 70, // Simulate score change
          teamB_score: 50, // Simulate score change
          teamA_player_order: ['pa1', 'pa2', 'pa3'],
          teamB_player_order: ['pb1', 'pb2', 'pb3'],
          teamA_current_player_id: 'pa3', // Still current players until nextRound
          teamB_current_player_id: 'pb3',
          teamA_current_player_name: '张小强',
          teamB_current_player_name: '黄小龙',
          teamA_current_player_profession: '炼星师',
          teamB_current_player_profession: '矩盾手',
          teamA_mirror_available: false,
          teamB_mirror_available: true,
          // Keep current song info, ensure it matches MatchSong type
          current_song: { song_id: 's1', song_title: 'Butterfly', song_difficulty: '12+', song_element: 'fire', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', bpm: 185, picker_team_id: 'team-b', status: 'ongoing' },
          roundSummary: { // Simulate round summary based on payload
              round: 3,
              teamA_player_id: 'pa3',
              teamB_player_id: 'pb3',
              teamA_percentage: 100 + payload.teamA_decimal_percentage / 10000, // Simulate full percentage
              teamB_percentage: 100 + payload.teamB_decimal_percentage / 10000, // Simulate full percentage
              teamA_damage_digits: [1,2,3,4], // Mock digits
              teamB_damage_digits: [5,6,7,8], // Mock digits
              teamA_base_damage: 10, // Mock damage
              teamB_base_damage: 20, // Mock damage
              teamA_max_digit_damage: 4, // Mock max digit damage
              teamB_max_digit_damage: 8, // Mock max digit damage
              teamA_effect_value: payload.teamA_effect_value || 0,
              teamB_effect_value: payload.teamB_effect_value || 0,
              teamA_final_damage_dealt: 20, // Mock final damage
              teamB_final_damage_dealt: 30, // Mock final damage
              teamA_score_change: -30, // Mock change
              teamB_score_change: -50, // Mock change
              teamA_new_score: 70, // Score after this round
              teamB_new_score: 50, // Score after this round
              teamA_mirror_triggered: false,
              teamB_mirror_triggered: false,
              log: ["模拟日志：队伍A造成20伤害，队伍B造成30伤害。"]
          }
       };
       // Simulate win condition based on new scores
       if (mockState.teamA_score <= 0) mockState.status = 'team_B_wins';
       if (mockState.teamB_score <= 0) mockState.status = 'team_A_wins';
       if (mockState.teamA_score <= 0 && mockState.teamB_score <= 0) mockState.status = 'draw_pending_resolution';
  
  
     return Promise.resolve({ success: true, data: mockState });
    // return callApi<MatchState>(`/live-match/${doId}/calculate-round`, 'POST', payload);
  };
  
  export const nextRound = (doId: string): Promise<ApiResponse<MatchState>> => {
    // TODO: Implement actual API call
     console.warn(`API: nextRound called for DO ${doId}`);
      // Simulate state update (simplified mock)
      const mockState: MatchState = {
          match_do_id: doId,
          tournament_match_id: doId.replace('do-', 'match-'),
          status: 'ongoing', // Back to ongoing
          round: 4, // Increment round
          teamA_id: 'team-a',
          teamB_id: 'team-b',
          teamA_name: '音游大师队',
          teamB_name: '节奏猎人队',
          teamA_score: 70, // Keep scores
          teamB_score: 50,
          teamA_player_order: ['pa1', 'pa2', 'pa3'], // Keep order
          teamB_player_order: ['pb1', 'pb2', 'pb3'], // Keep order
          // Simulate next players in order (wraps around)
          teamA_current_player_id: 'pa1', // Example: wraps from pa3 to pa1
          teamB_current_player_id: 'pb1', // Example: wraps from pb3 to pb1
          teamA_current_player_name: '李小明', // Need logic to get name by ID
          teamB_current_player_name: '陈一鸣', // Need logic to get name by ID
          teamA_current_player_profession: '绝剑士', // Need logic to get profession by ID
          teamB_current_player_profession: '炼星师', // Need logic to get profession by ID
          teamA_mirror_available: false, // Mirror remains used if used
          teamB_mirror_available: true,
          // Simulate next song (simple example), ensure it matches MatchSong type
          current_song: { song_id: 's4', song_title: 'Another Track', song_difficulty: '11', song_element: 'wood', coverUrl: 'https://via.placeholder.com/50/10b981/ffffff?text=Song4', bpm: 160, picker_team_id: 'team-a', status: 'ongoing' },
          roundSummary: null, // Clear summary
       };
     return Promise.resolve({ success: true, data: mockState });
    // return callApi<MatchState>(`/live-match/${doId}/next-round`, 'POST');
  };
  
  export const resolveDraw = (doId: string, payload: ResolveDrawPayload): Promise<ApiResponse<MatchState>> => {
    // TODO: Implement actual API call
     console.warn(`API: resolveDraw called for DO ${doId} with winner`, payload.winner_team_id);
      // Simulate state update (simplified mock)
      const mockState: MatchState = {
          match_do_id: doId,
          tournament_match_id: doId.replace('do-', 'match-'),
          status: payload.winner_team_id === 'team-a' ? 'team_A_wins' : 'team_B_wins', // Set winner status
          round: 3, // Keep round
          teamA_id: 'team-a',
          teamB_id: 'team-b',
          teamA_name: '音游大师队',
          teamB_name: '节奏猎人队',
          teamA_score: 0, // Scores remain as they were at draw (or set to 0 if game rules dictate)
          teamB_score: 0,
          teamA_player_order: ['pa1', 'pa2', 'pa3'],
          teamB_player_order: ['pb1', 'pb2', 'pb3'],
          teamA_current_player_id: null, // Match ended
          teamB_current_player_id: null,
          teamA_current_player_name: undefined,
          teamB_current_player_name: undefined,
          teamA_current_player_profession: undefined,
          teamB_current_player_profession: undefined,
          teamA_mirror_available: false, // Mirror status at draw
          teamB_mirror_available: true,
          current_song: null, // Match ended
          roundSummary: null, // Clear summary
       };
     return Promise.resolve({ success: true, data: mockState });
    // return callApi<MatchState>(`/live-match/${doId}/resolve-draw`, 'POST', payload);
  };
  
  export const archiveMatch = (doId: string): Promise<ApiResponse<void>> => {
    // TODO: Implement actual API call
     console.warn(`API: archiveMatch called for DO ${doId}`);
     // This call would typically update the D1 record status and potentially destroy the DO
     return Promise.resolve({ success: true });
    // return callApi<void>(`/live-match/${doId}/archive`, 'POST');
  };
  
  // --- Match History API ---
  export const fetchMatchHistory = (): Promise<ApiResponse<TournamentMatch[]>> => {
      // TODO: Implement actual API call to fetch archived matches from D1
      console.warn("API: fetchMatchHistory not implemented, using mock data.");
      const mockHistory: TournamentMatch[] = [
          // Ensure mock history uses statuses defined in types.ts
          { id: 'match-1', roundName: "初赛 - 第1轮", status: "archived_in_d1", teamA_id: "team-a", teamB_id: "team-b", teamA_name: "音游大师队", teamB_name: "节奏猎人队", winner_team_id: "team-a", scheduledTime: '2023-12-10T14:00:00Z', final_score_a: 35, final_score_b: 0 },
          { id: 'match-5', roundName: "初赛 - 第4轮", status: "archived_in_d1", teamA_id: "team-c", teamB_id: "team-a", teamA_name: "星光舞者队", teamB_name: "音游大师队", winner_team_id: "team-c", scheduledTime: '2023-12-11T10:00:00Z', final_score_a: 10, final_score_b: 0 },
          // Add more completed/archived matches
      ];
      return Promise.resolve({ success: true, data: mockHistory });
      // return callApi<TournamentMatch[]>('/match_history');
  };
  
  