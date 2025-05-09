// src/types.ts

// Basic types for data models (expand as needed)
export interface Team {
    id: string; // Unique ID (e.g., team_code)
    name: string;
    logoUrl?: string;
    color?: string; // e.g., 'blue', 'red'
    members?: Member[]; // Optional: members belonging to this team (Frontend convenience)
  }
  
  export interface Member {
    id: string; // Unique ID (e.g., member_id)
    nickname: string;
    teamId: string; // Link to Team
    avatarUrl?: string;
    profession?: string; // e.g., '绝剑士', '矩盾手', '炼星师'
    element?: 'fire' | 'wood' | 'water'; // e.g., 'fire', 'wood', 'water'
    // Add other member-specific fields like stats, achievements etc.
  }
  
  export interface Song {
    id: string; // Unique song ID
    title: string;
    difficulty: string; // e.g., '12+', '13'
    element: 'fire' | 'wood' | 'water';
    coverUrl?: string;
    bpm?: number;
    // Add other song details
  }
  
  // Represents a song as part of a specific match
  export interface MatchSong {
      song_id: string; // Link to Song
      song_title?: string; // Denormalized title (Optional in D1, likely required in DO state)
      song_difficulty?: string; // Denormalized difficulty (Optional in D1, likely required in DO state)
      song_element?: 'fire' | 'wood' | 'water'; // Denormalized element (Optional in D1, likely required in DO state)
      picker_team_id: string; // Which team picked this song
      picker_team_name?: string; // Denormalized picker name (Optional in D1, likely required in DO state)
      // ADDED coverUrl and bpm to MatchSong for DO state and frontend convenience
      coverUrl?: string; // Denormalized cover URL (Optional in D1, likely required in DO state)
      bpm?: number; // Denormalized BPM (Optional in D1, likely required in DO state)
      status: 'pending' | 'ongoing' | 'completed'; // Status of this song within the match
      // Add score/outcome for this specific song if needed in archive (Optional in D1)
      teamA_percentage?: number; // Final percentage for team A player on this song
      teamB_percentage?: number; // Final percentage for team B player on this song
      teamA_damage_dealt?: number; // Damage dealt by team A player
      teamB_damage_dealt?: number; // Damage dealt by team B player
      teamA_effect_value?: number; // Effect value for team A player
      // FIXED Typo: teamB_effect_effect_value -> teamB_effect_value
      teamB_effect_value?: number; // Effect value for team B player
  }
  
  
  export interface TournamentMatch {
    id: string; // Unique match ID (D1 ID)
    roundName: string; // e.g., "初赛 - 第1轮"
    // ADDED "completed" status for D1 records before archiving
    status: 'scheduled' | 'pending' | 'completed' | 'ongoing' | 'round_finished' | 'team_A_wins' | 'team_B_wins' | 'draw_pending_resolution' | 'archived_in_d1';
    teamA_id: string; // Link to Team A
    teamB_id: string; // Link to Team B
    teamA_name?: string; // Optional: denormalized name (Optional in D1)
    teamB_name?: string; // Optional: denormalized name (Optional in D1)
    scheduledTime?: string; // ISO string or similar
    winner_team_id?: string; // Link to winning team
    match_do_id?: string; // Durable Object ID if status is ongoing/finished/pending resolution
    // Add fields for player order if stored in D1 before starting DO
    teamA_player_order?: string[]; // Array of member IDs (Required in D1 for 'pending' status onwards)
    teamB_player_order?: string[]; // Array of member IDs (Required in D1 for 'pending' status onwards)
    // Add fields for song list if stored in D1 before starting DO
    songs?: MatchSong[]; // List of songs for this match (Required in D1 for 'pending' status onwards)
    // Add final scores if stored in D1 archive
    final_score_a?: number; // (Optional in D1)
    final_score_b?: number; // (Optional in D1)
  }
  
  // Durable Object Match State (from backend DO)
  export interface MatchState {
    match_do_id: string;
    tournament_match_id: string; // Link back to D1 record
    // MatchState status should reflect the DO's internal state
    status: 'pending' | 'ongoing' | 'round_finished' | 'team_A_wins' | 'team_B_wins' | 'draw_pending_resolution' | 'archived_in_d1';
    round: number; // Current round number (1-based)
    teamA_id: string;
    teamB_id: string;
    teamA_name: string; // Denormalized name (Required in DO state)
    teamB_name: string; // Denormalized name (Required in DO state)
    teamA_score: number; // Current HP
    teamB_score: number; // Current HP
    teamA_player_order: string[]; // Member IDs in order (Required in DO state)
    // REMOVED the typo property teamB_player_player_order
    teamB_player_order: string[]; // Member IDs in order (Required in DO state)
    teamA_current_player_id: string | null; // Current player ID from order
    teamB_current_player_id: string | null; // Current player ID from order
    teamA_current_player_name?: string; // Denormalized name (Optional in DO state)
    teamB_current_player_name?: string; // Denormalized name (Optional in DO state)
    teamA_current_player_profession?: string; // Denormalized profession (Optional in DO state)
    teamB_current_player_profession?: string; // Denormalized profession (Optional in DO state)
    teamA_mirror_available: boolean;
    teamB_mirror_available: boolean;
    // current_song type is MatchSong, which now includes coverUrl and bpm
    current_song: MatchSong | null; // Details of the current song being played in this match context (Required in DO state when status is 'ongoing')
    // Add other state like round summary, logs etc.
    roundSummary?: RoundSummary | null; // Summary of the last calculated round (Required in DO state when status is 'round_finished' or 'draw_pending_resolution')
  }
  
  export interface RoundSummary {
      round: number;
      teamA_player_id: string;
      teamB_player_id: string;
      teamA_percentage: number; // The percentage value used in calculation (e.g., 100.1234)
      teamB_percentage: number; // The percentage value used in calculation
      teamA_damage_digits: number[]; // e.g., [2, 5, 8, 3]
      teamB_damage_digits: number[];
      teamA_base_damage: number;
      teamB_base_damage: number;
      teamA_max_digit_damage: number;
      teamB_max_digit_damage: number;
      teamA_effect_value: number; // Value from admin input
      teamB_effect_value: number; // Value from admin input
      teamA_final_damage_dealt: number; // Damage after all calculations/effects
      teamB_final_damage_dealt: number;
      teamA_score_change: number; // How much HP changed
      teamB_score_change: number; // How much HP changed
      teamA_new_score: number; // Score after this round
      teamB_new_score: number; // Score after this round
      teamA_mirror_triggered: boolean;
      teamB_mirror_triggered: boolean;
      // Add logs or step-by-step breakdown if needed
      log?: string[];
  }
  
  // Payloads for API calls (match backend types)
  export interface CalculateRoundPayload {
      // These are the 0000-9999 values from the input, backend combines with integer part
      teamA_decimal_percentage: number;
      teamB_decimal_percentage: number;
      teamA_effect_value?: number; // Optional effect value
      teamB_effect_value?: number; // Optional effect value
  }
  
  export interface ResolveDrawPayload {
      winner_team_id: string; // ID of the winning team
  }
  
  // API Response types (example)
  export interface ApiResponse<T = any> {
      success: boolean;
      data?: T;
      error?: string;
  }
  
  