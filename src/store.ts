// src/store.ts

import { defineStore } from 'pinia';
import * as api from './services/api';
import { useKindeAuth } from '@/composables/useKindeAuth';

// --- ALL FRONTEND TYPE DEFINITIONS GO HERE ---

// API Response Wrapper (Defined here for frontend use)
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Basic Kinde User Info (from ID token payload, returned by backend callback)
export interface KindeUser {
    id: string; // Kinde User ID (sub claim)
    email?: string;
    name?: string; // Or other name claims like given_name, family_name
    // Add other claims you might need from the ID token
}

// Represents the environment variables and bindings (Frontend perspective - less detailed than Worker Env)
export interface FrontendEnv {
    SONG_COVER_BUCKET_URL?: string; // Base URL for accessing song covers directly from R2
    // Add other frontend-relevant env vars if needed
}

// --- 固定表相关类型 (members, teams) ---
export interface Team {
    id: number; // D1 auto-increment ID (number)
    code: string; // 4-character manual ID (your team_code)
    name: string; // your team_name
    created_at?: number | null; // Unix timestamp (matching your table)
    current_health?: number | null;
    has_revive_mirror?: number | null; // 0 or 1
    status?: string | null; // e.g., 'active', 'inactive'
}

export interface Member {
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
    kinde_user_id: string | null; // <-- CONFIRMED
    is_admin: number | null; // <-- CONFIRMED
    // Frontend convenience: Link to team if needed
    // team?: Team;
}

// --- 歌曲相关类型 ---
// Corrected: Levels are strings like "13.0", "13.5"
export interface SongLevel { // 对应 JSON "等级" 结构
    B?: string; A?: string; E?: string; M?: string; R?: string;
}

// Structure of a song item within the imported JSON array (Admin import payload)
export interface ImportedSongItem {
    分类: string;
    曲名: string;
    BPM: string;
    等级: SongLevel;
    类型: string;
    封面: string; // 文件名
}

// Payload for the admin song import endpoint
export interface ImportSongsPayload {
    songs: ImportedSongItem[]; // Array of song items from the JSON
    source_data_version?: string; // Optional version from the JSON
}

export interface Song { // 对应 D1 songs 表，也是前端主要使用的歌曲类型
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
export interface MemberSongPreference {
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
export interface SaveMemberSongPreferencePayload {
    member_id: number;
    tournament_stage: string;
    song_id: number;
    selected_difficulty: string;
}
// --- 比赛核心类型 (初赛/决赛) ---

// 代表比赛歌单中的一首歌及其相关信息 (存储在 tournament_matches.match_song_list_json)
export interface MatchSong {
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
    teamB_percentage?: number; // (REAL)
    teamA_damage_dealt?: number; // (INTEGER)
    teamB_damage_dealt?: number; // (INTEGER)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // (INTEGER)
    teamA_health_after?: number; // 本轮结束后血量 (INTEGER)
    teamB_health_after?: number; // (INTEGER)
    teamA_mirror_triggered?: boolean; // (INTEGER 0/1) -> boolean in DO state
    teamB_mirror_triggered?: boolean; // (INTEGER 0/1) -> boolean in DO state
}

// Payload for Staff to confirm match setup (PUT /api/tournament_matches/:id/confirm_setup)
export interface ConfirmMatchSetupPayload {
    team1_player_order: number[]; // member_id 数组 (number[])
    team2_player_order: number[]; // (number[])
    match_song_list: MatchSong[]; // 这场比赛最终确定的歌单 (MatchSong[])
}

// 赛程表条目 (对应 tournament_matches 表 - 初赛/决赛)
export interface TournamentMatch {
    id: number; // D1 auto-increment ID (number)
    round_name: string; // e.g., '初赛 - 第1轮', '决赛'
    team1_id: number; // FK to teams.id (number)
    team2_id: number; // FK to teams.id (number)
    status: 'scheduled' | 'pending_song_confirmation' | 'ready_to_start' | 'live' | 'completed' | 'archived'; // Status of the scheduled match entry
    winner_team_id?: number | null; // NULLABLE, FK to teams.id (number)
    match_do_id?: string | null; // NULLABLE, Associated DO ID when live (string, this is the *name* like "match-1")
    scheduled_time?: string | null; // Optional: ISO 8601 string preferred
    created_at: string; // ISO 8601 timestamp
    updated_at?: string; // ISO 8601 timestamp

    // From D1 JSON fields (parsed by Worker)
    team1_player_order_json?: string | null; // Raw JSON string
    team2_player_order_json?: string | null; // Raw JSON string
    match_song_list_json?: string | null; // Raw JSON string

    // Frontend convenience fields (parsed from JSON or fetched via JOIN)
    team1_player_order?: number[] | null; // member_id 数组 (number[])
    team2_player_order?: number[] | null; // (number[])
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
export interface CreateTournamentMatchPayload {
    round_name: string;
    team1_id: number | null; // Allow null in form state before selection
    team2_id: number | null; // Allow null in form state before selection
    scheduled_time?: string | null;
    // Player order and song list are NOT part of creation payload anymore
}

// DO 的实时状态 (WebSocket 推送的内容)
export interface MatchState {
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
    teamB_score: number; // (number)

    teamA_player_order_ids: number[]; // Ordered member IDs (number[])
    teamB_player_order_ids: number[]; // (number[])
    teamA_current_player_id: number | null; // 当前代表A队出战的选手ID (number | null)
    teamB_current_player_id: number | null; // (number | null)
    // Denormalized current player info (fetched from teamA_members/teamB_members)
    teamA_current_player_nickname?: string;
    teamB_current_player_nickname?: string;
    teamA_current_player_profession?: string | null; // '绝剑士', '矩盾手', '炼星师'
    teamB_current_player_profession?: string | null;

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
export interface CalculateRoundPayload {
    teamA_percentage: number; // e.g., 100.1234 (REAL)
    teamB_percentage: number; // e.g., 98.7654 (REAL)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // (INTEGER)
}

// Payload for resolving a draw (Staff action)
export interface ResolveDrawPayload {
    winner: 'teamA' | 'teamB'; // 'teamA' or 'teamB' string
}

// Payload for Staff selecting a tiebreaker song (Frontend to Worker)
export interface SelectTiebreakerSongPayload {
    song_id: number; // FK to songs.id (number)
    selected_difficulty: string; // e.g., 'M', 'E' (Difficulty level key)
}

// 回合总结 (用于展示计算过程和历史记录) - 对应 match_rounds_history 表的部分字段 + 详细计算日志
export interface RoundSummary {
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
    teamB_effect_value_applied: number; // (INTEGER)

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
    teamB_health_before_round: number; // (number)

