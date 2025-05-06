// src/types/match.ts

// Represents a Team (matching your existing table structure)
export interface Team {
    id: number; // D1 auto-increment ID
    code: string; // 4-character manual ID (your team_code)
    name: string; // your team_name
    created_at?: number | null; // Unix timestamp (matching your table)
    current_health?: number | null;
    has_revive_mirror?: number | null; // 0 or 1
    status?: string | null; // e.g., 'active', 'inactive'
}

// Represents a Member (matching your existing table structure)
export interface Member {
    id: number; // D1 auto-increment ID
    team_code: string; // FK to teams.code
    color?: string | null;
    job?: string | null;
    maimai_id?: string | null;
    nickname: string; // The player name to display
    qq_number?: string | null;
    avatar_url?: string | null;
    joined_at?: number | null; // Unix timestamp
    updated_at?: number | null; // Unix timestamp
    kinde_user_id?: string | null;
    is_admin?: number | null; // 0 or 1
}


// Represents a scheduled Tournament Match (linking to your teams.id)
export interface TournamentMatch {
    id: number;
    tournament_round: string; // e.g., '八进四', '四进二', '决赛'
    match_number_in_round: number;
    team1_id: number; // FK to teams.id
    team2_id: number; // FK to teams.id
    team1_player_order?: string | null; // e.g., '1,2,3' (string)
    team2_player_order?: string | null; // e.g., '1,2,3' (string)
    match_do_id?: string | null; // NULLABLE, Associated DO ID when live
    status: 'scheduled' | 'live' | 'completed' | 'archived'; // Status of the scheduled match entry
    winner_team_id?: number | null; // NULLABLE, FK to teams.id (比赛结束后填写)
    scheduled_time?: string | null; // Optional: ISO 8601 string preferred
    created_at: string; // ISO 8601 timestamp

    // Optional: Include team details when fetching tournament matches (flattened or nested)
    // For flattened results from JOIN:
    team1_code?: string;
    team1_name?: string;
    team2_code?: string;
    team2_name?: string;
    winner_team_code?: string;
    winner_team_name?: string;
    // You might also want member names here if needed for display in schedule list
    // team1_member1?: string; team1_member2?: string; team1_member3?: string;
    // team2_member1?: string; team2_member2?: string; team2_member3?: string;
}


// Represents the real-time state stored in the Durable Object
export interface MatchState {
  matchId: string; // The ID of the Durable Object instance
  tournamentMatchId?: number | null; // Added: Link back to the scheduled match

  round: number;
  teamA_name: string;
  teamA_score: number;
  teamA_player: string; // Current player nickname
  teamB_name: string;
  teamB_score: number;
  teamB_player: string; // Current player nickname

  // Store full member objects and the order of their IDs
  teamA_members: Member[]; // Array of Member objects for Team A
  teamB_members: Member[]; // Array of Member objects for Team B
  teamA_player_order_ids: number[]; // Array of member.id in the desired playing order
  teamB_player_order_ids: number[]; // Array of member.id in the desired playing order
  current_player_index_a: number; // Index in teamA_player_order_ids for current player
  current_player_index_b: number; // Index in teamB_player_order_ids for current player


  status: 'pending' | 'live' | 'finished' | 'paused' | 'archived_in_d1';
}

// Type for a single archived round record stored in D1
export interface RoundArchive {
    id: number; // D1 auto-increment ID
    match_do_id: string; // The DO ID this round belongs to
    round_number: number;
    team_a_name: string;
    team_a_score: number;
    team_a_player: string; // Player nickname at the end of the round
    team_b_name: string;
    team_b_score: number;
    team_b_player: string; // Player nickname at the end of the round
    status: string;
    archived_at: string;
    raw_data?: string;
    winner_team_name?: string;
    // is_editable?: number;
}


// Type for a single archived match summary record stored in D1
export interface MatchArchiveSummary {
  id: number; // D1 auto-increment ID
  match_do_id: string;
  tournament_match_id?: number | null; // Added: Link back to the scheduled match
  match_name?: string;
  final_round?: number;
  team_a_name?: string;
  team_a_score?: number;
  team_a_player?: string;
  team_b_name?: string;
  team_b_score?: number;
  team_b_player?: string;
  status: string;
  archived_at: string;
  raw_data?: string;
  winner_team_name?: string;
}

// --- Types for Bulk Import ---

// Expected structure for a row in the Team Bulk Import CSV
export interface BulkTeamRow {
    code: string;
    name: string;
    // Add other optional fields if you want to import them initially
    // current_health?: string; // CSV is string, need parsing
    // has_revive_mirror?: string;
    // status?: string;
}

// Expected structure for a row in the Member Bulk Import CSV
export interface BulkMemberRow {
    team_code: string;
    nickname: string;
    color?: string;
    job?: string;
    maimai_id?: string;
    qq_number?: string;
    avatar_url?: string;
    kinde_user_id?: string;
    is_admin?: string; // CSV is string, need parsing to number/boolean
}
