<!-- src/views/admin/schedule/ScheduleListPage.vue -->
<template>
    <div class="schedule-list-page">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">赛程列表</h2>
        <button @click="openAddModal" class="btn-primary flex items-center">
          <img src="https://unpkg.com/lucide-static@latest/icons/plus.svg" class="w-5 h-5 mr-2">
          创建赛程
        </button>
      </div>
  
      <div v-if="tournamentStore.isLoading || teamsStore.isLoading || membersStore.isLoading" class="text-center text-gray-400">加载中...</div>
      <div v-else-if="tournamentStore.error || teamsStore.error || membersStore.error" class="alert-danger">
        错误: {{ tournamentStore.error || teamsStore.error || membersStore.error }}
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
                <th>计划时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="match in tournamentStore.schedule" :key="match.id" class="glass hover:bg-white/5">
                <td class="py-3 pl-4 rounded-l-lg">{{ match.roundName }}</td>
                <td class="py-3">
                    <span :class="getStatusClass(match)">{{ getStatusText(match) }}</span>
                </td>
                <td class="py-3">{{ getTeamName(match.teamA_id) }}</td>
                <td class="py-3">{{ getTeamName(match.teamB_id) }}</td>
                <td class="py-3">{{ formatTime(match.scheduledTime) }}</td>
                <td class="py-3 rounded-r-lg">
                  <button
                      v-if="match.status === 'scheduled'"
                      @click="openSetupModal(match)"
                      class="text-purple-400 hover:underline mr-4"
                  >
                      设置并开始
                  </button>
                   <router-link
                      v-else-if="match.status === 'ongoing' && match.match_do_id"
                      :to="`/admin/live-match/${match.match_do_id}`"
                      class="text-green-400 hover:underline mr-4"
                   >
                       前往控制台
                   </router-link>
                   <button
                      v-else-if="match.status === 'completed' || match.status === 'archived_in_d1'"
                      @click="viewCompletedMatch(match)"
                      class="text-blue-400 hover:underline mr-4"
                   >
                       查看结果
                   </button>
                   <button
                      v-else-if="(match.status === 'round_finished' || match.status === 'draw_pending_resolution') && match.match_do_id"
                       @click="viewOngoingMatch(match)"
                      class="text-yellow-400 hover:underline mr-4"
                   >
                       继续/判决
                   </button>
                   <button @click="openEditModal(match)" class="text-purple-400 hover:underline mr-4">编辑</button>
                   <button @click="deleteMatch(match.id)" class="text-red-400 hover:underline">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <div v-if="tournamentStore.schedule.length === 0" class="text-center text-gray-400 py-4">暂无赛程</div>
      </div>
  
      <!-- Add/Edit Match Modal -->
      <Modal :show="isEditModalOpen" @close="closeEditModal">
        <template #header>
          <h3 class="text-xl font-bold">{{ isEditing ? '编辑赛程' : '创建赛程' }}</h3>
        </template>
        <template #body>
          <div v-if="currentMatch" class="space-y-4"> {/* Added v-if for currentMatch */}
            <div>
              <label for="match-round-name" class="block text-sm font-medium text-gray-300 mb-1">轮次名称</label>
              <input type="text" id="match-round-name" v-model="currentMatch.roundName" class="w-full input-glass" required>
            </div>
             <div>
              <label for="match-team-a" class="block text-sm font-medium text-gray-300 mb-1">队伍 A</label>
              <select id="match-team-a" v-model="currentMatch.teamA_id" class="w-full input-glass" required>
                  <option value="">请选择队伍 A</option>
                  <option v-for="team in teamsStore.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
             <div>
              <label for="match-team-b" class="block text-sm font-medium text-gray-300 mb-1">队伍 B</label>
              <select id="match-team-b" v-model="currentMatch.teamB_id" class="w-full input-glass" required>
                  <option value="">请选择队伍 B</option>
                  <option v-for="team in teamsStore.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
            </div>
             <div>
              <label for="match-scheduled-time" class="block text-sm font-medium text-gray-300 mb-1">计划时间 (Optional)</label>
              <input type="datetime-local" id="match-scheduled-time" v-model="currentMatch.scheduledTime" class="w-full input-glass">
            </div>
             <!-- Note: Player order and songs are set in the Setup Modal, not here -->
          </div>
        </template>
        <template #footer>
          <button @click="saveMatch" class="btn-primary" :disabled="tournamentStore.isLoading">
              {{ tournamentStore.isLoading ? '保存中...' : '保存' }}
          </button>
          <button @click="closeEditModal" class="btn-secondary ml-2">取消</button>
        </template>
      </Modal>
  
      <!-- Setup Match Modal (for setting player order and songs before starting) -->
      <Modal :show="isSetupModalOpen" @close="closeSetupModal">
          <template #header>
              <h3 class="text-xl font-bold">设置并开始轮次: {{ currentMatch?.roundName }}</h3>
          </template>
          <template #body>
              <div v-if="!currentMatch || !teamA || !teamB || membersStore.isLoading || teamsStore.isLoading" class="text-center text-gray-400">加载队伍和选手信息...</div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Team A Setup -->
                  <div class="glass rounded-lg p-4">
                      <h4 class="font-bold text-lg mb-3" :class="teamA.color === 'blue' ? 'text-blue-400' : 'text-white'">{{ teamA.name }} 出场顺序</h4>
                      <div class="space-y-3">
                          <div v-for="i in 3" :key="`a-player-${i}`">
                              <label :for="`setup-team-a-player-${i}`" class="block text-sm font-medium text-gray-300 mb-1">选手 {{ i }}</label>
                              <select :id="`setup-team-a-player-${i}`" v-model="setupPlayerOrderA[i-1]" class="w-full input-glass" required>
                                  <option value="">选择选手</option>
                                  <option v-for="member in teamAMembers" :key="member.id" :value="member.id">{{ member.nickname }}</option>
                              </select>
                          </div>
                      </div>
                  </div>
                   <!-- Team B Setup -->
                  <div class="glass rounded-lg p-4">
                      <h4 class="font-bold text-lg mb-3" :class="teamB.color === 'red' ? 'text-red-400' : 'text-white'">{{ teamB.name }} 出场顺序</h4>
                      <div class="space-y-3">
                          <div v-for="i in 3" :key="`b-player-${i}`">
                              <label :for="`setup-team-b-player-${i}`" class="block text-sm font-medium text-gray-300 mb-1">选手 {{ i }}</label>
                              <select :id="`setup-team-b-player-${i}`" v-model="setupPlayerOrderB[i-1]" class="w-full input-glass" required>
                                  <option value="">选择选手</option>
                                  <option v-for="member in teamBMembers" :key="member.id" :value="member.id">{{ member.nickname }}</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>
               <!-- Song Selection (Simplified for now, could be a list) -->
               <div v-if="currentMatch && teamA && teamB" class="glass rounded-lg p-4 mt-6"> {/* Added v-if */}
                   <h4 class="font-bold text-lg mb-3">轮次歌曲 (共 12 首)</h4>
                   <p class="text-gray-400 text-sm mb-4">请确保您已在后端配置了足够的歌曲。这里仅作提示。</p>
                   <div class="space-y-3">
                       <div v-for="i in 12" :key="`song-setup-${i}`">
                           <label :for="`setup-song-${i}`" class="block text-sm font-medium text-gray-300 mb-1">歌曲 {{ i }}</label>
                           <select :id="`setup-song-${i}`" v-model="setupSongs[i-1].song_id" class="w-full input-glass" required>
                               <option value="">选择歌曲</option>
                               <option v-for="song in allSongs" :key="song.id" :value="song.id">{{ song.title }} ({{ song.difficulty }})</option>
                           </select>
                            <label :for="`setup-song-${i}-picker`" class="block text-sm font-medium text-gray-300 mb-1 mt-2">选择者</label>
                            <select :id="`setup-song-${i}-picker`" v-model="setupSongs[i-1].picker_team_id" class="w-full input-glass" required>
                                <option value="">选择队伍</option>
                                <option :value="teamA?.id">{{ teamA?.name }}</option>
                                <option :value="teamB?.id">{{ teamB?.name }}</option>
                            </select>
                       </div>
                   </div>
               </div>
               <div v-if="setupError" class="alert-danger mt-6">{{ setupError }}</div>
          </template>
          <template #footer>
              <button @click="startMatch" class="btn-primary" :disabled="!isSetupValid || tournamentStore.isLoading">
                  {{ tournamentStore.isLoading ? '启动中...' : '设置顺序并开始轮次' }}
              </button>
              <button @click="closeSetupModal" class="btn-secondary ml-2">取消</button>
          </template>
      </Modal>
  
       <!-- View Completed Match Modal (Simplified) -->
      <Modal :show="isCompletedModalOpen" @close="closeCompletedModal">
          <template #header>
              <h3 class="text-xl font-bold">轮次结果: {{ completedMatch?.roundName }}</h3>
          </template>
          <template #body>
              <div v-if="!completedMatch" class="text-center text-gray-400">加载结果...</div>
              <div v-else class="text-center">
                   <p class="text-xl mb-4">状态：<span :class="getStatusClass(completedMatch)">{{ getStatusText(completedMatch) }}</span></p>
                   <div v-if="completedMatch.winner_team_id" class="text-2xl font-bold mb-6">获胜队伍：<span class="text-purple-400">{{ getTeamName(completedMatch.winner_team_id) }}</span></div>
                   <div v-else class="text-2xl font-bold mb-6 text-yellow-400">比赛结果：平局或未决</div>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div class="glass rounded-lg p-4">
                           <h3 class="text-xl font-bold mb-4 text-blue-400">{{ getTeamName(completedMatch.teamA_id) }}</h3>
                           <p>最终血量: {{ completedMatch.final_score_a ?? 'N/A' }}</p>
                       </div>
                        <div class="glass rounded-lg p-4">
                           <h3 class="text-xl font-bold mb-4 text-red-400">{{ getTeamName(completedMatch.teamB_id) }}</h3>
                           <p>最终血量: {{ completedMatch.final_score_b ?? 'N/A' }}</p>
                       </div>
                   </div>
              </div>
          </template>
          <template #footer>
              <button @click="closeCompletedModal" class="btn-primary">关闭</button>
          </template>
      </Modal>
  
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useTournamentStore } from '@/stores/tournament';
  import { useTeamsStore } from '@/stores/teams';
  import { useMembersStore } from '@/stores/members';
  import { fetchSongs } from '@/services/api'; // Need to fetch songs for setup
  import Modal from '@/components/common/Modal.vue';
  import type { TournamentMatch, Team, Member, Song, MatchSong } from '@/types';
  
  const tournamentStore = useTournamentStore();
  const teamsStore = useTeamsStore();
  const membersStore = useMembersStore();
  const router = useRouter();
  
  const isEditModalOpen = ref(false);
  const isSetupModalOpen = ref(false);
  const isCompletedModalOpen = ref(false);
  
  const isEditing = ref(false);
  const currentMatch = ref<Partial<TournamentMatch> | null>(null);
  const completedMatch = ref<TournamentMatch | null>(null); // For viewing completed match details
  
  // State for Setup Modal
  const setupPlayerOrderA = ref<string[]>(['', '', '']);
  const setupPlayerOrderB = ref<string[]>(['', '', '']);
  const allSongs = ref<Song[]>([]); // List of all available songs
  const setupSongs = ref<MatchSong[]>(Array(12).fill(null).map(() => ({ song_id: '', picker_team_id: '', status: 'pending' } as MatchSong)));
  
  
  // REFINED COMPUTED PROPERTIES
  const teamA = computed<Team | null>(() => {
    const match = currentMatch.value;
    if (!match || !match.teamA_id) return null;
    return teamsStore.getTeamById(match.teamA_id) || null;
  });
  
  const teamB = computed<Team | null>(() => {
    const match = currentMatch.value;
    if (!match || !match.teamB_id) return null;
    return teamsStore.getTeamById(match.teamB_id) || null;
  });
  
  const teamAMembers = computed<Member[]>(() => {
    const match = currentMatch.value;
    if (!match || !match.teamA_id) return [];
    return membersStore.getMembersByTeamId(match.teamA_id);
  });
  
  const teamBMembers = computed<Member[]>(() => {
    const match = currentMatch.value;
    if (!match || !match.teamB_id) return [];
    return membersStore.getMembersByTeamId(match.teamB_id);
  });
  
  
  const isSetupValid = computed(() => {
      // Check if 3 unique players are selected for each team
      const uniquePlayersA = new Set(setupPlayerOrderA.value.filter(id => id !== ''));
      const uniquePlayersB = new Set(setupPlayerOrderB.value.filter(id => id !== ''));
  
      const playersAValid = uniquePlayersA.size === 3 && setupPlayerOrderA.value.every(id => id !== '');
      const playersBValid = uniquePlayersB.size === 3 && setupPlayerOrderB.value.every(id => id !== '');
  
      // Check if 12 songs are selected and a picker is chosen for each
      const songsValid = setupSongs.value.every(song => song.song_id !== '' && song.picker_team_id !== '');
  
      return playersAValid && playersBValid && songsValid;
  });
  
  const setupError = computed(() => {
      if (!currentMatch.value) return '未选择赛程';
      if (!teamA.value || !teamB.value) return '队伍信息加载失败';
      if (teamAMembers.value.length < 3 || teamBMembers.value.length < 3) return '队伍成员不足3人';
  
      const uniquePlayersA = new Set(setupPlayerOrderA.value.filter(id => id !== ''));
      const uniquePlayersB = new Set(setupPlayerOrderB.value.filter(id => id !== ''));
  
      if (uniquePlayersA.size !== 3 || setupPlayerOrderA.value.some(id => id === '')) return `${teamA.value.name} 需要选择 3 位不重复的选手`;
      if (uniquePlayersB.size !== 3 || setupPlayerOrderB.value.some(id => id === '')) return `${teamB.value.name} 需要选择 3 位不重复的选手`;
  
      if (setupSongs.value.some(song => song.song_id === '')) return '请为所有 12 首歌曲选择曲目';
      if (setupSongs.value.some(song => song.picker_team_id === '')) return '请为所有 12 首歌曲选择选择队伍';
  
      return null; // No error
  });
  
  
  onMounted(() => {
    tournamentStore.loadSchedule();
    teamsStore.loadTeams();
    membersStore.loadMembers();
    loadAllSongs(); // Load songs for setup modal
  });
  
  const loadAllSongs = async () => {
      const response = await fetchSongs();
      if (response.success && response.data) {
          allSongs.value = response.data;
      } else {
          console.error("Failed to load songs:", response.error);
      }
  };
  
  const getTeamName = (teamId?: string) => {
      if (!teamId) return '未知队伍';
      const team = teamsStore.getTeamById(teamId);
      return team ? team.name : '未知队伍';
  };
  
  const getStatusText = (match: TournamentMatch | null) => {
      if (!match) return '未知状态';
      switch (match.status) {
          case 'scheduled': return '待开始';
          case 'pending': return '待设置';
          case 'ongoing': return '进行中';
          case 'round_finished': return '本轮结束';
          case 'team_A_wins': return `${getTeamName(match.teamA_id)} 胜利`;
          case 'team_B_wins': return `${getTeamName(match.teamB_id)} 胜利`;
          case 'draw_pending_resolution': return '平局待判决';
          case 'completed': return '已完成';
          case 'archived_in_d1': return '已归档';
          default: return '未知状态';
      }
  };
  
  const getStatusClass = (match: TournamentMatch | null) => {
      if (!match) return 'text-gray-400';
       switch (match.status) {
          case 'scheduled': return 'text-gray-400';
          case 'pending': return 'text-gray-400';
          case 'ongoing': return 'text-yellow-400';
          case 'round_finished': return 'text-yellow-400';
          case 'team_A_wins': return 'text-green-400';
          case 'team_B_wins': return 'text-green-400';
          case 'draw_pending_resolution': return 'text-yellow-400';
          case 'completed': return 'text-green-400';
          case 'archived_in_d1': return 'text-gray-400';
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
  
  // --- Edit/Add Match Modal ---
  const openAddModal = () => {
    isEditing.value = false;
    currentMatch.value = { teamA_id: '', teamB_id: '', roundName: '', status: 'scheduled' }; // Reset form
    isEditModalOpen.value = true;
  };
  
  const openEditModal = (match: TournamentMatch) => {
    isEditing.value = true;
    // Clone the match data, especially nested arrays if they existed
    currentMatch.value = { ...match };
    isEditModalOpen.value = true;
  };
  
  const closeEditModal = () => {
    isEditModalOpen.value = false;
    currentMatch.value = null; // Clear form data
    tournamentStore.error = null; // Clear store error
  };
  
  const saveMatch = async () => {
    if (!currentMatch.value || !currentMatch.value.teamA_id || !currentMatch.value.teamB_id || !currentMatch.value.roundName) {
        alert("请填写完整的赛程信息。");
        return;
    }
     if (currentMatch.value.teamA_id === currentMatch.value.teamB_id) {
         alert("队伍 A 和队伍 B 不能是同一支队伍。");
         return;
     }
  
    try {
      if (isEditing.value && currentMatch.value.id) {
        await tournamentStore.updateMatch(currentMatch.value.id, currentMatch.value);
      } else {
        // For new matches, ensure status is 'scheduled'
        const newMatchData = { ...currentMatch.value, status: 'scheduled' as const };
        await tournamentStore.addMatch(newMatchData);
      }
      closeEditModal(); // Close modal on success
    } catch (e) {
      // Error is already set in the store action
      console.error("Save match failed:", e);
      alert(`保存失败: ${tournamentStore.error}`); // Show error to user
    }
  };
  
  // --- Setup Match Modal ---
  const openSetupModal = (match: TournamentMatch) => {
      currentMatch.value = match;
      // Reset setup state
      setupPlayerOrderA.value = ['', '', ''];
      setupPlayerOrderB.value = ['', '', ''];
      // Initialize setupSongs with empty data, linking to available songs
      setupSongs.value = Array(12).fill(null).map(() => ({ song_id: '', picker_team_id: '', status: 'pending' } as MatchSong));
  
      isSetupModalOpen.value = true;
  };
  
  const closeSetupModal = () => {
      isSetupModalOpen.value = false;
      currentMatch.value = null; // Clear match context
      setupPlayerOrderA.value = ['', '', '']; // Reset state
      setupPlayerOrderB.value = ['', '', ''];
      setupSongs.value = Array(12).fill(null).map(() => ({ song_id: '', picker_team_id: '', status: 'pending' } as MatchSong));
      tournamentStore.error = null; // Clear store error
  };
  
  const startMatch = async () => {
      if (!currentMatch.value?.id || !isSetupValid.value) {
          alert("请检查设置信息是否完整和正确。");
          return;
      }
  
      // Prepare song data with full details before sending (optional, backend could fetch)
      const songsToSend: MatchSong[] = setupSongs.value.map(setupSong => {
          const songDetails = allSongs.value.find(s => s.id === setupSong.song_id);
          return {
              ...setupSong,
              song_title: songDetails?.title,
              song_difficulty: songDetails?.difficulty,
              song_element: songDetails?.element,
              coverUrl: songDetails?.coverUrl, // Include coverUrl
              bpm: songDetails?.bpm,           // Include bpm
              // picker_team_name will be denormalized in backend DO state
          };
      });
  
  
      try {
          const doId = await tournamentStore.startLiveMatch(
              currentMatch.value.id,
              setupPlayerOrderA.value,
              setupPlayerOrderB.value,
              songsToSend
          );
          closeSetupModal(); // Close setup modal
          router.push(`/admin/live-match/${doId}`); // Navigate to the live control page
      } catch (e) {
          console.error("Failed to start live match:", e);
          alert(`启动比赛失败: ${tournamentStore.error}`); // Show error to user
      }
  };
  
  // --- View Completed Match ---
  const viewCompletedMatch = (match: TournamentMatch) => {
      completedMatch.value = match;
      isCompletedModalOpen.value = true;
  };
  
  const closeCompletedModal = () => {
      isCompletedModalOpen.value = false;
      completedMatch.value = null;
  };
  
  // --- Actions for ongoing/completed matches ---
  const viewOngoingMatch = (match: TournamentMatch) => {
      if (match.match_do_id) {
          router.push(`/admin/live-match/${match.match_do_id}`);
      } else {
          alert("该比赛没有关联的实时控制台ID。");
      }
  };
  
  const deleteMatch = async (matchId: string) => {
    if (confirm('确定要删除这场赛程吗？')) {
      try {
        await tournamentStore.removeMatch(matchId);
      } catch (e) {
        console.error("Delete match failed:", e);
        alert(`删除失败: ${tournamentStore.error}`); // Show error to user
      }
    }
  };
  
  </script>
  
  <style scoped>
  /* Scoped styles for the schedule list page */
  </style>
  