    teamA_mirror_triggered: boolean; // (boolean)
    teamB_mirror_triggered: boolean; // (boolean)
    teamA_mirror_effect_applied?: string; // e.g., "Defender: Reflected 10 damage"
    teamB_mirror_effect_applied?: string;
    teamA_supporter_base_skill_heal?: number; // Heal from supporter base skill (number)
    teamB_supporter_base_skill_heal?: number; // (number)
    teamA_supporter_mirror_bonus_heal?: number; // Heal from supporter mirror bonus (number)
    teamB_supporter_mirror_bonus_heal?: number; // (number)

    teamA_final_damage_dealt: number; // Total damage A caused to B (incl. attacker/defender mirror) (number)
    teamB_final_damage_dealt: number; // (number)

    teamA_health_change: number; // Total health change for A this round (number)
    teamB_health_change: number; // (number)
    teamA_health_after: number; // Health after this round (number)
    teamB_health_after: number; // (number)

    is_tiebreaker_song?: boolean; // Whether this round was a tiebreaker (boolean)

    log?: string[]; // Optional detailed calculation log
}

// Type for a single historical round record fetched from /api/match_history
export interface MatchHistoryRound {
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
    team2_mirror_triggered: number | null; // (INTEGER 0/1)
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
export interface MatchHistoryMatch {
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

export type InternalProfession = 'attacker' | 'defender' | 'supporter' | null;


// --- NEW TYPES FOR PAGINATION AND SONG FILTERS ---

export interface PaginationInfo {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// Specific response data structure for GET /api/songs
export interface SongsApiResponseData {
    songs: Song[]; // Array of songs for the current page
    pagination: PaginationInfo; // Pagination metadata
}

// Specific response data structure for GET /api/songs/filters
// Corrected: Added levels and difficulties arrays
export interface SongFiltersApiResponseData {
    categories: string[];
    types: string[];
    levels: string[]; // Added
    difficulties: string[]; // Added
}

// Define NEW types needed for the frontend user match selection view
// Represents a player's song selections and order for a specific match (matches the DB table)
export interface MatchPlayerSelectionFrontend { // Frontend representation of player selection
    id?: number; // D1 PK
    tournament_match_id: number;
    member_id: number;
    team_id: number;
    song1_id: number;
    song1_difficulty: string;
    song2_id: number;
    song2_difficulty: string;
    selected_order_index: number; // 0-based index (0 for 1st, 1 for 2nd, etc.)
    created_at?: string;
    updated_at?: string;
    // Frontend convenience fields (populated by Worker) - These should come from the backend now
    song1_title?: string; // <-- Should be populated by backend
    song2_title?: string; // <-- Should be populated by backend
    song1_fullCoverUrl?: string; // <-- Should be populated by backend
    song2_fullCoverUrl?: string; // <-- Should be populated by backend
    song1_parsedLevels?: SongLevel; // <-- Should be populated by backend
    song2_parsedLevels?: SongLevel; // <-- Should be populated by backend
    member_nickname?: string; // <-- Should be populated by backend
    team_name?: string; // <-- Should be populated by backend
}

// Payload for saving a player's match selection (Frontend sends this)
export interface SaveMatchPlayerSelectionPayloadFrontend {
    song1_id: number;
    song1_difficulty: string;
    song2_id: number;
    song2_difficulty: string;
    selected_order_index: number;
}

// Data structure received by the frontend for the user match selection view (GET /api/member/match-selection/:matchId)
// Corrected: Match type now includes round_name, team1_name, team2_name
export interface FetchUserMatchSelectionDataFrontend {
    match: TournamentMatch; // Basic match info (now includes names)
    myTeam: Team;
    opponentTeam: Team;
    myTeamMembers: Member[]; // Full member list for user's team
    opponentTeamMembers: Member[]; // Full member list for opponent's members
    mySelection: MatchPlayerSelectionFrontend | null; // User's existing selection (now includes song details)
    // Occupied indices need member_id and nickname for frontend display
    occupiedOrderIndices: { team_id: number; selected_order_index: number; member_id: number; member_nickname?: string }[];
    availableOrderSlotsCount: number; // Total number of slots available per team (e.g., 3 for 3v3)
    // REMOVED: song1Details, song2Details - These details are now expected to be *within* mySelection
}

// Data structure received by the frontend for checking selection status (Staff view) (GET /api/tournament_matches/:matchId/selection-status)
export interface MatchSelectionStatusFrontend {
    matchId: number;
    isReadyToCompile: boolean; // True if all players have selected
    team1Status: {
        teamId: number;
        teamName: string;
        requiredSelections: number; // Number of players expected
        completedSelections: number; // Number of players who have selected
        missingMembers: { id: number; nickname: string }[]; // List of members missing selections
    };
    team2Status: {
        teamId: number;
        teamName: string;
        requiredSelections: number;
        completedSelections: number;
        missingMembers: { id: number; nickname: string }[];
    };
}

// Data structure received by the frontend after compiling match setup (Staff view) (POST /api/tournament_matches/:matchId/compile-setup)
export interface CompileMatchSetupResponseFrontend {
    success: boolean;
    message: string;
    tournamentMatch?: TournamentMatch; // Optional: return the updated match
}


// --- NEW TYPES FOR SEMIFINAL MATCHES (Frontend) ---

// Player Profession Type (Frontend) - Must match backend string values
export type Profession = '矩盾手' | '炼星师' | '绝剑士';

// Semifinal Score Calculation Result (Frontend) - Must match backend structure
export interface SemifinalScoreResult {
  id: number;
  nickname: string;
  profession: Profession;
  originalScore: number; // 原始得分（小数点后四位）
  bonusScore: number; // 职业技能加成
  totalScore: number; // 最终得分
  log: string[]; // 计分日志
}

// Semifinal Match Table Structure (Frontend) - Must match backend structure + frontend convenience
export interface SemifinalMatch {
    id: number;
    round_name: string;
    player1_id: number; // FK to members.id
    player2_id: number; // FK to members.id
    status: 'scheduled' | 'completed' | 'archived'; // Status of the semifinal match
    scheduled_time?: string | null; // Optional: ISO 8601 string
    winner_player_id?: number | null; // NULLABLE, FK to members.id
    player1_percentage?: number | null; // NULLABLE until submitted
    player2_percentage?: number | null; // NULLABLE until submitted
    player1_profession?: Profession | null; // NULLABLE until submitted
    player2_profession?: Profession | null; // NULLABLE until submitted
    final_score_player1?: number | null; // NULLABLE until calculated
    final_score_player2?: number | null; // NULLABLE until calculated
    results_json?: string | null; // Raw JSON blob (backend sends this)

