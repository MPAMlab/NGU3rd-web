// src/store.ts
import { defineStore } from 'pinia';
import * as api from './services/api'; // Import API functions

// --- ALL TYPE DEFINITIONS GO HERE ---

// API Response Wrapper (can be defined here or in api.ts)
export interface ApiResponse<T = any> { // Added export
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Represents the environment variables and bindings (Frontend perspective - less detailed than Worker Env)
export interface FrontendEnv { // Added export
    SONG_COVER_BUCKET_URL?: string; // Base URL for accessing song covers directly from R2
    // Add other frontend-relevant env vars if needed
}

// --- 固定表相关类型 (members, teams) ---
export interface Team { // Added export
    id: number; // D1 auto-increment ID (number)
    code: string; // 4-character manual ID (your team_code)
    name: string; // your team_name
    created_at?: number | null; // Unix timestamp (matching your table)
    // current_health, has_revive_mirror, status 这些是比赛中的状态，由DO管理
    // 如果 teams 表中保留了这些字段，它们可能代表默认值或全局状态，与比赛实时状态区分
    current_health?: number | null;
    has_revive_mirror?: number | null; // 0 or 1
    status?: string | null; // e.g., 'active', 'inactive'
}

export interface Member { // Added export
    id: number; // D1 auto-increment ID (number)
    team_code: string; // FK to teams.code (string)
    color?: string | null; // e.g., 'fire', 'wood', 'water' (assuming D1 stores these strings)
    job?: string | null; // e.g., "绝剑士", "矩盾手", "炼星师"
    maimai_id?: string | null;
    nickname: string; // The player name to display
    qq_number?: string | null;
    avatar_url?: string | null; // Storing filename or full URL? If filename, need R2 binding
    joined_at?: number | null; // Unix timestamp
    updated_at?: number | null; // Unix timestamp
    kinde_user_id?: string | null;
    is_admin?: number | null; // 0 or 1
    // Frontend convenience: Link to team if needed
    // team?: Team;
}

// --- 歌曲相关类型 ---
export interface SongLevel { // Added export // 对应 JSON "等级" 结构
    B?: string; A?: string; E?: string; M?: string; R?: string;
}

// Structure of a song item within the imported JSON array (Admin import payload)
export interface ImportedSongItem { // Added export
    分类: string;
    曲名: string;
    BPM: string;
    等级: SongLevel;
    类型: string;
    封面: string; // 文件名
}

// Payload for the admin song import endpoint
export interface ImportSongsPayload { // Added export
    songs: ImportedSongItem[]; // Array of song items from the JSON
    source_data_version?: string; // Optional version from the JSON
}

export interface Song { // Added export // 对应 D1 songs 表，也是前端主要使用的歌曲类型
    id: number; // D1 auto-increment ID (number)
    title: string;
    category?: string | null;
    bpm?: string | null;
    levels_json?: string | null; // Storing JSON string of SongLevel
    type?: string | null;
    cover_filename?: string | null;
    source_data_version?: string | null;
    created_at?: string;

    // Frontend convenience fields (populated by Worker)
    parsedLevels?: SongLevel; // Parsed levels_json
    fullCoverUrl?: string; // Constructed R2 URL
}

// 用户为特定赛段选择的歌曲偏好 (对应 member_song_preferences 表)
export interface MemberSongPreference { // Added export
    id?: number; // D1 PK (number)
    member_id: number; // FK to members.id (number)
    tournament_stage: string; // e.g., '初赛', '复赛'
    song_id: number; // FK to songs.id (number)
    selected_difficulty: string; // e.g., 'M', 'E' (Difficulty level key)
    created_at?: string;

