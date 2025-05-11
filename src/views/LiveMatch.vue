<template>
    <div class="live-match-view">
      <el-card v-if="store.currentMatchState" :header="`直播赛程: ${store.currentMatchState.round_name}`" v-loading="store.isLoading.currentMatch">
        <el-alert
          v-if="store.currentMatchState.status === 'archived'"
          title="比赛已归档"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
         <el-alert
          v-else-if="store.currentMatchState.status === 'team_A_wins'"
          :title="`${store.currentMatchState.teamA_name} 获胜!`"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
         <el-alert
          v-else-if="store.currentMatchState.status === 'team_B_wins'"
          :title="`${store.currentMatchState.teamB_name} 获胜!`"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
         <el-alert
          v-else-if="store.currentMatchState.status === 'draw_pending_resolution'"
          title="比赛平局，等待裁判裁定胜负"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
         <el-alert
          v-else-if="store.currentMatchState.status === 'tiebreaker_pending_song'"
          title="标准轮次结束平局，等待裁判选择加时赛歌曲"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
  
  
        <el-row :gutter="20">
          <!-- Team A Info -->
          <el-col :span="6">
            <el-card :header="store.currentMatchState.teamA_name">
              <p><strong>当前血量:</strong> {{ store.currentMatchState.teamA_score }}</p>
              <p><strong>当前选手:</strong> {{ store.currentMatchState.teamA_current_player_nickname }} ({{ store.currentMatchState.teamA_current_player_profession || '未知职业' }})</p>
              <p><strong>复影折镜:</strong>
                  <el-tag :type="store.currentMatchState.teamA_mirror_available ? 'success' : 'danger'">
                      {{ store.currentMatchState.teamA_mirror_available ? '可用' : '已使用' }}
                  </el-tag>
              </p>
               <el-divider />
               <p><strong>出场顺序:</strong></p>
               <el-tag
                   v-for="(playerId, index) in store.currentMatchState.teamA_player_order_ids"
                   :key="playerId"
                   :type="index === store.currentMatchState.current_match_song_index % store.currentMatchState.teamA_player_order_ids.length ? '' : 'info'"
                   style="margin-right: 5px; margin-bottom: 5px;"
               >
                   {{ getMemberNicknameById(playerId) }}
               </el-tag>
            </el-card>
          </el-col>
  
          <!-- Center Scoreboard / Actions -->
          <el-col :span="12">
            <el-card>
              <template #header>
                  <div class="card-header">
                      <span>
                          第 {{ store.currentMatchState.current_match_song_index + 1 }} 轮
                          <span v-if="store.currentMatchState.current_song?.is_tiebreaker_song">(加时赛)</span>
                      </span>
                      <el-tag :type="matchStateTagType(store.currentMatchState.status)">
                          {{ matchStateText(store.currentMatchState.status) }}
                      </el-tag>
                  </div>
              </template>
  
              <div v-if="store.currentMatchState.current_song" style="text-align: center; margin-bottom: 20px;">
                  <el-image
                      v-if="store.currentMatchState.current_song.fullCoverUrl"
                      style="width: 150px; height: 150px; border-radius: 8px;"
                      :src="store.currentMatchState.current_song.fullCoverUrl"
                      fit="cover"
                      lazy
                  >
                      <template #error>
                          <div class="image-slot" style="width: 150px; height: 150px;">
                              <el-icon><Picture /></el-icon>
                          </div>
                      </template>
                  </el-image>
                   <div v-else class="image-slot" style="width: 150px; height: 150px; margin: 0 auto;">
                       <el-icon><Picture /></el-icon>
                   </div>
                  <h3>{{ store.currentMatchState.current_song.song_title }}</h3>
                  <p>难度: {{ store.currentMatchState.current_song.song_difficulty }}</p>
                   <p>选曲选手: {{ getMemberNicknameById(store.currentMatchState.current_song.picker_member_id) }} ({{ getTeamNameById(store.currentMatchState.current_song.picker_team_id) }})</p>
              </div>
               <div v-else style="text-align: center; margin-bottom: 20px;">
                   <p>等待歌曲信息...</p>
               </div>
  
  
              <!-- Actions based on status -->
              <div v-if="store.currentMatchState.status === 'pending_scores'">
                  <el-form :model="scoreForm" label-width="120px">
                      <el-form-item :label="`${store.currentMatchState.teamA_name} 百分比`">
                          <el-input-number v-model="scoreForm.teamA_percentage" :precision="4" :step="0.0001" :min="0" :max="101" /> %
                      </el-form-item>
                      <el-form-item :label="`${store.currentMatchState.teamB_name} 百分比`">
                          <el-input-number v-model="scoreForm.teamB_percentage" :precision="4" :step="0.0001" :min="0" :max="101" /> %
                      </el-form-item>
                       <el-form-item label="队伍 A 小分调整">
                          <el-input-number v-model="scoreForm.teamA_effect_value" :precision="0" :step="1" />
                      </el-form-item>
                      <el-form-item label="队伍 B 小分调整">
                          <el-input-number v-model="scoreForm.teamB_effect_value" :precision="0" :step="1" />
                      </el-form-item>
                      <el-form-item>
                          <el-button type="primary" @click="submitScores" :loading="calculatingRound">提交成绩</el-button>
                      </el-form-item>
                  </el-form>
              </div>
  
              <div v-else-if="store.currentMatchState.status === 'round_finished'">
                  <el-button type="primary" @click="goToNextRound" :loading="advancingRound">进入下一轮</el-button>
              </div>
  
               <div v-else-if="store.currentMatchState.status === 'tiebreaker_pending_song'">
                   <el-button type="warning" @click="openSelectTiebreakerSongDialog">选择加时赛歌曲</el-button>
               </div>
  
               <div v-else-if="store.currentMatchState.status === 'draw_pending_resolution'">
                   <el-alert title="比赛平局，请选择获胜方" type="warning" :closable="false" show-icon style="margin-bottom: 10px;" />
                   <el-radio-group v-model="drawWinner">
                       <el-radio-button label="teamA">{{ store.currentMatchState.teamA_name }} 获胜</el-radio-button>
                       <el-radio-button label="teamB">{{ store.currentMatchState.teamB_name }} 获胜</el-radio-button>
                   </el-radio-group>
                   <el-button type="danger" @click="resolveDraw" :disabled="!drawWinner" style="margin-left: 20px;">确认裁定</el-button>
               </div>
  
               <div v-else-if="store.currentMatchState.status === 'team_A_wins' || store.currentMatchState.status === 'team_B_wins' || store.currentMatchState.status === 'archived'">
                   <el-button type="info" @click="archiveMatch" :loading="archivingMatch">归档比赛</el-button>
               </div>
  
               <el-divider />
  
               <!-- Round Summary Display -->
               <div v-if="store.currentMatchState.roundSummary">
                   <h4>上一轮总结 (第 {{ store.currentMatchState.roundSummary.round_number_in_match }} 轮)</h4>
                   <el-descriptions :column="1" border size="small">
                       <el-descriptions-item label="歌曲">{{ store.currentMatchState.roundSummary.song_title }} ({{ store.currentMatchState.roundSummary.selected_difficulty }})</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamA_name} 选手`">{{ store.currentMatchState.roundSummary.teamA_player_nickname }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamB_name} 选手`">{{ store.currentMatchState.roundSummary.teamB_player_nickname }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamA_name} 百分比`">{{ store.currentMatchState.roundSummary.teamA_percentage }}%</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamB_name} 百分比`">{{ store.currentMatchState.roundSummary.teamB_percentage }}%</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamA_name} 伤害`">{{ store.currentMatchState.roundSummary.teamA_final_damage_dealt }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamB_name} 伤害`">{{ store.currentMatchState.roundSummary.teamB_final_damage_dealt }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamA_name} 血量变化`">{{ store.currentMatchState.roundSummary.teamA_health_change }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamB_name} 血量变化`">{{ store.currentMatchState.roundSummary.teamB_health_change }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamA_name} 赛后血量`">{{ store.currentMatchState.roundSummary.teamA_health_after }}</el-descriptions-item>
                       <el-descriptions-item :label="`${store.currentMatchState.teamB_name} 赛后血量`">{{ store.currentMatchState.roundSummary.teamB_health_after }}</el-descriptions-item>
                       <el-descriptions-item label="复影折镜">
                           A: <el-tag :type="store.currentMatchState.roundSummary.teamA_mirror_triggered ? 'success' : 'info'" size="small">{{ store.currentMatchState.roundSummary.teamA_mirror_triggered ? '是' : '否' }}</el-tag><br>
                           B: <el-tag :type="store.currentMatchState.roundSummary.teamB_mirror_triggered ? 'success' : 'info'" size="small">{{ store.currentMatchState.roundSummary.teamB_mirror_triggered ? '是' : '否' }}</el-tag>
                       </el-descriptions-item>
                        <el-descriptions-item label="小分调整">
                           A: {{ store.currentMatchState.roundSummary.teamA_effect_value_applied }}<br>
                           B: {{ store.currentMatchState.roundSummary.teamB_effect_value_applied }}
                       </el-descriptions-item>
                       <el-descriptions-item label="日志">
                           <div v-if="store.currentMatchState.roundSummary.log && store.currentMatchState.roundSummary.log.length > 0">
                               <p v-for="(log, index) in store.currentMatchState.roundSummary.log" :key="index">{{ log }}</p>
                           </div>
                           <span v-else>-</span>
                       </el-descriptions-item>
                   </el-descriptions>
               </div>
  
            </el-card>
          </el-col>
  
          <!-- Team B Info -->
          <el-col :span="6">
            <el-card :header="store.currentMatchState.teamB_name">
              <p><strong>当前血量:</strong> {{ store.currentMatchState.teamB_score }}</p>
              <p><strong>当前选手:</strong> {{ store.currentMatchState.teamB_current_player_nickname }} ({{ (store.currentMatchState as MatchState).teamB_current_player_profession || '未知职业' }})</p> <!-- <-- Applied type assertion here -->
              <p><strong>复影折镜:</strong>
                   <el-tag :type="store.currentMatchState.teamB_mirror_available ? 'success' : 'danger'">
                      {{ store.currentMatchState.teamB_mirror_available ? '可用' : '已使用' }}
                  </el-tag>
              </p>
               <el-divider />
               <p><strong>出场顺序:</strong></p>
               <el-tag
                   v-for="(playerId, index) in store.currentMatchState.teamB_player_order_ids"
                   :key="playerId"
                   :type="index === store.currentMatchState.current_match_song_index % store.currentMatchState.teamB_player_order_ids.length ? '' : 'info'"
                   style="margin-right: 5px; margin-bottom: 5px;"
               >
                   {{ getMemberNicknameById(playerId) }}
               </el-tag>
            </el-card>
          </el-col>
        </el-row>
  
         <!-- Select Tiebreaker Song Dialog -->
         <el-dialog v-model="selectTiebreakerSongDialogVisible" title="选择加时赛歌曲" width="600px">
             <el-form :inline="true">
                 <el-form-item label="搜索歌名">
                     <el-input v-model="songSearchQuery" placeholder="输入歌名关键字" clearable @input="debouncedSearchSongs" />
                 </el-form-item>
             </el-form>
             <el-table
                 :data="store.songs"
                 v-loading="store.isLoading.songs"
                 style="width: 100%; max-height: 300px; overflow-y: auto;"
                 highlight-current-row
                 @current-change="handleSongSelectForTiebreaker"
                 border
                 stripe
             >
                 <el-table-column type="index" width="50" />
                 <el-table-column label="封面" width="80">
                     <template #default="{ row }">
                         <el-image
                           v-if="row.fullCoverUrl"
                           style="width: 50px; height: 50px"
                           :src="row.fullCoverUrl"
                           fit="cover"
                           lazy
                         >
                           <template #error>
                             <div class="image-slot">
                               <el-icon><Picture /></el-icon>
                             </div>
                           </template>
                         </el-image>
                          <div v-else class="image-slot">
                               <el-icon><Picture /></el-icon>
                          </div>
                     </template>
                 </el-table-column>
                 <el-table-column prop="title" label="曲名" />
                 <el-table-column label="等级 (M)" width="100">
                     <template #default="{ row }">
                         {{ row.parsedLevels?.M || '-' }}
                     </template>
                 </el-table-column>
                 <!-- Add other difficulty columns if needed -->
             </el-table>
  
             <el-form v-if="selectedSongForTiebreaker" :model="tiebreakerSongForm" style="margin-top: 20px;" label-width="100px">
                 <el-form-item label="已选歌曲">
                     <el-text>{{ selectedSongForTiebreaker.title }}</el-text>
                 </el-form-item>
                 <el-form-item label="选择难度" prop="selected_difficulty" :rules="[{ required: true, message: '请选择难度', trigger: 'change' }]">
                     <el-select v-model="tiebreakerSongForm.selected_difficulty" placeholder="选择难度">
                         <el-option
                             v-for="(level, diff) in selectedSongForTiebreaker.parsedLevels"
                             :key="diff"
                             :label="`${diff} ${level}`"
                             :value="diff"
                             :disabled="!level"
                         />
                     </el-select>
                 </el-form-item>
             </el-form>
  
             <template #footer>
                 <el-button @click="selectTiebreakerSongDialogVisible = false">取消</el-button>
                 <el-button type="primary" @click="submitSelectTiebreakerSong" :disabled="!selectedSongForTiebreaker || !tiebreakerSongForm.selected_difficulty">确认选择</el-button>
             </template>
         </el-dialog>
  
  
      </el-card>
       <el-alert v-else title="比赛数据未加载或不存在" type="info" show-icon :closable="false" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore, type CalculateRoundPayload, type Song, type ResolveDrawPayload, type SelectTiebreakerSongPayload, type MatchState } from '@/store';
  import { onMounted, onUnmounted, ref, reactive, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { debounce } from 'lodash-es';
  
  const store = useAppStore();
  const route = useRoute();
  const router = useRouter();
  
  const doId = computed(() => route.params.doId as string);
  
  // --- Lifecycle ---
  onMounted(() => {
    if (doId.value) {
      store.connectWebSocket(doId.value);
      // Also fetch initial state via HTTP in case WS connection is slow or fails initially
      store.fetchMatchState(doId.value);
      // Fetch songs for tiebreaker selection
      store.fetchSongs();
      // Fetch members and teams for nickname/team name lookup
      store.fetchMembers();
      store.fetchTeams();
    } else {
        ElMessage.error('无效的比赛ID');
        router.push('/schedule'); // Redirect if no DO ID
    }
  });
  
  onUnmounted(() => {
    store.disconnectWebSocket();
  });
  
  // --- Score Submission ---
  const scoreForm = reactive<CalculateRoundPayload>({
      teamA_percentage: 0,
      teamB_percentage: 0,
      teamA_effect_value: 0,
      teamB_effect_value: 0,
  });
  const calculatingRound = ref(false);
  
  const submitScores = async () => {
      if (!store.currentMatchState || store.currentMatchState.status !== 'pending_scores') {
          ElMessage.warning('当前状态无法提交成绩');
          return;
      }
       if (scoreForm.teamA_percentage === 0 && scoreForm.teamB_percentage === 0) {
           ElMessage.warning('请填写双方百分比成绩');
           return;
       }
  
      calculatingRound.value = true;
      const result = await store.calculateRound(doId.value, scoreForm);
      calculatingRound.value = false;
  
      if (result.success) {
          ElMessage.success('成绩提交成功，等待计算结果');
          // Reset form after submission
          scoreForm.teamA_percentage = 0;
          scoreForm.teamB_percentage = 0;
          scoreForm.teamA_effect_value = 0;
          scoreForm.teamB_effect_value = 0;
          // State update will come via WebSocket
      } else {
          ElMessage.error(`提交失败: ${store.error}`);
      }
  };
  
  // --- Navigation Actions ---
  const advancingRound = ref(false);
  const goToNextRound = async () => {
       if (!store.currentMatchState || store.currentMatchState.status !== 'round_finished') {
          ElMessage.warning('当前状态无法进入下一轮');
          return;
      }
      advancingRound.value = true;
      await store.nextRound(doId.value);
      advancingRound.value = false;
       if (store.error) {
          ElMessage.error(`进入下一轮失败: ${store.error}`);
      } else {
           ElMessage.success('已进入下一轮');
           // State update comes via WebSocket
      }
  };
  
  const archivingMatch = ref(false);
  const archiveMatch = async () => {
       if (!store.currentMatchState || !['team_A_wins', 'team_B_wins', 'draw_pending_resolution', 'completed', 'archived'].includes(store.currentMatchState.status)) {
          ElMessage.warning('当前状态无法归档比赛');
          return;
      }
      ElMessageBox.confirm('确定要归档这场比赛吗？归档后将无法继续操作。', '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
      }).then(async () => {
          archivingMatch.value = true;
          await store.archiveMatch(doId.value);
          archivingMatch.value = false;
          if (store.error) {
              ElMessage.error(`归档失败: ${store.error}`);
          } else {
              ElMessage.success('比赛已归档');
              router.push('/match-history'); // Navigate to history after archiving
          }
      }).catch(() => {
          // User cancelled
      });
  };
  
  // --- Tiebreaker Selection ---
  const selectTiebreakerSongDialogVisible = ref(false);
  const songSearchQuery = ref(''); // Re-use search query from SongsView
  const selectedSongForTiebreaker = ref<Song | null>(null);
  const tiebreakerSongForm = reactive<Omit<SelectTiebreakerSongPayload, 'song_id'>>({
      selected_difficulty: '',
  });
  
  const openSelectTiebreakerSongDialog = () => {
      if (!store.currentMatchState || store.currentMatchState.status !== 'tiebreaker_pending_song') {
          ElMessage.warning('当前状态无法选择加时赛歌曲');
          return;
      }
      songSearchQuery.value = '';
      selectedSongForTiebreaker.value = null;
      tiebreakerSongForm.selected_difficulty = '';
      store.fetchSongs(); // Ensure song list is fresh
      selectTiebreakerSongDialogVisible.value = true;
  };
  
  const debouncedSearchSongs = debounce(() => {
      store.fetchSongs({ search: songSearchQuery.value });
  }, 300);
  
  const handleSongSelectForTiebreaker = (song: Song) => {
      selectedSongForTiebreaker.value = song;
      tiebreakerSongForm.selected_difficulty = ''; // Reset difficulty
  };
  
  const submitSelectTiebreakerSong = async () => {
      if (!selectedSongForTiebreaker.value || !tiebreakerSongForm.selected_difficulty) {
          ElMessage.warning('请选择歌曲和难度');
          return;
      }
       if (!store.currentMatchState) return;
  
      const payload: SelectTiebreakerSongPayload = {
          song_id: selectedSongForTiebreaker.value.id,
          selected_difficulty: tiebreakerSongForm.selected_difficulty,
      };
  
      await store.selectTiebreakerSong(doId.value, payload);
  
      if (store.error) {
          ElMessage.error(`选择加时赛歌曲失败: ${store.error}`);
      } else {
          ElMessage.success('加时赛歌曲已选择');
          selectTiebreakerSongDialogVisible.value = false;
          // State update comes via WebSocket
      }
  };
  
  // --- Draw Resolution ---
  const drawWinner = ref<'teamA' | 'teamB' | null>(null);
  const resolveDraw = async () => {
       if (!store.currentMatchState || store.currentMatchState.status !== 'draw_pending_resolution' || !drawWinner.value) {
          ElMessage.warning('当前状态无法裁定胜负或未选择获胜方');
          return;
      }
      ElMessageBox.confirm(`确定裁定 ${drawWinner.value === 'teamA' ? store.currentMatchState.teamA_name : store.currentMatchState.teamB_name} 获胜吗？`, '警告', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
      }).then(async () => {
          const payload: ResolveDrawPayload = { winner: drawWinner.value! };
          await store.resolveDraw(doId.value, payload);
          if (store.error) {
              ElMessage.error(`裁定失败: ${store.error}`);
          } else {
              ElMessage.success('胜负已裁定');
              // State update comes via WebSocket, likely leading to archived state
          }
      }).catch(() => {
          // User cancelled
      });
  };
  
  
  // --- Helpers ---
  const getMemberNicknameById = (memberId: number | undefined | null) => {
      if (memberId === undefined || memberId === null) return '未知选手';
      // Note: currentMatchState does NOT contain full member objects, only IDs.
      // We need to fetch members separately in the store and look them up.
      const member = store.members.find(m => m.id === memberId);
      return member?.nickname || `ID:${memberId}`;
  };
  
  const getTeamNameById = (teamId: number | undefined | null) => {
       if (teamId === undefined || teamId === null) return '未知队伍';
       const team = store.teams.find(t => t.id === teamId);
       return team?.name || `ID:${teamId}`;
  };
  
  
  const matchStateTagType = (status: MatchState['status']) => {
      switch (status) {
          case 'pending_scores': return 'warning';
          case 'round_finished': return 'success';
          case 'team_A_wins':
          case 'team_B_wins': return 'success';
          case 'draw_pending_resolution':
          case 'tiebreaker_pending_song': return 'danger';
          case 'archived': return 'info';
          default: return 'info';
      }
  };
  
  const matchStateText = (status: MatchState['status']) => {
       switch (status) {
          case 'pending_scores': return '等待成绩';
          case 'round_finished': return '本轮结束';
          case 'team_A_wins': return `${store.currentMatchState?.teamA_name || '队伍A'} 获胜`;
          case 'team_B_wins': return `${store.currentMatchState?.teamB_name || '队伍B'} 获胜`;
          case 'draw_pending_resolution': return '平局待裁定';
          case 'tiebreaker_pending_song': return '加时赛选曲';
          case 'archived': return '已归档';
          default: return '未知状态';
      }
  };
  
  </script>
  
  <style scoped>
  .live-match-view {
    max-width: 1200px;
    margin: 0 auto;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 20px;
  }
  </style>
  