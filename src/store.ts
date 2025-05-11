import { defineStore } from 'pinia'
import * as api from './services/api' // Import API functions

// --- ALL TYPE DEFINITIONS GO HERE ---

// API Response Wrapper (can be defined here or in api.ts)
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface Team {
    id: number;
    code: string;
    name: string;
    created_at?: number | null;
    current_health?: number | null;
    has_revive_mirror?: number | null;
    status?: string | null;
}

export interface Member {
    id: number;
    team_code: string;
    color?: string | null;
    job?: string | null;
    maimai_id?: string | null;
    nickname: string;
    qq_number?: string | null;
    avatar_url?: string | null;
    joined_at?: number | null;
    updated_at?: number | null;
    kinde_user_id?: string | null;
    is_admin?: number | null;
}

export interface SongLevel {
    B?: string; A?: string; E?: string; M?: string; R?: string;
}

export interface Song {
    id: number;
    title: string;
    category?: string | null;
    bpm?: string | null;
    levels_json?: string | null;
    type?: string | null;
    cover_filename?: string | null;
    source_data_version?: string | null;
    created_at?: string;
    parsedLevels?: SongLevel;
    fullCoverUrl?: string; // Expected from backend
}

export interface MemberSongPreference {
    id?: number;
    member_id: number;
    tournament_stage: string;
    song_id: number;
    selected_difficulty: string;
    created_at?: string;
    song_title?: string;
    cover_filename?: string;
    fullCoverUrl?: string; // Expected from backend
    parsedLevels?: SongLevel; // Expected from backend
}

export interface MatchSong {
    song_id: number;
    song_title: string;
    song_difficulty: string; // e.g., 'M 13'
    song_element?: 'fire' | 'wood' | 'water' | null;
    cover_filename?: string | null;
    bpm?: string | null;
    fullCoverUrl?: string; // Expected from backend

    picker_member_id: number;
    picker_team_id: number;
    is_tiebreaker_song?: boolean;

    status: 'pending' | 'ongoing' | 'completed';

    teamA_player_id?: number;
    teamB_player_id?: number;
    teamA_percentage?: number;
    teamB_percentage?: number;
    teamA_damage_dealt?: number;
    teamB_damage_dealt?: number;
    teamA_effect_value?: number;
    teamB_effect_value?: number;
    teamA_health_after?: number;
    teamB_health_after?: number;
    teamA_mirror_triggered?: boolean;
    teamB_mirror_triggered?: boolean;
}

export interface TournamentMatch {
    id: number;
    round_name: string;
    team1_id: number;
    team2_id: number;
    status: 'scheduled' | 'pending_song_confirmation' | 'ready_to_start' | 'live' | 'completed' | 'archived';
    winner_team_id?: number | null;
    match_do_id?: string | null;
    scheduled_time?: string | null;
    current_match_song_index?: number;
    // Backend provides parsed JSON fields directly now
    team1_player_order?: number[] | null;
    team2_player_order?: number[] | null;
    match_song_list?: MatchSong[] | null;
    // Denormalized names/codes from backend JOINs
    team1_name?: string;
    team2_name?: string;
    winner_team_name?: string;
    team1_code?: string;
    team2_code?: string;
    winner_team_code?: string;
    final_score_team1?: number | null;
    final_score_team2?: number | null;
    created_at: string;
    updated_at?: string;
}

export interface MatchState {
    match_do_id: string;
    tournament_match_id: number;
    status: 'pending_scores' | 'round_finished' | 'team_A_wins' | 'team_B_wins' | 'draw_pending_resolution' | 'tiebreaker_pending_song' | 'archived';
    round_name: string;
    current_match_song_index: number;
    teamA_id: number;
    teamB_id: number;
    teamA_name: string;
    teamB_name: string;
    teamA_score: number;
    teamB_score: number;
    teamA_player_order_ids: number[];
    teamB_player_order_ids: number[];
    teamA_current_player_id: number | null;
    teamB_current_player_id: number | null;
    teamA_current_player_nickname?: string;
    teamB_current_player_nickname?: string;
    teamA_current_player_profession?: string | null;
    teamB_current_player_profession?: string | null; 
    teamA_mirror_available: boolean;
    teamB_mirror_available: boolean;
    match_song_list: MatchSong[];
    current_song: MatchSong | null;
    roundSummary: RoundSummary | null;
}