    // Denormalized song info for display (fetched via JOIN or separate query)
    song_title?: string;
    cover_filename?: string;
    fullCoverUrl?: string;
    parsedLevels?: SongLevel;
}
// Payload for saving a member's song preference (POST /api/member_song_preferences)
export interface SaveMemberSongPreferencePayload { // Added export
    member_id: number;
    tournament_stage: string;
    song_id: number;
    selected_difficulty: string;
}
// --- 比赛核心类型 ---

// 代表比赛歌单中的一首歌及其相关信息 (存储在 tournament_matches.match_song_list_json)
export interface MatchSong { // Added export
    song_id: number; // FK to songs.id (number)
    song_title: string; // Denormalized
    song_difficulty: string; // 实际比赛选择的难度，例如 'M 13' (包含等级和难度值)
    song_element?: 'fire' | 'wood' | 'water' | null; // Denormalized (assuming color maps to element)
    cover_filename?: string | null; // Denormalized
    bpm?: string | null; // Denormalized
    fullCoverUrl?: string; // Denormalized

    // 记录这首歌的来源
    picker_member_id: number; // 选这首歌的选手 ID (number)
    picker_team_id: number;   // 选这首歌的选手所属队伍 ID (number)
    is_tiebreaker_song?: boolean; // 是否为加时赛歌曲

    status: 'pending' | 'ongoing' | 'completed'; // 在这场比赛中的状态

    // 比赛中这首歌的结果 (当 status 为 'completed' 时，DO 会填充这些)
    teamA_player_id?: number; // Team A 出战这首歌的选手 ID (number)
    teamB_player_id?: number; // Team B 出战这首歌的选手 ID (number)
    teamA_percentage?: number; // 完整百分比 (REAL)
    teamB_percentage?: number; // 完整百分比 (REAL)
    teamA_damage_dealt?: number; // (INTEGER)
    teamB_damage_dealt?: number; // (INTEGER)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // 小分调整 (INTEGER)
    teamA_health_after?: number; // 本轮结束后血量 (INTEGER)
    teamB_health_after?: number; // 本轮结束后血量 (INTEGER)
    teamA_mirror_triggered?: boolean; // (INTEGER 0/1) -> boolean in DO state
    teamB_mirror_triggered?: boolean; // (INTEGER 0/1) -> boolean in DO state
}

// Payload for Staff to confirm match setup (PUT /api/tournament_matches/:id/confirm_setup)
export interface ConfirmMatchSetupPayload { // Added export
    team1_player_order: number[]; // member_id 数组 (number[])
    team2_player_order: number[]; // member_id 数组 (number[])
    match_song_list: MatchSong[]; // 这场比赛最终确定的歌单 (MatchSong[])
}

// 赛程表条目 (对应 tournament_matches 表)
export interface TournamentMatch { // Added export
    id: number; // D1 auto-increment ID (number)
    round_name: string; // e.g., '初赛 - 第1轮'
    team1_id: number; // FK to teams.id (number)
    team2_id: number; // FK to teams.id (number)
    status: 'scheduled' | 'pending_song_confirmation' | 'ready_to_start' | 'live' | 'completed' | 'archived'; // Status of the scheduled match entry
    winner_team_id?: number | null; // NULLABLE, FK to teams.id (number)
    match_do_id?: string | null; // NULLABLE, Associated DO ID when live (string, this is the *name* like "match-1")
    scheduled_time?: string | null; // Optional: ISO 8601 string preferred
    created_at: string; // ISO 8601 timestamp
    updated_at?: string; // ISO 8601 timestamp

    // From D1 JSON fields (parsed by Worker)
    team1_player_order?: number[] | null; // member_id 数组 (number[])
    team2_player_order?: number[] | null; // member_id 数组 (number[])
    match_song_list?: MatchSong[] | null; // 这场比赛的歌单 (MatchSong[])

    // Denormalized for display convenience in lists (fetched via JOIN)
    team1_name?: string;
    team2_name?: string;
    winner_team_name?: string;
    team1_code?: string; // Added team codes from JOIN
    team2_code?: string;
    winner_team_code?: string;