    -- Denormalized fields from JOINs for convenience (backend sends these)
    player1_nickname?: string;
    player2_nickname?: string;
    winner_player_nickname?: string;

    -- Frontend convenience (parsed from JSON)
    results?: { // Parsed results_json
        player1: SemifinalScoreResult;
        player2: SemifinalScoreResult;
    } | null;
}

// Payload for creating a new Semifinal Match (Frontend form -> Backend API)
export interface CreateSemifinalMatchPayloadFrontend {
    round_name: string;
    player1_id: number | null; // Allow null in form state before selection
    player2_id: number | null; // Allow null in form state before selection
    scheduled_time?: string | null;
}

// Payload for submitting Semifinal Scores (Frontend -> Backend API)
export interface SubmitSemifinalScoresPayload {
    player1: {
        id: number;
        profession: Profession;
        percentage: number;
    };
    player2: {
        id: number;
        profession: Profession;
        percentage: number;
    };
}

// Response from submitting Semifinal Scores (Backend API -> Frontend)
export interface SubmitSemifinalScoresResponse {
    success: boolean;
    message: string;
    semifinalMatch?: SemifinalMatch; // Return the updated match data
}


// --- PINIA STORE STATE INTERFACE ---
export interface AppState {
    teams: Team[];
    members: Member[];
    songs: Song[]; // This will now hold songs for the *current page*
    songPagination: PaginationInfo | null; // New: Pagination info for songs
    // Corrected: songFilterOptions type now includes levels and difficulties
    songFilterOptions: SongFiltersApiResponseData; // New: Filter options for songs
    tournamentMatches: TournamentMatch[]; // For Qualifier/Final
    semifinalMatches: SemifinalMatch[]; // <-- ADDED: For Semifinals
    currentMatchState: MatchState | null; // For LiveMatch (DO-based)
    currentSemifinalMatch: SemifinalMatch | null; // <-- ADDED: For LiveMatchSecond (DB-based)

    matchHistory: MatchHistoryMatch[];
    memberSongPreferences: MemberSongPreference[];

    // --- NEW STATE FOR USER MATCHES AND SELECTION ---
    userMatches: TournamentMatch[] | null; // 新增：存储用户队伍的比赛列表 (Assuming userMatches only shows TournamentMatch, not SemifinalMatch)
    // Data fetched for the specific match selection page
    upcomingMatchForSelection: FetchUserMatchSelectionDataFrontend | null;
    // User's own selection (redundant with upcomingMatchForSelection.mySelection but potentially useful)
    userMatchSelection: MatchPlayerSelectionFrontend | null; // This will be populated from upcomingMatchForSelection.mySelection
    // Occupied indices for display (redundant with upcomingMatchForSelection.occupiedOrderIndices but kept for consistency with original AppState)
    occupiedOrderIndices: { team_id: number; selected_order_index: number; member_id: number; member_nickname?: string }[];
    availableOrderSlotsCount: number;
    // REMOVED: allSongsForPicker: Song[]; // No longer needed if picker uses paginated fetch

    isLoading: {
        teams: boolean;
        members: boolean;
        songs: boolean; // Used for both Songs view and Picker dialog
        songFilters: boolean; // New: Loading state for filter options
        tournamentMatches: boolean; // For Qualifier/Final
        semifinalMatches: boolean; // <-- ADDED: For Semifinals
        currentMatch: boolean; // Loading state for fetching initial match state (DO)
        currentSemifinalMatch: boolean; // <-- ADDED: Loading state for fetching semifinal match state (DB)
        matchHistory: boolean;
        memberSongPreferences: boolean;
        // --- NEW LOADING STATES ---
        userMatches: boolean; // 新增：用户比赛列表加载状态
        userMatchSelection: boolean; // Loading state for fetching user selection data
        savingMatchSelection: boolean; // Loading state for saving user selection
        checkingMatchSelectionStatus: boolean; // Loading state for staff status check
        compilingMatchSetup: boolean; // Loading state for staff compilation
        // REMOVED: allSongsForPicker: boolean;
        creatingSemifinalMatch: boolean; // <-- ADDED
        submittingSemifinalResults: boolean; // <-- ADDED
        archivingSemifinalMatch: boolean; // <-- ADDED
        [key: string]: boolean; // For generic loading states
    };
    error: string | null;
    currentMatchWebSocket: WebSocket | null; // The active WebSocket connection
    connectedDoName: string | null; // The DO name (e.g., "match-1") the WebSocket is connected to