export interface RoundSummary {
    round_number_in_match: number;
    song_id: number;
    song_title: string;
    selected_difficulty: string;
    teamA_player_id: number;
    teamB_player_id: number;
    teamA_player_nickname: string;
    teamB_player_nickname: string;
    teamA_percentage: number;
    teamB_percentage: number;
    teamA_effect_value_applied: number;
    teamB_effect_value_applied: number;
    teamA_damage_digits: number[];
    teamB_damage_digits: number[];
    teamA_base_damage: number;
    teamB_base_damage: number;
    teamA_profession?: string | null;
    teamB_profession?: string | null;
    teamA_profession_effect_applied?: string;
    teamB_profession_effect_applied?: string;
    teamA_modified_damage_to_B: number;
    teamB_modified_damage_to_A: number;
    teamA_health_before_round: number;
    teamB_health_before_round: number;
    teamA_mirror_triggered: boolean;
    teamB_mirror_triggered: boolean;
    teamA_mirror_effect_applied?: string;
    teamB_mirror_effect_applied?: string;
    teamA_supporter_base_skill_heal?: number;
    teamB_supporter_base_skill_heal?: number;
    teamA_supporter_mirror_bonus_heal?: number;
    teamB_supporter_mirror_bonus_heal?: number;
    teamA_final_damage_dealt: number;
    teamB_final_damage_dealt: number;
    teamA_health_change: number;
    teamB_health_change: number;
    teamA_health_after: number;
    teamB_health_after: number;
    is_tiebreaker_song?: boolean;
    log?: string[];
}

export interface MatchHistoryRound {
    id: number; tournament_match_id: number; match_do_id: string; round_number_in_match: number;
    song_id: number | null; selected_difficulty: string | null; picker_team_id: number | null; picker_member_id: number | null;
    team1_member_id: number | null; team2_member_id: number | null; team1_percentage: number | null; team2_percentage: number | null;
    team1_damage_dealt: number | null; team2_damage_dealt: number | null; team1_health_change: number | null; team2_health_change: number | null;
    team1_health_before: number | null; team2_health_before: number | null; team1_health_after: number | null; team2_health_after: number | null;
    team1_mirror_triggered: number | null; team2_mirror_triggered: number | null; team1_effect_value: number | null; team2_effect_value: number | null;
    is_tiebreaker_song: number | null; recorded_at: string; round_summary_json: string | null;
    song_title?: string | null; cover_filename?: string | null; picker_team_name?: string | null; picker_member_nickname?: string | null;
    team1_member_nickname?: string | null; team2_member_nickname?: string | null;
    round_summary?: RoundSummary | null; // Parsed by frontend
    fullCoverUrl?: string; // Constructed by frontend or backend
}

export interface MatchHistoryMatch {
    id: number; round_name: string; scheduled_time: string | null; status: 'completed' | 'archived';
    final_score_team1: number | null; final_score_team2: number | null;
    team1_name?: string; team2_name?: string; winner_team_name?: string;
    rounds: MatchHistoryRound[]; // Includes detailed round history
}

// API Payloads (matching backend)
export interface CreateTournamentMatchPayload {
    round_name: string;
    team1_id: number | null;
    team2_id: number | null;
    scheduled_time?: string | null;
}
export interface ConfirmMatchSetupPayload {
    team1_player_order: number[];
    team2_player_order: number[];
    match_song_list: MatchSong[];
}
export interface CalculateRoundPayload {
    teamA_percentage: number;
    teamB_percentage: number;
    teamA_effect_value?: number;
    teamB_effect_value?: number;
}
export interface ResolveDrawPayload {
    winner: 'teamA' | 'teamB';
}
export interface SelectTiebreakerSongPayload {
    song_id: number;
    selected_difficulty: string;
}
export interface SaveMemberSongPreferencePayload {
    member_id: number;
    tournament_stage: string;
    song_id: number;
    selected_difficulty: string;
}