    // 比赛结束后的最终结果 (从 D1 final_score_... 读取)
    final_score_team1?: number | null; // (INTEGER)
    final_score_team2?: number | null; // (INTEGER)
}

// Payload for creating a new Tournament Match (POST /api/tournament_matches)
export interface CreateTournamentMatchPayload { // Added export
    round_name: string;
    team1_id: number | null; // Allow null in form state before selection
    team2_id: number | null; // Allow null in form state before selection
    scheduled_time?: string | null;
    // Player order and song list are NOT part of creation payload anymore
}

// DO 的实时状态 (WebSocket 推送的内容)
export interface MatchState { // Added export
    // Note: This match_do_id is the *actual* hex ID of the DO instance, not the name like "match-1"
    match_do_id: string; // (string)
    tournament_match_id: number; // 关联的 D1 tournament_matches.id (number)

    // DO 内部状态，反映当前比赛阶段
    status: 'pending_scores' | 'round_finished' | 'team_A_wins' | 'team_B_wins' | 'draw_pending_resolution' | 'tiebreaker_pending_song' | 'archived';
    // 'pending_scores': 等待当前歌曲的双方成绩
    // 'round_finished': 当前歌曲成绩已计算，等待下一首或比赛结束
    // 'tiebreaker_pending_song': 标准轮次打平，等待 Staff 选择加时赛歌曲
    // 'archived': 比赛已归档
    // 'team_A_wins', 'team_B_wins', 'draw_pending_resolution' are also statuses

    round_name: string; // e.g., '初赛 - 第1轮' (从 TournamentMatch 带过来)
    current_match_song_index: number; // 当前歌单的索引 (0-based) (number)

    teamA_id: number; // (number)
    teamB_id: number; // (number)
    teamA_name: string; // Denormalized
    teamB_name: string; // Denormalized
    teamA_score: number; // 当前血量 (number)
    teamB_score: number; // 当前血量 (number)

    teamA_player_order_ids: number[]; // Ordered member IDs (number[])
    teamB_player_order_ids: number[]; // Ordered member IDs (number[])
    teamA_current_player_id: number | null; // 当前代表A队出战的选手ID (number | null)
    teamB_current_player_id: number | null; // 当前代表B队出战的选手ID (number | null)
    // Denormalized current player info (fetched from teamA_members/teamB_members)
    teamA_current_player_nickname?: string;
    teamB_current_player_nickname?: string;
    teamA_current_player_profession?: string | null; // '绝剑士', '矩盾手', '炼星师'
    teamB_current_player_profession?: string | null; // <-- Added the missing property

    // teamA_members and teamB_members are stored in DO and *are* included in the broadcasted state based on your JSON
    teamA_members: Member[];
    teamB_members: Member[];

    teamA_mirror_available: boolean;
    teamB_mirror_available: boolean;

    match_song_list: MatchSong[]; // 整场比赛的歌单 (MatchSong[])
    current_song: MatchSong | null; // 当前正在进行的歌曲 (match_song_list 中的一项)

    roundSummary: RoundSummary | null; // 上一轮/刚结束的这一轮的计算总结
}

// Payload for submitting scores (Frontend sends percentages)
export interface CalculateRoundPayload { // Added export
    teamA_percentage: number; // e.g., 100.1234 (REAL)
    teamB_percentage: number; // e.g., 98.7654 (REAL)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // 小分调整 (INTEGER)
}

// Payload for resolving a draw (Staff action)
export interface ResolveDrawPayload { // Added export
    winner: 'teamA' | 'teamB'; // 'teamA' or 'teamB' string
}

// Payload for Staff selecting a tiebreaker song (Frontend to Worker)
export interface SelectTiebreakerSongPayload { // Added export
    song_id: number; // FK to songs.id (number)
    selected_difficulty: string; // e.g., 'M', 'E' (Difficulty level key from SongLevel)
}

// 回合总结 (用于展示计算过程和历史记录) - 对应 match_rounds_history 表的部分字段 + 详细计算日志
export interface RoundSummary { // Added export
    round_number_in_match: number; // 这首歌是比赛的第 N 首 (1-based) (INTEGER)
    song_id: number; // (INTEGER)
    song_title: string;
    selected_difficulty: string; // 实际打的难度，例如 'M 13'