    // --- Kinde Auth State (from composable) ---
    isAuthenticated: boolean; // Reactive state from useKindeAuth
    kindeUser: KindeUser | null; // Reactive state from useKindeAuth
    userMember: Member | null; // Reactive state from useKindeAuth
    isAdminUser: boolean; // Reactive state from useKindeAuth
}


// --- PINIA STORE DEFINITION ---
export const useAppStore = defineStore('app', {
    state: (): AppState => {
        // Get reactive state directly from the composable
        // Pinia will automatically unwrap these refs
        const { isAuthenticated, kindeUser, userMember, isAdminUser } = useKindeAuth();

        return {
            teams: [],
            members: [],
            songs: [], // Will hold paginated songs
            songPagination: null, // Will hold pagination info
            songFilterOptions: { categories: [], types: [], levels: [], difficulties: [] }, // Initialize with empty arrays
            tournamentMatches: [], // For Qualifier/Final
            semifinalMatches: [], // <-- ADDED
            currentMatchState: null, // For DO matches
            currentSemifinalMatch: null, // <-- ADDED for Semifinal matches

            matchHistory: [],
            memberSongPreferences: [],

            // --- NEW STATE INITIALIZATION ---
            userMatches: null, // Assuming userMatches only shows TournamentMatch
            upcomingMatchForSelection: null,
            userMatchSelection: null, // Will be populated from upcomingMatchForSelection
            occupiedOrderIndices: [],
            availableOrderSlotsCount: 0,
            // REMOVED: allSongsForPicker: [],

            isLoading: {
                teams: false, members: false, songs: false,
                songFilters: false,
                tournamentMatches: false,
                semifinalMatches: false, // <-- ADDED
                currentMatch: false, // DO match
                currentSemifinalMatch: false, // <-- ADDED Semifinal match
                matchHistory: false, memberSongPreferences: false,
                // --- NEW LOADING STATES INITIALIZATION ---
                userMatches: false,
                userMatchSelection: false,
                savingMatchSelection: false,
                checkingMatchSelectionStatus: false,
                compilingMatchSetup: false,
                // REMOVED: allSongsForPicker: false,
                creatingSemifinalMatch: false, // <-- ADDED
                submittingSemifinalResults: false, // <-- ADDED
                archivingSemifinalMatch: false, // <-- ADDED
            },
            error: null,
            currentMatchWebSocket: null,
            connectedDoName: null,

            // --- Kinde Auth State ---
            // Assign the reactive refs directly to the state properties
            isAuthenticated: isAuthenticated.value,
            kindeUser: kindeUser.value,
            userMember: userMember.value,
            isAdminUser: isAdminUser.value, // Corrected property name
        };
    },

    getters: {
        // Helper to find a member nickname by ID (used in Schedule view and MatchSongSelection overview)
        getMemberNicknameById: (state) => (memberId: number | null | undefined): string => {
             if (memberId === null || memberId === undefined) return '未知选手';
             const member = state.members.find(m => m.id === memberId);
             return member?.nickname || `ID: ${memberId}`;
        },
         // Helper to find a team name by ID (used in Schedule view)
        getTeamNameById: (state) => (teamId: number | null | undefined): string => {
             if (teamId === null || teamId === undefined) return '未知队伍';
             const team = state.teams.find(t => t.id === teamId);
             return team?.name || `ID: ${teamId}`;
        },
         // Helper to check if an order index is occupied by a teammate (used in MatchSongSelection)
         isOrderIndexOccupiedByTeammate: (state) => (index: number): boolean => {
             const myTeamId = state.upcomingMatchForSelection?.myTeam?.id;
             const myMemberId = state.userMember?.id;
             if (!myTeamId || !myMemberId) return false; // Cannot be occupied by teammate if no team/user info

             return state.occupiedOrderIndices.some(item =>
                 item.team_id === myTeamId &&
                 item.selected_order_index === index &&
                 item.member_id !== myMemberId // Must be a different member (teammate)
             );
         },
         // Helper to get the nickname of the member occupying a slot (used in MatchSongSelection overview)
         getOccupyingMemberNickname: (state) => (teamId: number, index: number): string | undefined => {
             const occupiedItem = state.occupiedOrderIndices.find(item =>
                 item.team_id === teamId &&
                 item.selected_order_index === index
             );
             // The backend should ideally include member_nickname in occupiedOrderIndices
             // If not, you'd need to look up the member from state.members
             return occupiedItem?.member_nickname; // Assuming backend provides this
             // If backend doesn't provide nickname in occupiedOrderIndices:
             // const member = state.members.find(m => m.id === occupiedItem?.member_id);
             // return member?.nickname;
         }
    },


    actions: {
        // --- Generic Loading and Error Handling ---
        setLoading(key: string, value: boolean) {
            if (this.isLoading.hasOwnProperty(key)) {
                 this.isLoading[key as keyof AppState['isLoading']] = value; // Use keyof for type safety
            } else {
                 // Allow adding new loading keys dynamically if needed, though defining in AppState is better
                 console.warn(`Attempted to set unknown loading key: ${key}`);
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

        // --- Kinde Auth Actions (Wrap composable functions) ---
        async checkAuthStatus() {
            const { checkAuthStatus } = useKindeAuth();
            await checkAuthStatus();
            // Update store state from composable state after check
            // Pinia state properties are reactive, but explicitly assigning
            // the unwrapped values ensures the store state reflects the composable state.
            const { isAuthenticated, kindeUser, userMember, isAdminUser } = useKindeAuth();
            this.isAuthenticated = isAuthenticated.value;
            this.kindeUser = kindeUser.value;
            this.userMember = userMember.value;
            this.isAdminUser = isAdminUser.value;
        },
        async login(prompt?: 'login' | 'create', context?: { teamCode: string | null, currentStep: number }) {
            const { login } = useKindeAuth();
            await login(prompt, context);
            // State will be updated by checkAuthStatus called after callback
        },
        async logout() {
            const { logout } = useKindeAuth();
            await logout();
            // State will be cleared by the composable's logout logic
            this.isAuthenticated = false;
            this.kindeUser = null;
            this.userMember = null;
            this.isAdminUser = false;
            // Also clear user-specific data like userMatches
            this.userMatches = null;
            this.upcomingMatchForSelection = null;
            this.userMatchSelection = null;
            this.occupiedOrderIndices = [];
            this.availableOrderSlotsCount = 0;
            this.memberSongPreferences = [];
        },
        async handleKindeCallback(code: string, state: string) {
             const { handleCallback } = useKindeAuth();
             const result = await handleCallback(code, state);
             // State will be updated by checkAuthStatus called inside handleCallback
             const { isAuthenticated, kindeUser, userMember, isAdminUser } = useKindeAuth();
             this.isAuthenticated = isAuthenticated.value;
             this.kindeUser = kindeUser.value;
             this.userMember = userMember.value;
             this.isAdminUser = isAdminUser.value;
             return result; // Return result for router redirect logic
        },


        // --- Data Fetching Actions (Keep existing, they use api.ts which will be updated) ---
        // These actions will now implicitly use the authenticatedFetch via api.ts
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

        // Corrected: Added level and difficulty to the payload type
        async fetchSongs(params: { category?: string; type?: string; search?: string; level?: string; difficulty?: string; page?: number; limit?: number } = {}) {
            this.setLoading('songs', true);
            this.clearError();
            try {
                const requestParams = {
                    ...params,
                    page: params.page || 1,
                    limit: params.limit || 20
                };
                // Clean up undefined/null values before sending
                Object.keys(requestParams).forEach(key => {
                    const value = requestParams[key as keyof typeof requestParams];
                    if (value === undefined || value === null || value === '') { // Also remove empty strings for filters
                        delete requestParams[key as keyof typeof requestParams];
                    }
                });

                const response = await api.fetchSongs(requestParams);

                if (response.success && response.data) {
                    this.songs = response.data.songs;
                    this.songPagination = response.data.pagination;
                } else {
                    // Throw error if API call was not successful
                    throw new Error(response.error || 'Failed to fetch songs.');
                }
            } catch (err: any) {
                console.error("Store: Error fetching songs:", err);
                this.setError(err.message || 'An unknown error occurred while fetching songs.');
                this.songs = []; // Clear songs on error
                this.songPagination = null; // Clear pagination on error
            } finally {
                this.setLoading('songs', false);
            }
        },

        async fetchSongFilterOptions() {
            this.setLoading('songFilters', true);
            // Don't clear main error, this is a secondary fetch
            try {
                const response = await api.fetchSongFilterOptions();
                 if (response.success && response.data) {
                     // Corrected: Assign the full response data which now includes levels and difficulties
                     this.songFilterOptions = response.data;
                 } else {
                     // Corrected: Throw error if fetching filter options fails
                     throw new Error(response.error || 'Failed to fetch filter options');
                 }
            } catch (err: any) {
                 console.error("Store: Error fetching song filter options:", err);
                 this.setError(err.message || 'An unknown error occurred while fetching song filter options');
                 // Optionally reset filter options to empty arrays on error
                 this.songFilterOptions = { categories: [], types: [], levels: [], difficulties: [] };
            } finally {
                 this.setLoading('songFilters', false);
            }
        },

        // REMOVED: fetchAllSongsForPicker action

        // Fetch Tournament Matches (Qualifier/Final) - Does NOT fetch Semifinals anymore
        async fetchTournamentMatches() {
            this.setLoading('tournamentMatches', true);
            this.clearError();
            try {
                // Assuming backend /api/tournament_matches now only returns non-semifinal matches
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

        // --- NEW ACTION: Fetch Semifinal Matches ---
        async fetchSemifinalMatches() {
            this.setLoading('semifinalMatches', true);
            this.clearError();
            try {
                // Call the new API endpoint for semifinals
                const response = await api.callApi<SemifinalMatch[]>('/semifinal-matches', 'GET');
                if (response.success && response.data) {
                    this.semifinalMatches = response.data;
                } else {
                    this.setError(response.error || 'Failed to fetch semifinal matches');
                }
            } catch (e: any) {
                this.setError(e.message || 'An error occurred while fetching semifinal matches');
            } finally {
                this.setLoading('semifinalMatches', false);
            }
        },


        async fetchMatchState(doId: string) {
            this.setLoading('currentMatch', true);
            this.clearError();
            console.log(`[Store HTTP] Attempting to fetch initial match state for DO: ${doId}`);
            try {
                const response = await api.fetchMatchState(doId);
                // Corrected: Use response.data
                if (response.success && response.data) {
                    this.currentMatchState = response.data; // Assuming response.data is the MatchState object
                    console.log(`[Store HTTP] Successfully fetched initial match state for DO ${doId}:`, this.currentMatchState);
                } else {
                    // Throw error if API call was not successful
                    throw new Error(response.error || `Failed to fetch match state for ${doId}`);
                }
            } catch (err: any) {
                this.setError(err.message);
                this.currentMatchState = null;
                console.error(`[Store HTTP] Exception fetching match state for DO ${doId}:`, err);
            } finally {
                this.setLoading('currentMatch', false);
            }
        },

        // --- NEW ACTION: Fetch a specific Semifinal Match (for Live view) ---
        async fetchSemifinalMatchData(matchId: number) {
             this.setLoading('currentSemifinalMatch', true);
             this.clearError();
             this.currentSemifinalMatch = null; // Clear previous data
             try {
                 // Call the new backend API endpoint
                 const response = await api.callApi<SemifinalMatch>(`/semifinal-matches/${matchId}`, 'GET');

                 if (response.success && response.data) {
                     this.currentSemifinalMatch = response.data;
                     // Manually parse results_json if backend sends it raw
                     if (this.currentSemifinalMatch.results_json) {
                         try {
                             this.currentSemifinalMatch.results = JSON.parse(this.currentSemifinalMatch.results_json);
                         } catch (e) {
                             console.error("Store: Failed to parse semifinal_results_json", e);
                             this.currentSemifinalMatch.results = null;
                         }
                     }
                     return true;
                 } else {
                     this.error = response.error || 'Failed to fetch semifinal match data';
                     return false;
                 }
             } catch (e: any) {
                 this.error = e.message || 'An error occurred while fetching semifinal match data';
                 return false;
             } finally {
                 this.setLoading('currentSemifinalMatch', false);
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

        // --- Tournament & Match Actions (Keep existing, they use api.ts which will be updated) ---
        // These actions will now require Admin Auth via the backend middleware
        // createTournamentMatch is for Qualifier/Final
        async createTournamentMatch(payload: CreateTournamentMatchPayload) {
            this.setLoading('creatingMatch', true); // Use generic creatingMatch loading state
            this.clearError();
            try {
                const response = await api.createTournamentMatch(payload);
                if (response.success && response.data) {
                    // Refresh the list after creation
                    this.fetchTournamentMatches(); // Refresh Qualifier/Final list
                    return response.data;
                } else {
                    this.setError(response.error || 'Failed to create tournament match');
                    return null;
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            } finally {
                 this.setLoading('creatingMatch', false);
            }
        },

        // --- NEW ACTION: Create Semifinal Match ---
        async createSemifinalMatch(payload: CreateSemifinalMatchPayloadFrontend) {
             this.setLoading('creatingSemifinalMatch', true); // Use specific loading state
             this.clearError();
             try {
                 // Call the new API endpoint for creating semifinals
                 // Map frontend payload to backend payload structure if needed, but they are similar now
                 const backendPayload: CreateSemifinalMatchPayload = {
                     round_name: payload.round_name,
                     player1_id: payload.player1_id!, // Assume non-null after form validation
                     player2_id: payload.player2_id!, // Assume non-null after form validation
                     scheduled_time: payload.scheduled_time,
                     // team_id fields are not used for semifinal creation in the new table
                     team1_id: null,
                     team2_id: null,
                 };
                 const response = await api.callApi<SemifinalMatch>('/semifinal-matches', 'POST', backendPayload);

                 if (response.success) {
                     // Refresh the semifinal list after creation
                     await this.fetchSemifinalMatches();
                     return true; // Indicate success
                 } else {
                     this.error = response.error || 'Failed to create semifinal match';
                     return false; // Indicate failure
                 }
             } catch (e: any) {
                 this.error = e.message || 'An error occurred while creating semifinal match';
                 return false;
             } finally {
                 this.setLoading('creatingSemifinalMatch', false);
             }
        },


        async confirmMatchSetup(matchId: number, payload: ConfirmMatchSetupPayload) {
            this.clearError();
            try {
                const response = await api.confirmMatchSetup(matchId, payload);
                if (response.success && response.data) {
                    // Update the match in the tournamentMatches list
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
                    // Update the match status and DO ID in the tournamentMatches list
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

        // --- Live Match (DO) Actions (forwarded via Worker, require Admin Auth) ---
        // These calls will be protected by the adminAuthMiddleware on the backend
        async calculateRound(doId: string, payload: CalculateRoundPayload) {
            this.clearError();
            try {
                const response = await api.calculateRound(doId, payload);
                if (!response.success) {
                    this.setError(response.error || 'Failed to calculate round');
                }
                return response; // Return the full response for component to check success/error
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
                    // Clear current match state and refresh lists
                    this.currentMatchState = null;
                    // Refresh tournamentMatches and matchHistory lists
                    this.fetchTournamentMatches(); // Refresh Qualifier/Final
                    this.fetchMatchHistory();
                    // Also refresh userMatches if they are on that page
                    if (this.isAuthenticated) {
                         this.fetchUserMatches();
                    }
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
                    // Update or add the preference in the list
                    const index = this.memberSongPreferences.findIndex(p =>
                        p.member_id === payload.member_id &&
                        p.tournament_stage === payload.tournament_stage &&
                        p.song_id === payload.song_id &&
                        p.selected_difficulty === payload.selected_difficulty // Match all unique constraint columns
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

        // --- NEW ACTIONS FOR USER MATCHES AND SELECTION ---

        // 新增 Action: 获取用户队伍的比赛列表
        async fetchUserMatches() {
            // Only fetch if authenticated
            if (!this.isAuthenticated) {
                console.warn("fetchUserMatches: User not authenticated. Skipping fetch.");
                this.userMatches = null; // Clear previous data if user logs out
                return;
            }
            // Only fetch if userMember is available (means user is registered)
            if (!this.userMember) {
                 console.warn("fetchUserMatches: User is authenticated but not registered as a member. Skipping fetch.");
                 this.userMatches = null;
                 return;
            }

            this.setLoading('userMatches', true);
            this.clearError();
            try {
                // Assuming this API only returns TournamentMatch (Qualifier/Final)
                const response = await api.fetchUserMatches(); // Call the existing API function
                if (response.success && response.data) {
                    this.userMatches = response.data;
                    console.log("Fetched user matches:", this.userMatches);
                } else {
                    this.setError(response.error || 'Failed to fetch user matches.');
                    this.userMatches = null;
                    console.error("Failed to fetch user matches:", this.error);
                }
            } catch (e: any) {
                this.setError(e.message || 'An unexpected error occurred while fetching user matches.');
                this.userMatches = null;
                console.error("Exception fetching user matches:", e);
            } finally {
                this.setLoading('userMatches', false);
            }
        },


        async fetchUserMatchSelectionData(matchId: number) {
            this.setLoading('userMatchSelection', true);
            this.clearError();
            this.upcomingMatchForSelection = null; // Clear previous data
            this.userMatchSelection = null;
            this.occupiedOrderIndices = [];
            this.availableOrderSlotsCount = 0;

            try {
                // Corrected: The API call now returns FetchUserMatchSelectionDataFrontend which includes match details with names
                const response = await api.fetchUserMatchSelectionData(matchId);
                if (response.success && response.data) {
                    this.upcomingMatchForSelection = response.data;
                    // Populate separate state properties for convenience if needed
                    this.userMatchSelection = response.data.mySelection;
                    this.occupiedOrderIndices = response.data.occupiedOrderIndices;
                    this.availableOrderSlotsCount = response.data.availableOrderSlotsCount;
                    console.log(`Store: Fetched user match selection data for match ${matchId}`, response.data);
                    return response.data;
                } else {
                    // Throw error if API call was not successful
                    throw new Error(response.error || `Failed to fetch selection data for match ${matchId}`);
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            } finally {
                this.setLoading('userMatchSelection', false);
            }
        },

        async saveMatchSelection(matchId: number, payload: SaveMatchPlayerSelectionPayloadFrontend) {
            this.setLoading('savingMatchSelection', true);
            this.clearError();
            try {
                // Corrected: api.saveMatchPlayerSelection returns ApiResponse<{ selection: MatchPlayerSelectionFrontend }>
                const response = await api.saveMatchPlayerSelection(matchId, payload);
                if (response.success && response.data?.selection) { // Check for response.data and response.data.selection
                    // Corrected: Assign response.data.selection to userMatchSelection
                    this.userMatchSelection = response.data.selection;

                    // Also update it within the upcomingMatchForSelection if it exists
                    if (this.upcomingMatchForSelection) {
                         this.upcomingMatchForSelection.mySelection = response.data.selection;
                         // Refetching ensures occupied indices are up-to-date after saving
                         // This is simpler than trying to update occupied indices locally.
                         this.fetchUserMatchSelectionData(matchId);
                    }
                    console.log(`Store: Saved user match selection for match ${matchId}`, response.data.selection);
                    // Corrected: Return the saved selection object itself
                    return response.data.selection;
                } else {
                    // If response.success is false, response.data is undefined, but response.error/message should exist
                    this.setError(response.error || `Failed to save selection for match ${matchId}`);
                    return null; // Return null on failure
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            } finally {
                this.setLoading('savingMatchSelection', false);
            }
        },

        // REMOVED: fetchAllSongsForPicker action

        // --- NEW ACTIONS FOR STAFF MATCH COMPILATION ---

        async fetchMatchSelectionStatus(matchId: number): Promise<MatchSelectionStatusFrontend | null> {
            this.setLoading('checkingMatchSelectionStatus', true);
            this.clearError();
            try {
                const response = await api.fetchMatchSelectionStatus(matchId); // Assume api.ts has this function
                if (response.success && response.data) {
                    console.log(`Store: Fetched match selection status for match ${matchId}`, response.data);
                    return response.data; // Return data directly, not stored in global state
                } else {
                    // Throw error if API call was not successful
                    throw new Error(response.error || `Failed to fetch selection status for match ${matchId}`);
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            } finally {
                this.setLoading('checkingMatchSelectionStatus', false);
            }
        },

        async compileMatchSetup(matchId: number): Promise<CompileMatchSetupResponseFrontend | null> {
            this.setLoading('compilingMatchSetup', true);
            this.clearError();
            try {
                const response = await api.compileMatchSetup(matchId); // Assume api.ts has this function
                if (response.success) {
                    console.log(`Store: Compiled match setup for match ${matchId}`, response.data);
                    // Update the tournamentMatches list with the potentially updated match
                    // The backend response includes the updated match in response.data?.tournamentMatch
                    if (response.data?.tournamentMatch) { // Use optional chaining for safety
                         const index = this.tournamentMatches.findIndex(m => m.id === matchId);
                         if (index !== -1) {
                             this.tournamentMatches[index] = response.data.tournamentMatch;
                         } else {
                             // If not found (shouldn't happen for existing match), maybe refetch all
                             this.fetchTournamentMatches();
                         }
                    } else {
                         // If backend doesn't return the match, force refetch the list
                         this.fetchTournamentMatches();
                    }

                    // Return the response data itself, which includes success, message, and optionally tournamentMatch
                    // Corrected: Ensure return type matches Promise<CompileMatchSetupResponseFrontend | null>
                    return response.data || null; // Return response.data if truthy, otherwise null

                } else {
                    // If response.success is false, response.data is undefined, but response.error/message should exist
                    this.setError(response.error || `Failed to compile match setup for match ${matchId}`);
                    return null; // Return null on failure
                }
            } catch (err: any) {
                this.setError(err.message);
                return null;
            } finally {
                this.setLoading('compilingMatchSetup', false);
            }
        },

        // --- NEW ACTION: Submit Semifinal Results ---
        async submitSemifinalResults(matchId: number, payload: SubmitSemifinalScoresPayload) {
            this.setLoading('submittingSemifinalResults', true);
            this.clearError();
            try {
                // Call the new backend API endpoint
                const response = await api.callApi<SubmitSemifinalScoresResponse>(`/semifinal-matches/${matchId}/submit-scores`, 'POST', payload);

                if (response.success && response.data?.semifinalMatch) {
                    // Update the specific match in the store's semifinal list
                    const index = this.semifinalMatches.findIndex(m => m.id === matchId);
                    if (index !== -1) {
                        // Update the match data, including the parsed results
                        const updatedMatch = response.data.semifinalMatch;
                         if (updatedMatch.results_json) {
                             try {
                                 updatedMatch.results = JSON.parse(updatedMatch.results_json);
                             } catch (e) {
                                 console.error("Store: Failed to parse results_json after submit", e);
                                 updatedMatch.results = null;
                             }
                         }
                        this.semifinalMatches[index] = updatedMatch;
                    } else {
                        // If not found, maybe refetch the list
                        this.fetchSemifinalMatches();
                    }

                    // If the user is currently viewing this match in LiveMatchSecond, update that state too
                    if (this.currentSemifinalMatch?.id === matchId) {
                         const updatedMatch = response.data.semifinalMatch;
                         if (updatedMatch.results_json) {
                             try {
                                 updatedMatch.results = JSON.parse(updatedMatch.results_json);
                             } catch (e) {
                                 console.error("Store: Failed to parse results_json for current match after submit", e);
                                 updatedMatch.results = null;
                             }
                         }
                         this.currentSemifinalMatch = updatedMatch;
                    }

                    return response.data; // Return the full response data
                } else {
                    this.error = response.error || 'Failed to submit semifinal results';
                    return null; // Indicate failure
                }
            } catch (e: any) {
                this.error = e.message || 'An error occurred while submitting semifinal results';
                return null;
            } finally {
                this.setLoading('submittingSemifinalResults', false);
            }
        },

        // --- NEW ACTION: Archive Semifinal Match ---
        async archiveSemifinalMatch(matchId: number) {
             this.setLoading('archivingSemifinalMatch', true);
             this.clearError();
             try {
                 const response = await api.callApi<ApiResponse>(`/semifinal-matches/${matchId}/archive`, 'POST');
                 if (response.success) {
                     ElMessage.success('比赛已归档');
                     // Update the match status in the store's semifinal list
                     const index = this.semifinalMatches.findIndex(m => m.id === matchId);
                     if (index !== -1) {
                          this.semifinalMatches[index].status = 'archived';
                     }
                     // If viewing the match, update its status
                     if (this.currentSemifinalMatch?.id === matchId) {
                          this.currentSemifinalMatch.status = 'archived';
                     }
                     return true;
                 } else {
                     this.error = response.error || 'Failed to archive match';
                     return false;
                 }
             } catch (e: any) {
                 this.error = e.message || 'An error occurred while archiving match';
                 return false;
             } finally {
                 this.setLoading('archivingSemifinalMatch', false);
             }
        },


        // --- WebSocket Management (Keep existing) ---
        connectWebSocket(doId: string) {
             if (this.currentMatchWebSocket && this.connectedDoName === doId) {
                  // Corrected: Use WebSocket.CONNECTING
                  if (this.currentMatchWebSocket.readyState === WebSocket.OPEN || this.currentMatchWebSocket.readyState === WebSocket.CONNECTING) {
                      console.log(`[Store WS] WebSocket already open or connecting for DO name: ${doId}.`);
                      return;
                  }
             }

             if (this.currentMatchWebSocket) {
                  console.log(`[Store WS] WebSocket exists (State: ${this.currentMatchWebSocket.readyState}). Closing existing connection for ${this.connectedDoName || 'unknown DO'}.`);
                  this.currentMatchWebSocket.close(1000, "New connection requested");
                  this.currentMatchWebSocket = null;
                  this.connectedDoName = null;
             }

             const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
             const wsHost = window.location.host;
             // Construct the WebSocket URL based on the DO name
             const wsUrl = `${wsProtocol}//${wsHost}/api/live-match/${doId}/websocket`;

             console.log(`[Store WS] Attempting to connect WebSocket to: ${wsUrl} for DO name: ${doId}`);
             this.currentMatchWebSocket = new WebSocket(wsUrl);
             this.connectedDoName = doId;

             this.currentMatchWebSocket.onopen = () => {
                 console.log(`[Store WS] WebSocket connected successfully for DO name: ${doId}!`);
                 this.clearError(); // Clear any previous connection errors
             };

             this.currentMatchWebSocket.onmessage = (event) => {
                 console.log(`[Store WS] WebSocket message received for DO name ${doId}:`, event.data);
                 try {
                     const data = JSON.parse(event.data as string);
                     console.log(`[Store WS] Parsed WebSocket message for DO name ${doId}:`, data);
                     // Basic check to see if it looks like a MatchState object
                     if (data && typeof data === 'object' && data.status !== undefined && data.tournament_match_id !== undefined && data.match_do_id !== undefined) {
                          console.log(`[Store WS] Received valid MatchState update for DO name ${doId}. Updating state.`);
                          this.currentMatchState = data as MatchState;
                          this.clearError(); // Clear error on successful state update
                     } else if (data && data.error) {
                         console.error(`[Store WS] WebSocket received error message for DO name ${doId}:`, data.error);
                         this.setError(`Live match error: ${data.error}`);
                     }
                     else {
                         console.warn(`[Store WS] WebSocket received unknown message structure for DO name ${doId}:`, data);
                     }
                 } catch (e: any) {
                     console.error(`[Store WS] Failed to parse WebSocket message JSON for DO name ${doId}:`, e);
                     this.setError('Failed to process live match data from server.');
                 }
             };

             this.currentMatchWebSocket.onerror = (error) => {
                 console.error(`[Store WS] WebSocket error for DO name ${doId}:`, error);
                 this.setError('WebSocket connection error. Please refresh or check match status.');
                 this.currentMatchWebSocket = null;
                 this.connectedDoName = null;
             };

             this.currentMatchWebSocket.onclose = (event) => {
                 console.log(`[Store WS] WebSocket closed for DO name ${doId}. Code: ${event.code}, Reason: ${event.reason}`);
                 if (!event.wasClean) {
                     console.error(`[Store WS] WebSocket connection died unexpectedly for DO name ${doId}`);
                     // Set error only if it wasn't a clean close (code 1000) or normal shutdown (code 1001)
                     if (event.code !== 1000 && event.code !== 1001) {
                          this.setError(`WebSocket disconnected unexpectedly (Code: ${event.code}).`);
                     }
                 }
                 this.currentMatchWebSocket = null;
                 this.connectedDoName = null;
             };
        },

        disconnectWebSocket() {
             if (this.currentMatchWebSocket && this.currentMatchWebSocket.readyState === WebSocket.OPEN) {
                 console.log(`[Store WS] Closing WebSocket for DO name: ${this.connectedDoName || 'unknown'}`);
                 this.currentMatchWebSocket.close(1000, "User navigated away"); // Use code 1000 for clean close
             } else {
                  console.log(`[Store WS] WebSocket not open, nothing to close.`);
             }
             this.currentMatchWebSocket = null;
             this.connectedDoName = null;
        },
    },
});