// --- PINIA STORE STATE INTERFACE ---
export interface AppState {
    teams: Team[];
    members: Member[];
    songs: Song[];
    tournamentMatches: TournamentMatch[];
    currentMatchState: MatchState | null;
    matchHistory: MatchHistoryMatch[];
    memberSongPreferences: MemberSongPreference[];
    isLoading: {
        teams: boolean;
        members: boolean;
        songs: boolean;
        tournamentMatches: boolean;
        currentMatch: boolean;
        matchHistory: boolean;
        memberSongPreferences: boolean;
        [key: string]: boolean; // For generic loading states
    };
    error: string | null;
    currentMatchWebSocket: WebSocket | null;
}

// --- PINIA STORE DEFINITION ---
export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        teams: [],
        members: [],
        songs: [],
        tournamentMatches: [],
        currentMatchState: null,
        matchHistory: [],
        memberSongPreferences: [],
        isLoading: {
            teams: false, members: false, songs: false, tournamentMatches: false,
            currentMatch: false, matchHistory: false, memberSongPreferences: false,
        },
        error: null,
        currentMatchWebSocket: null,
    }),

    actions: {
        // --- Generic Loading and Error Handling ---
        setLoading(key: string, value: boolean) {
            this.isLoading[key] = value;
        },
        setError(message: string | null) {
            this.error = message;
            if (message) console.error("Store Error:", message);
        },
        clearError() {
             this.error = null;
        },

        // --- Data Fetching Actions ---
        async fetchTeams() {
            this.setLoading('teams', true);
            this.clearError();
            try {
                const response = await api.fetchTeams();
                if (response.success && response.data) {
                    this.teams = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch teams');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('teams', false);
            }
        },

        async fetchMembers(teamCode?: string) {
            this.setLoading('members', true);
            this.clearError();
            try {
                const response = await api.fetchMembers(teamCode);
                if (response.success && response.data) {
                    this.members = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch members');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('members', false);
            }
        },

        async fetchSongs(params?: { category?: string; type?: string; search?: string }) {
            this.setLoading('songs', true);
            this.clearError();
            try {
                const response = await api.fetchSongs(params);
                if (response.success && response.data) {
                    this.songs = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch songs');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('songs', false);
            }
        },

        async fetchTournamentMatches() {
            this.setLoading('tournamentMatches', true);
            this.clearError();
            try {
                const response = await api.fetchTournamentMatches();
                if (response.success && response.data) {
                    this.tournamentMatches = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch tournament matches');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('tournamentMatches', false);
            }
        },

        async fetchMatchState(doId: string) {
            this.setLoading('currentMatch', true);
            this.clearError();
            try {
                const response = await api.fetchMatchState(doId);
                if (response.success && response.data) {
                    this.currentMatchState = response.data;
                } else {
                    this.setError(response.error || `Failed to fetch match state for ${doId}`);
                    this.currentMatchState = null;
                }
            } catch (err: any) {
                this.setError(err.message);
                this.currentMatchState = null;
            } finally {
                this.setLoading('currentMatch', false);
            }
        },

        async fetchMatchHistory() {
            this.setLoading('matchHistory', true);
            this.clearError();
            try {
                const response = await api.fetchMatchHistory();
                if (response.success && response.data) {
                    this.matchHistory = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch match history');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('matchHistory', false);
            }
        },

        async fetchMemberSongPreferences(memberId: number, stage: string) {
            this.setLoading('memberSongPreferences', true);
            this.clearError();
            try {
                const response = await api.fetchMemberSongPreferences(memberId, stage);
                if (response.success && response.data) {
                    this.memberSongPreferences = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch member song preferences');
                }
            } catch (err: any) {
                this.setError(err.message);
            } finally {
                this.setLoading('memberSongPreferences', false);
            }
        },

        // --- Tournament & Match Actions ---
        async createTournamentMatch(payload: CreateTournamentMatchPayload) {
            this.clearError();
            try {
                const response = await api.createTournamentMatch(payload);
                if (response.success && response.data) {
                    // Add the new match to the list and keep it sorted (optional, or re-fetch)
                    this.tournamentMatches.unshift(response.data);
                    // Simple sort by created_at descending
                    this.tournamentMatches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    return response.data;
                } else {
                    this.setError(response.error || 'Failed to create tournament match');
                    return null;
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            }
        },

        async confirmMatchSetup(matchId: number, payload: ConfirmMatchSetupPayload) {
            this.clearError();
            try {
                const response = await api.confirmMatchSetup(matchId, payload);
                if (response.success && response.data) {
                    // Update the match in the list
                    const index = this.tournamentMatches.findIndex(m => m.id === matchId);
                    if (index !== -1) this.tournamentMatches[index] = response.data;
                    return response.data;
                } else {
                    this.setError(response.error || 'Failed to confirm match setup');
                    return null;
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            }
        },

        async startLiveMatch(matchId: number) {
            this.clearError();
            try {
                const response = await api.startLiveMatch(matchId);
                if (response.success && response.data?.match_do_id) {
                    // Update the match in the list
                    const index = this.tournamentMatches.findIndex(m => m.id === matchId);
                    if (index !== -1) {
                        this.tournamentMatches[index].status = 'live';
                        this.tournamentMatches[index].match_do_id = response.data.match_do_id;
                    }
                    return response.data;
                } else {
                    this.setError(response.error || 'Failed to start live match');
                    return null;
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            }
        },

        // --- Live Match (DO) Actions ---
        // These actions trigger backend logic. The state update is expected via WebSocket.
        async calculateRound(doId: string, payload: CalculateRoundPayload) {
            this.clearError();
            try {
                const response = await api.calculateRound(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to calculate round');
                }
                // The DO will broadcast the new state via WebSocket, which updates this.currentMatchState
                return response; // Return the API response for potential immediate feedback
            } catch (err: any) {
                this.setError(err.message);
                return { success: false, error: err.message };
            }
        },

        async nextRound(doId: string) {
            this.clearError();
            try {
                const response = await api.nextRound(doId);
                if (!response.success) {
                    this.setError(response.error || 'Failed to advance to next round');
                }
                // New state will come via WebSocket
            } catch (err: any) {
                this.setError(err.message);
            }
        },

        async selectTiebreakerSong(doId: string, payload: SelectTiebreakerSongPayload) {
            this.clearError();
            try {
                const response = await api.selectTiebreakerSong(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to select tiebreaker song');
                }
                // New state will come via WebSocket
            } catch (err: any) {
                this.setError(err.message);
            }
        },

        async resolveDraw(doId: string, payload: ResolveDrawPayload) {
            this.clearError();
            try {
                const response = await api.resolveDraw(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to resolve draw');
                }
                // New state will come via WebSocket, or match might end
            } catch (err: any) {
                this.setError(err.message);
            }
        },

        async archiveMatch(doId: string) {
            this.clearError();
            try {
                const response = await api.archiveMatch(doId);
                if (response.success) {
                    this.currentMatchState = null; // Clear current match state
                    // Optionally, refresh tournament matches list
                    this.fetchTournamentMatches();
                    // Optionally, refresh match history
                    this.fetchMatchHistory();
                } else {
                    this.setError(response.error || 'Failed to archive match');
                }
            } catch (err: any) {
                this.setError(err.message);
            }
        },

        async saveMemberSongPreference(payload: SaveMemberSongPreferencePayload) {
            this.clearError();
            try {
                const response = await api.saveMemberSongPreference(payload);
                if (response.success && response.data) {
                    // Update local list or re-fetch
                    const index = this.memberSongPreferences.findIndex(p =>
                        p.member_id === payload.member_id &&
                        p.tournament_stage === payload.tournament_stage &&
                        p.song_id === payload.song_id &&
                        p.selected_difficulty === payload.selected_difficulty // Match on all key fields
                    );
                     if (index !== -1) {
                         // If exists, replace it (handles ON CONFLICT update)
                         this.memberSongPreferences[index] = response.data;
                     } else {
                         // If new, add it
                         this.memberSongPreferences.push(response.data);
                     }
                    return response.data;
                } else {
                    this.setError(response.error || 'Failed to save song preference');
                    return null;
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            }
        },
        // TODO: Add deleteMemberSongPreference if needed

        // --- WebSocket Management ---
        connectWebSocket(doId: string) {
            if (this.currentMatchWebSocket && this.currentMatchWebSocket.readyState === WebSocket.OPEN) {
                console.log(`WebSocket already open for DO: ${this.currentMatchState?.match_do_id}. Closing existing.`);
                this.currentMatchWebSocket.close(1000, "New connection requested");
            }
             if (this.currentMatchWebSocket && this.currentMatchWebSocket.readyState === WebSocket.CONNECTING) {
                 console.log(`WebSocket already connecting for DO: ${this.currentMatchState?.match_do_id}. Waiting.`);
                 return; // Avoid multiple connection attempts
             }


            // Adjust protocol and host for WebSocket
            // Assumes frontend and Worker are on the same domain/subdomain
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.host;
            const wsUrl = `${wsProtocol}//${wsHost}/api/live-match/${doId}/websocket`; // Matches Worker endpoint

            console.log(`Attempting to connect WebSocket to: ${wsUrl}`);
            this.currentMatchWebSocket = new WebSocket(wsUrl);

            this.currentMatchWebSocket.onopen = () => {
                console.log(`WebSocket connected for DO: ${doId}`);
                this.clearError(); // Clear any previous connection errors
                // Initial state should be sent by the DO upon connection
            };

            this.currentMatchWebSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data as string);
                    // Check if the received data is a MatchState object
                    if (data && typeof data === 'object' && data.match_do_id === doId && data.status !== undefined) {
                         console.log(`Received MatchState update for DO ${doId}:`, data);
                         this.currentMatchState = data as MatchState;
                         this.clearError(); // Clear error on successful state update
                    } else if (data && data.error) {
                        console.error(`WebSocket received error for DO ${doId}:`, data.error);
                        // Decide how to handle errors received over WS - maybe show a temporary message
                        // this.setError(`WebSocket error: ${data.error}`); // Might be too disruptive
                    } else {
                        console.log(`WebSocket received unknown message for DO ${doId}:`, data);
                    }
                } catch (e) {
                    console.error(`Failed to parse WebSocket message for DO ${doId}:`, e);
                    // this.setError("Received invalid WebSocket message."); // Might be too disruptive
                }
            };

            this.currentMatchWebSocket.onerror = (error) => {
                console.error(`WebSocket error for DO ${doId}:`, error);
                this.setError('WebSocket connection error. Please refresh or check match status.');
                // Decide if you want to clear state immediately on error
                // this.currentMatchState = null;
            };

            this.currentMatchWebSocket.onclose = (event) => {
                console.log(`WebSocket closed for DO ${doId}. Code: ${event.code}, Reason: ${event.reason}`);
                // Only set error if it's an abnormal closure
                if (event.code !== 1000 && event.code !== 1001) { // 1000 = normal, 1001 = going away
                     this.setError(`WebSocket disconnected unexpectedly (Code: ${event.code}).`);
                }
                // Decide if you want to clear state or show a "disconnected" status
                // this.currentMatchState = null;
                this.currentMatchWebSocket = null; // Clear the reference
            };
        },

        disconnectWebSocket() {
            if (this.currentMatchWebSocket && this.currentMatchWebSocket.readyState === WebSocket.OPEN) {
                console.log(`Closing WebSocket for DO: ${this.currentMatchState?.match_do_id}`);
                this.currentMatchWebSocket.close(1000, "User navigated away"); // Normal closure
            }
            this.currentMatchWebSocket = null; // Ensure reference is cleared
            // Decide if you want to clear state immediately on disconnect
            // this.currentMatchState = null;
        },
    },
});