    teamA_player_id: number; // (INTEGER)
    teamB_player_id: number; // (INTEGER)
    teamA_player_nickname: string;
    teamB_player_nickname: string;

    teamA_percentage: number; // (REAL)
    teamB_percentage: number; // (REAL)
    teamA_effect_value_applied: number; // 小分调整 (INTEGER)
    teamB_effect_value_applied: number; // 小分调整 (INTEGER)

    // 详细计算步骤 (来自 DO 内部逻辑)
    teamA_damage_digits: number[]; // (number[])
    teamB_damage_digits: number[]; // (number[])
    teamA_base_damage: number; // (number)
    teamB_base_damage: number; // (number)
    teamA_profession?: string | null; // Player profession
    teamB_profession?: string | null;
    teamA_profession_effect_applied?: string; // e.g., "Attacker: +5 damage"
    teamB_profession_effect_applied?: string;
    teamA_modified_damage_to_B: number; // Damage A deals to B after A's profession effect (number)
    teamB_modified_damage_to_A: number; // Damage B deals to A after B's profession effect (number)

    teamA_health_before_round: number; // Health at start of this round (number)
    teamB_health_before_round: number; // Health at start of this round (number)

    teamA_mirror_triggered: boolean; // (boolean)
    teamB_mirror_triggered: boolean; // (boolean)
    teamA_mirror_effect_applied?: string; // e.g., "Defender: Reflected 10 damage"
    teamB_mirror_effect_applied?: string;
    teamA_supporter_base_skill_heal?: number; // Heal from supporter base skill (number)
    teamB_supporter_base_skill_heal?: number; // Heal from supporter base skill (number)
    teamA_supporter_mirror_bonus_heal?: number; // Heal from supporter mirror bonus (number)
    teamB_supporter_mirror_bonus_heal?: number; // Heal from supporter mirror bonus (number)

    teamA_final_damage_dealt: number; // Total damage A caused to B (incl. attacker/defender mirror) (number)
    teamB_final_damage_dealt: number; // Total damage B caused to A (incl. attacker/defender mirror) (number)

    teamA_health_change: number; // Total health change for A this round (number)
    teamB_health_change: number; // Total health change for B this round (number)
    teamA_health_after: number; // Health after this round (number)
    teamB_health_after: number; // Health after this round (number)

    is_tiebreaker_song?: boolean; // Whether this round was a tiebreaker (boolean)

    log?: string[]; // Optional detailed calculation log
}

// Type for a single historical round record fetched from /api/match_history
export interface MatchHistoryRound { // Added export
    id: number; // match_rounds_history PK
    tournament_match_id: number;
    match_do_id: string; // Actual DO hex ID
    round_number_in_match: number;
    song_id: number | null;
    selected_difficulty: string | null;
    picker_team_id: number | null;
    picker_member_id: number | null;
    team1_member_id: number | null;
    team2_member_id: number | null;
    team1_percentage: number | null;
    team2_percentage: number | null;
    team1_damage_dealt: number | null;
    team2_damage_dealt: number | null;
    team1_health_change: number | null;
    team2_health_change: number | null;
    team1_health_before: number | null;
    team2_health_before: number | null;
    team1_health_after: number | null;
    team2_health_after: number | null;
    team1_mirror_triggered: number | null; // D1 stores 0/1
    team2_mirror_triggered: number | null; // D1 stores 0/1
    team1_effect_value: number | null;
    team2_effect_value: number | null;
    is_tiebreaker_song: number | null; // D1 stores 0/1
    recorded_at: string;
    round_summary_json: string | null; // Raw JSON string from D1

