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
    status: 'pending' | 'live' | 'finished' | 'paused' | 'archived_in_d1'; // Added 'archived_in_d1'
  }
  
  // This is the shape of data you get back from /api/archived_matches
  export interface ArchivedMatchSummary {
    id: number; // D1 auto-increment ID
    match_do_id: string; // The DO ID (e.g., "singleton-match-instance")
    team_a_name: string;
    team_b_name: string;
    team_a_score: number;
    team_b_score: number;
    status: string; // Could be 'finished', 'archived_in_d1' etc.
    archived_at: string; // ISO date string
  }
  
  
  // Keep your default form data if you use it elsewhere, but we'll initialize from store data
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
  