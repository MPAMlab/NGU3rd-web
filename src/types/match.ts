// src/types/match.ts

export interface MatchState {
    matchId: string;
    round: number;
    teamA_name: string;
    teamA_score: number;
    teamA_player: string;
    teamB_name: string;
    teamB_score: number;
    teamB_player: string;
    status: 'pending' | 'live' | 'finished' | 'paused' | 'archived_in_d1';
  }
  
  // Type for a single archived round record
  export interface RoundArchive {
    id: number; // D1 auto-increment ID
    match_do_id: string;
    round_number: number;
    team_a_name: string;
    team_a_score: number;
    team_a_player: string;
    team_b_name: string;
    team_b_score: number;
    team_b_player: string;
    status: string;
    archived_at: string;
    raw_data?: string;
    winner_team_name?: string; // Added winner field
    // is_editable?: number;
}
  
  
  // Type for a single archived match summary record
export interface MatchArchiveSummary {
  id: number; // D1 auto-increment ID
  match_do_id: string;
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
  winner_team_name?: string; // Added winner field
}
  
  // Keep your default form data if needed, but we'll initialize from store data
  // export const defaultMatchFormData: Omit<MatchState, 'matchId'> = {
  //   round: 1,
  //   teamA_name: '',
  //   teamA_score: 0,
  //   teamA_player: '',
  //   teamB_name: '',
  //   teamB_score: 0,
  //   teamB_player: '',
  //   status: 'pending',
  // };
  