    // Denormalized fields from JOINs
    song_title?: string | null;
    cover_filename?: string | null;
    picker_team_name?: string | null;
    picker_member_nickname?: string | null;
    team1_member_nickname?: string | null;
    team2_member_nickname?: string | null;

    // Frontend convenience
    round_summary?: RoundSummary | null; // Parsed RoundSummary
    fullCoverUrl?: string; // Constructed R2 URL
}

// Type for a single historical match fetched from /api/match_history
export interface MatchHistoryMatch { // Added export
    id: number; // tournament_matches PK
    round_name: string;
    scheduled_time: string | null;
    status: 'completed' | 'archived'; // History only shows these statuses
    final_score_team1: number | null;
    final_score_team2: number | null;

    // Denormalized fields from JOINs
    team1_name?: string;
    team2_name?: string;
    winner_team_name?: string;

    // Associated rounds
    rounds: MatchHistoryRound[];
}

// API Payloads (matching backend) - Already defined above, but listed here for clarity
// export interface CreateTournamentMatchPayload { ... }
// export interface ConfirmMatchSetupPayload { ... }
// export interface CalculateRoundPayload { ... }
// export interface ResolveDrawPayload { ... }
// export interface SelectTiebreakerSongPayload { ... }
// export interface SaveMemberSongPreferencePayload { ... }

export type InternalProfession = 'attacker' | 'defender' | 'supporter' | null; // Added export


// --- NEW TYPES FOR PAGINATION AND SONG FILTERS ---

export interface PaginationInfo { // Added export
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// Specific response data structure for GET /api/songs
export interface SongsApiResponseData { // Added export
    songs: Song[]; // Array of songs for the current page
    pagination: PaginationInfo; // Pagination metadata
}

// Specific response data structure for GET /api/songs/filters
export interface SongFiltersApiResponseData { // Added export
    categories: string[];
    types: string[];
}


// --- PINIA STORE STATE INTERFACE ---
export interface AppState { // Added export
    teams: Team[];
    members: Member[];
    songs: Song[]; // This will now hold songs for the *current page*
    songPagination: PaginationInfo | null; // New: Pagination info for songs
    songFilterOptions: { categories: string[], types: string[] }; // New: Filter options for songs
    tournamentMatches: TournamentMatch[];
    currentMatchState: MatchState | null; // The live match state from DO/WebSocket
    matchHistory: MatchHistoryMatch[];
    memberSongPreferences: MemberSongPreference[];
    isLoading: {
        teams: boolean;
        members: boolean;
        songs: boolean;
        songFilters: boolean; // New: Loading state for filter options
        tournamentMatches: boolean;
        currentMatch: boolean; // Loading state for fetching initial match state
        matchHistory: boolean;
        memberSongPreferences: boolean;
        [key: string]: boolean; // For generic loading states
    };
    error: string | null;
    currentMatchWebSocket: WebSocket | null; // The active WebSocket connection
    connectedDoName: string | null; // The DO name (e.g., "match-1") the WebSocket is connected to
}

// --- PINIA STORE DEFINITION ---
export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        teams: [],
        members: [],
        songs: [],
        songPagination: null,
        songFilterOptions: { categories: [], types: [] },
        tournamentMatches: [],
        currentMatchState: null,
        matchHistory: [],
        memberSongPreferences: [],
        isLoading: {
            teams: false, members: false, songs: false,
            songFilters: false,
            tournamentMatches: false,
            currentMatch: false, matchHistory: false, memberSongPreferences: false,
        },
        error: null,
        currentMatchWebSocket: null,
        connectedDoName: null, // Initialize new state property
    }),

    actions: {
        // --- Generic Loading and Error Handling ---
        setLoading(key: string, value: boolean) {
            // Ensure the key exists in isLoading or allow adding new keys
            if (this.isLoading.hasOwnProperty(key)) {
                 this.isLoading[key] = value;
            } else {
                 // If you want to allow dynamic keys, cast to any or define index signature
                 (this.isLoading as any)[key] = value;
            }
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

        /**
         * Fetches songs from the backend with filters and pagination.
         */
        async fetchSongs(params: { category?: string; type?: string; search?: string; page?: number; limit?: number } = {}) {
            this.setLoading('songs', true);
            this.clearError();
            try {
                const requestParams = {
                    ...params,
                    page: params.page || 1,
                    limit: params.limit || 20
                };
                Object.keys(requestParams).forEach(key => {
                    const value = requestParams[key as keyof typeof requestParams];
                    if (value === undefined || value === null || value === '') {
                        delete requestParams[key as keyof typeof requestParams];
                    }
                });

                const response = await api.fetchSongs(requestParams);

                if (response.success && response.data) {
                    this.songs = response.data.songs;
                    this.songPagination = response.data.pagination;
                } else {
                    throw new Error(response.error || 'Failed to fetch songs');
                }
            } catch (err: any) {
                console.error("Store: Error fetching songs:", err);
                this.setError(err.message || 'An unknown error occurred while fetching songs');
                this.songs = [];
                this.songPagination = null;
            } finally {
                this.setLoading('songs', false);
            }
        },

        /**
         * Fetches distinct categories and types for filter dropdowns.
         */
        async fetchSongFilterOptions() {
            this.setLoading('songFilters', true);
            try {
                const response = await api.fetchSongFilterOptions();
                 if (response.success && response.data) {
                     this.songFilterOptions = response.data;
                 } else {
                     throw new Error(response.error || 'Failed to fetch filter options');
                 }
            } catch (err: any) {
                 console.error("Store: Error fetching song filter options:", err);
                 // Optionally set an error, but avoid overwriting a song fetch error
                 // this.setError(`Failed to load filter options: ${err.message}`);
            } finally {
                 this.setLoading('songFilters', false);
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
            console.log(`[Store HTTP] Attempting to fetch initial match state for DO: ${doId}`); // <-- Added log
            try {
                const response = await api.fetchMatchState(doId);
                if (response.success && response.data) {
                    this.currentMatchState = response.data;
                    console.log(`[Store HTTP] Successfully fetched initial match state for DO ${doId}:`, this.currentMatchState); // <-- Added log
                } else {
                    this.setError(response.error || `Failed to fetch match state for ${doId}`);
                    this.currentMatchState = null;
                    console.error(`[Store HTTP] Failed to fetch match state for DO ${doId}:`, response.error); // <-- Added log
                }
            } catch (err: any) {
                this.setError(err.message);
                this.currentMatchState = null;
                console.error(`[Store HTTP] Exception fetching match state for DO ${doId}:`, err); // <-- Added log
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
                    this.tournamentMatches.unshift(response.data);
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
                    const index = this.tournamentMatches.findIndex(m => m.id === matchId);
                    if (index !== -1) {
                        this.tournamentMatches[index].status = 'live';
                        this.tournamentMatches[index].match_do_id = response.data.match_do_id; // This match_do_id is the *name*
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
        async calculateRound(doId: string, payload: CalculateRoundPayload) {
            this.clearError();
            try {
                const response = await api.calculateRound(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to calculate round');
                }
                return response; // Return the full response for component to check success
            } catch (err: any) {
                this.setError(err.message);
                return { success: false, error: err.message }; // Return structured error
            }
        },

        async nextRound(doId: string) {
            this.clearError();
            try {
                const response = await api.nextRound(doId);
                if (!response.success) {
                    this.setError(response.error || 'Failed to advance to next round');
                }
                 return response; // Return the full response
            } catch (err: any) {
                this.setError(err.message);
                 return { success: false, error: err.message };
            }
        },

        async selectTiebreakerSong(doId: string, payload: SelectTiebreakerSongPayload) {
            this.clearError();
            try {
                const response = await api.selectTiebreakerSong(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to select tiebreaker song');
                }
                 return response; // Return the full response
            } catch (err: any) {
                this.setError(err.message);
                 return { success: false, error: err.message };
            }
        },

        async resolveDraw(doId: string, payload: ResolveDrawPayload) {
            this.clearError();
            try {
                const response = await api.resolveDraw(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to resolve draw');
                }
                 return response; // Return the full response
            } catch (err: any) {
                this.setError(err.message);
                 return { success: false, error: err.message };
            }
        },

        async archiveMatch(doId: string) {
            this.clearError();
            try {
                const response = await api.archiveMatch(doId);
                if (response.success) {
                    // Clear current match state as it's archived
                    this.currentMatchState = null;
                    // Refresh lists that might show this match
                    this.fetchTournamentMatches();
                    this.fetchMatchHistory();
                } else {
                    this.setError(response.error || 'Failed to archive match');
                }
                 return response; // Return the full response
            } catch (err: any) {
                this.setError(err.message);
                 return { success: false, error: err.message };
            }
        },

        async saveMemberSongPreference(payload: SaveMemberSongPreferencePayload) {
            this.clearError();
            try {
                const response = await api.saveMemberSongPreference(payload);
                if (response.success && response.data) {
                    // Update or add the preference in the state list
                    const index = this.memberSongPreferences.findIndex(p =>
                        p.member_id === payload.member_id &&
                        p.tournament_stage === payload.tournament_stage &&
                        p.song_id === payload.song_id &&
                        p.selected_difficulty === payload.selected_difficulty
                    );
                     if (index !== -1) {
                         this.memberSongPreferences[index] = response.data;
                     } else {
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

        // --- WebSocket Management ---
        connectWebSocket(doId: string) {
            // doId here is the DO *name* from the route (e.g., "match-1")

            // Check if a connection already exists for this specific DO name
            if (this.currentMatchWebSocket && this.connectedDoName === doId) {
                 if (this.currentMatchWebSocket.readyState === WebSocket.OPEN || this.currentMatchWebSocket.readyState === WebSocket.CONNECTING) {
                     console.log(`[Store WS] WebSocket already open or connecting for DO name: ${doId}.`);
                     return; // Already connected to the correct DO
                 }
            }

            // If a connection exists but for a different DO, or it's closed/closing, close it
            if (this.currentMatchWebSocket) {
                 console.log(`[Store WS] WebSocket exists (State: ${this.currentMatchWebSocket.readyState}). Closing existing connection for ${this.connectedDoName || 'unknown DO'}.`);
                 this.currentMatchWebSocket.close(1000, "New connection requested");
                 this.currentMatchWebSocket = null;
                 this.connectedDoName = null;
            }

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = window.location.host;
            // Use the DO name from the route in the WebSocket URL
            const wsUrl = `${wsProtocol}//${wsHost}/api/live-match/${doId}/websocket`;

            console.log(`[Store WS] Attempting to connect WebSocket to: ${wsUrl} for DO name: ${doId}`); // <-- Added log
            this.currentMatchWebSocket = new WebSocket(wsUrl);
            this.connectedDoName = doId; // Store the name we are trying to connect to

            this.currentMatchWebSocket.onopen = () => {
                console.log(`[Store WS] WebSocket connected successfully for DO name: ${doId}!`); // <-- Added log
                this.clearError();
                // The DO is expected to send the initial state upon connection
            };

            this.currentMatchWebSocket.onmessage = (event) => {
                console.log(`[Store WS] WebSocket message received for DO name ${doId}:`, event.data); // <-- Added log

                try {
                    const data = JSON.parse(event.data as string);
                    console.log(`[Store WS] Parsed WebSocket message for DO name ${doId}:`, data); // <-- Added log

                    // Check if the received data is the expected MatchState structure
                    // We assume messages on this specific WS connection are for the connected DO.
                    // Check for key properties of MatchState like status and tournament_match_id
                    // Also check if the match_do_id in the received data matches the *actual* DO ID
                    // The DO sends its actual hex ID in the state, not the name from the URL.
                    // We need to compare data.match_do_id (hex ID) with the match_do_id stored in currentMatchState
                    // which was obtained from the startLiveMatch API call.
                    // However, initially currentMatchState might be null.
                    // A simpler check is to see if it looks like a MatchState object.
                    // The DO name from the URL is only used to establish the connection.
                    // The state object itself contains the actual DO hex ID.

                    if (data && typeof data === 'object' && data.status !== undefined && data.tournament_match_id !== undefined && data.match_do_id !== undefined) {
                         // Optional: Add a check if the received tournament_match_id matches the one we expect
                         // This might require storing the tournament_match_id in the store state as well
                         // if (this.currentMatchState?.tournament_match_id !== undefined && data.tournament_match_id !== this.currentMatchState.tournament_match_id) {
                         //     console.warn(`[Store WS] Received message for unexpected tournament_match_id. Ignoring.`);
                         //     return;
                         // }

                         console.log(`[Store WS] Received valid MatchState update for DO name ${doId}. Updating state.`); // <-- Added log
                         this.currentMatchState = data as MatchState; // <-- Critical step: Update state
                         this.clearError(); // Clear any previous WS error on successful message
                    } else if (data && data.error) {
                        console.error(`[Store WS] WebSocket received error message for DO name ${doId}:`, data.error); // <-- Added log
                        this.setError(`Live match error: ${data.error}`); // Set error state based on backend message
                    }
                    else {
                        console.warn(`[Store WS] WebSocket received unknown message structure for DO name ${doId}:`, data); // <-- Added log
                        // Handle other message types if your DO sends them
                    }
                } catch (e: any) {
                    console.error(`[Store WS] Failed to parse WebSocket message JSON for DO name ${doId}:`, e); // <-- Added log
                    this.setError('Failed to process live match data from server.'); // Set error state
                }
            };

            this.currentMatchWebSocket.onerror = (error) => {
                console.error(`[Store WS] WebSocket error for DO name ${doId}:`, error); // <-- Added log
                this.setError('WebSocket connection error. Please refresh or check match status.'); // Set error state
                // Clean up on error
                this.currentMatchWebSocket = null;
                this.connectedDoName = null;
            };

            this.currentMatchWebSocket.onclose = (event) => {
                console.log(`[Store WS] WebSocket closed for DO name ${doId}. Code: ${event.code}, Reason: ${event.reason}`); // <-- Added log
                if (!event.wasClean) {
                    console.error(`[Store WS] WebSocket connection died unexpectedly for DO name ${doId}`);
                    // Only set error if it wasn't a clean close (code 1000 or 1001)
                    if (event.code !== 1000 && event.code !== 1001) {
                         this.setError(`WebSocket disconnected unexpectedly (Code: ${event.code}).`);
                    }
                }
                this.currentMatchWebSocket = null;
                this.connectedDoName = null;
                // Optionally attempt to reconnect after a delay if appropriate (e.g., if code is not 1000/1001)
            };
        },

        disconnectWebSocket() {
            if (this.currentMatchWebSocket && this.currentMatchWebSocket.readyState === WebSocket.OPEN) {
                console.log(`[Store WS] Closing WebSocket for DO name: ${this.connectedDoName || 'unknown'}`); // <-- Added log
                // Use standard close code 1000 for normal closure
                this.currentMatchWebSocket.close(1000, "User navigated away");
            } else {
                 console.log(`[Store WS] WebSocket not open, nothing to close.`); // <-- Added log
            }
            this.currentMatchWebSocket = null;
            this.connectedDoName = null;
        },
    },
});
