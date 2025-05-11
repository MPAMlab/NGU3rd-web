// src/types.ts

// Represents the environment variables and bindings (Frontend perspective - less detailed than Worker Env)
// This is more for conceptual understanding or if frontend needs to know bucket names for direct access (e.g. cover images)
export interface FrontendEnv {
    // API_BASE_URL: string; // Could be an env var
    SONG_COVER_BUCKET_URL?: string; // Base URL for accessing song covers directly from R2
    // Add other frontend-relevant env vars
}


// --- 固定表相关类型 (members, teams) ---
// 匹配 D1 结构，ID 为 number
export interface Team {
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
    kinde_user_id?: string | null;
    is_admin?: number | null; // 0 or 1
    // Frontend convenience: Link to team if needed
    // team?: Team;
}

// --- 歌曲相关类型 ---
export interface SongLevel { // 对应 JSON "等级" 结构
    B?: string;
    A?: string;
    E?: string;
    M?: string;
    R?: string;
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

// --- 比赛核心类型 ---

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
    teamB_percentage?: number; // 完整百分比 (REAL)
    teamA_damage_dealt?: number; // (INTEGER)
    teamB_damage_dealt?: number; // (INTEGER)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // 小分调整 (INTEGER)
    teamA_health_after?: number; // 本轮结束后血量 (INTEGER)
    teamB_health_after?: number; // 本轮结束后血量 (INTEGER)
    teamA_mirror_triggered?: boolean; // (INTEGER 0/1)
    teamB_mirror_triggered?: boolean; // (INTEGER 0/1)
}

// Payload for Staff to confirm match setup (PUT /api/tournament_matches/:id/confirm_setup)
export interface ConfirmMatchSetupPayload {
    team1_player_order: number[]; // member_id 数组 (number[])
    team2_player_order: number[]; // member_id 数组 (number[])
    match_song_list: MatchSong[]; // 这场比赛最终确定的歌单 (MatchSong[])
}


// 赛程表条目 (对应 tournament_matches 表)
export interface TournamentMatch {
    id: number; // D1 auto-increment ID (number)
    round_name: string; // e.g., '初赛 - 第1轮'
    team1_id: number; // FK to teams.id (number)
    team2_id: number; // FK to teams.id (number)
    status: 'scheduled' | 'pending_song_confirmation' | 'ready_to_start' | 'live' | 'completed' | 'archived'; // Status of the scheduled match entry
    winner_team_id?: number | null; // NULLABLE, FK to teams.id (number)
    match_do_id?: string | null; // NULLABLE, Associated DO ID when live (string)
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
export interface CreateTournamentMatchPayload {
    round_name: string;
    team1_id: number | null; // Allow null in form state before selection
    team2_id: number | null; // Allow null in form state before selection
    scheduled_time?: string | null;
    // Player order and song list are NOT part of creation payload anymore
}


// DO 的实时状态 (WebSocket 推送的内容)
export interface MatchState {
    match_do_id: string; // (string)
    tournament_match_id: number; // 关联的 D1 tournament_matches.id (number)

    // DO 内部状态，反映当前比赛阶段
    status: 'pending_scores' | 'round_finished' | 'team_A_wins' | 'team_B_wins' | 'draw_pending_resolution' | 'tiebreaker_pending_song' | 'archived';
    // 'pending_scores': 等待当前歌曲的双方成绩
    // 'round_finished': 当前歌曲成绩已计算，等待下一首或比赛结束
    // 'tiebreaker_pending_song': 标准轮次打平，等待 Staff 选择加时赛歌曲
    // 'archived': 比赛已归档

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
    // teamA_members and teamB_members are stored in DO but might be large,
    // consider if you need them in the broadcasted state or fetch separately.
    // For now, assuming they are NOT in the broadcasted state to keep it smaller.
    // If needed, add: teamA_members: Member[]; teamB_members: Member[];

    teamA_mirror_available: boolean;
    teamB_mirror_available: boolean;

    match_song_list: MatchSong[]; // 整场比赛的歌单 (MatchSong[])
    current_song: MatchSong | null; // 当前正在进行的歌曲 (match_song_list 中的一项)

    roundSummary: RoundSummary | null; // 上一轮/刚结束的这一轮的计算总结
}

// Payload for initializing DO from D1 TournamentMatch data (Internal to Worker/DO)
// Frontend doesn't send this directly
// export interface MatchScheduleData { ... }


// 提交成绩的 Payload (前端发送完整百分比)
export interface CalculateRoundPayload {
    teamA_percentage: number; // e.g., 100.1234 (REAL)
    teamB_percentage: number; // e.g., 98.7654 (REAL)
    teamA_effect_value?: number; // 小分调整 (INTEGER)
    teamB_effect_value?: number; // 小分调整 (INTEGER)
}

// Payload for resolving a draw (Staff action)
export interface ResolveDrawPayload {
    winner: 'teamA' | 'teamB'; // 'teamA' or 'teamB' string
}

// Payload for Staff selecting a tiebreaker song (Frontend to Worker)
export interface SelectTiebreakerSongPayload {
    song_id: number; // FK to songs.id (number)
    selected_difficulty: string; // e.g., 'M', 'E' (Difficulty level key from SongLevel)
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
export interface MatchHistoryRound {
    id: number; // match_rounds_history PK
    tournament_match_id: number;
    match_do_id: string;
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


// API 响应包装
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string; // Worker might return message on success/failure
}

// Internal profession type used in DO logic (Frontend might use this for display mapping)
export type InternalProfession = 'attacker' | 'defender' | 'supporter' | null;
