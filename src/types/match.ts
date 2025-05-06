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
  
  
  // 用于表单的初始/默认值，matchId 会从服务器获取或在 store 中处理
  export const defaultMatchFormData: Omit<MatchState, 'matchId'> = {
    round: 1,
    teamA_name: '队伍A',
    teamA_score: 0,
    teamA_player: '选手A1',
    teamB_name: '队伍B',
    teamB_score: 0,
    teamB_player: '选手B1',
    status: 'pending',
  }

  // You might also want a type for the archived match data if it differs slightly
// or if you fetch a list of summaries
export interface ArchivedMatchSummary {
    id: number; // D1 auto-increment ID
    match_do_id: string;
    team_a_name: string;
    team_b_name: string;
    team_a_score: number;
    team_b_score: number;
    status: string; // Could be 'finished', 'archived_in_d1' etc.
    archived_at: string; // ISO date string
  }
  