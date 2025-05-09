<!-- src/views/admin/history/MatchHistoryPage.vue -->
<template>
    <div class="match-history-page">
      <h2 class="text-2xl font-semibold mb-6">比赛历史</h2>
  
      <div v-if="tournamentStore.isLoading" class="text-center text-gray-400">加载中...</div>
      <div v-else-if="tournamentStore.error" class="alert-danger">
        错误: {{ tournamentStore.error }}
      </div>
      <div v-else class="glass rounded-lg p-6">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="pl-4">轮次名称</th>
                <th>状态</th>
                <th>队伍 A</th>
                <th>队伍 B</th>
                <th>胜者</th>
                <th>计划时间</th>
                <!-- Add more columns like end time, final scores if available in archive -->
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in archivedMatches" :key="match.id" class="glass hover:bg-white/5">
                <td class="py-3 pl-4 rounded-l-lg">{{ match.roundName }}</td>
                <td class="py-3">
                    <span :class="getStatusClass(match.status)">{{ getStatusText(match.status) }}</span>
                </td>
                <td class="py-3">{{ getTeamName(match.teamA_id) }}</td>
                <td class="py-3">{{ getTeamName(match.teamB_id) }}</td>
                <td class="py-3">
                    <span v-if="match.winner_team_id">{{ getTeamName(match.winner_team_id) }}</span>
                    <span v-else class="text-gray-400">无</span>
                </td>
                <td class="py-3">{{ formatTime(match.scheduledTime) }}</td>
                <td class="py-3 rounded-r-lg">
                  <button @click="viewMatchDetails(match)" class="text-blue-400 hover:underline mr-4">查看详情</button>
                  <!-- Optional: Re-archive or other actions -->
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <div v-if="archivedMatches.length === 0" class="text-center text-gray-400 py-4">暂无历史比赛记录</div>
      </div>
  
      <!-- Match Details Modal (Simplified) -->
      <Modal :show="isDetailsModalOpen" @close="closeDetailsModal">
          <template #header>
              <h3 class="text-xl font-bold">比赛详情: {{ selectedMatch?.roundName }}</h3>
          </template>
          <template #body>
              <div v-if="!selectedMatch" class="text-center text-gray-400">加载详情...</div>
              <div v-else class="space-y-4">
                   <p><strong>状态:</strong> <span :class="getStatusClass(selectedMatch.status)">{{ getStatusText(selectedMatch.status) }}</span></p>
                   <p><strong>队伍 A:</strong> {{ getTeamName(selectedMatch.teamA_id) }}</p>
                   <p><strong>队伍 B:</strong> {{ getTeamName(selectedMatch.teamB_id) }}</p>
                   <p><strong>胜者:</strong> {{ selectedMatch.winner_team_id ? getTeamName(selectedMatch.winner_team_id) : '无' }}</p>
                   <p><strong>计划时间:</strong> {{ formatTime(selectedMatch.scheduledTime) }}</p>
                   <!-- Add more details here if available in the archived data -->
                   <!-- Example: Final Scores, Player Orders, Song Outcomes -->
                   <!-- <div v-if="selectedMatch.finalScores">
                       <p><strong>最终血量 A:</strong> {{ selectedMatch.finalScores.teamA }}</p>
                       <p><strong>最终血量 B:</strong> {{ selectedMatch.finalScores.teamB }}</p>
                   </div> -->
              </div>
          </template>
          <template #footer>
              <button @click="closeDetailsModal" class="btn-primary">关闭</button>
          </template>
      </Modal>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useTournamentStore } from '@/stores/tournament';
  import { useTeamsStore } from '@/stores/teams';
  import Modal from '@/components/common/Modal.vue';
  import type { TournamentMatch } from '@/types';
  
  const tournamentStore = useTournamentStore();
  const teamsStore = useTeamsStore();
  
  const isDetailsModalOpen = ref(false);
  const selectedMatch = ref<TournamentMatch | null>(null);
  
  const archivedMatches = computed(() => {
      // Filter matches that are completed or archived
      return tournamentStore.schedule.filter(match =>
          match.status === 'completed' || match.status === 'archived_in_d1'
      );
  });
  
  onMounted(() => {
    // Load all schedule data, then filter for history
    tournamentStore.loadSchedule();
    teamsStore.loadTeams(); // Load teams to display names
  });
  
  const getTeamName = (teamId?: string) => {
      if (!teamId) return '未知队伍';
      const team = teamsStore.getTeamById(teamId);
      return team ? team.name : '未知队伍';
  };
  
  const getStatusText = (status: TournamentMatch['status']) => {
      switch (status) {
          case 'completed': return '已完成 (未归档)'; // Differentiate if needed
          case 'archived_in_d1': return '已归档';
          // Include other statuses for completeness, though they shouldn't appear in history filter
          case 'scheduled': return '待开始';
          case 'pending': return '待设置';
          case 'ongoing': return '进行中';
          case 'round_finished': return '本轮结束';
          case 'team_A_wins': return `${getTeamName(selectedMatch.value?.teamA_id)} 胜利`;
          case 'team_B_wins': return `${getTeamName(selectedMatch.value?.teamB_id)} 胜利`;
          case 'draw_pending_resolution': return '平局待判决';
          default: return '未知状态';
      }
  };
  
  const getStatusClass = (status: TournamentMatch['status']) => {
       switch (status) {
          case 'completed': return 'text-green-400';
          case 'archived_in_d1': return 'text-gray-400';
          // Include other statuses for completeness
          case 'scheduled': return 'text-gray-400';
          case 'pending': return 'text-gray-400';
          case 'ongoing': return 'text-yellow-400';
          case 'round_finished': return 'text-yellow-400';
          case 'team_A_wins': return 'text-green-400';
          case 'team_B_wins': return 'text-green-400';
          case 'draw_pending_resolution': return 'text-yellow-400';
          default: return 'text-gray-400';
      }
  };
  
  const formatTime = (timeString?: string) => {
      if (!timeString) return '未设置';
      try {
          const date = new Date(timeString);
          return date.toLocaleString(); // Adjust format as needed
      } catch {
          return '无效时间';
      }
  };
  
  const viewMatchDetails = (match: TournamentMatch) => {
      selectedMatch.value = match;
      isDetailsModalOpen.value = true;
  };
  
  const closeDetailsModal = () => {
      isDetailsModalOpen.value = false;
      selectedMatch.value = null;
  };
  
  </script>
  
  <style scoped>
  /* Scoped styles for the match history page */
  /* Table styles are in main.css */
  /* Button styles are in main.css */
  /* Alert styles are in main.css */
  </style>
  