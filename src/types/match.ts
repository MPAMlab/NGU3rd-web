export interface MatchState {
    matchId: string; // 由后端DO的ID决定
    round: number;
    teamA_name: string;
    teamA_score: number;
    teamA_player: string;
    teamB_name: string;
    teamB_score: number;
    teamB_player: string;
    status: 'pending' | 'live' | 'finished' | 'paused';
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
  };
  