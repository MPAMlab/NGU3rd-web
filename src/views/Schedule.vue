<!-- frontend/src/views/Schedule.vue -->
<template>
    <div class="schedule-view">
      <!-- Corrected: Added closing tag for el-card -->
      <el-card header="赛程管理" v-loading="store.isLoading.tournamentMatches || store.isLoading.teams || store.isLoading.members">
        <el-button type="primary" @click="openCreateMatchDialog">创建新赛程</el-button>

        <el-table :data="store.tournamentMatches" style="width: 100%; margin-top: 20px;" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="round_name" label="轮次" />
          <el-table-column label="队伍">
              <template #default="{ row }">
                  {{ row.team1_name }} vs {{ row.team2_name }}
              </template>
          </el-table-column>
          <el-table-column prop="scheduled_time" label="计划时间" width="180">
              <template #default="{ row }">
                  {{ row.scheduled_time ? new Date(row.scheduled_time).toLocaleString() : '待定' }}
              </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                  <el-tag :type="matchStatusTagType(row.status)">{{ matchStatusText(row.status) }}</el-tag>
              </template>
          </el-table-column>
          <el-table-column label="操作" width="300">
            <template #default="{ row }">
              <el-button
                  v-if="row.status === 'scheduled' || row.status === 'pending_song_confirmation'"
                  size="small"
                  @click="openConfirmSetupDialog(row)"
                  :loading="store.isLoading.checkingMatchSelectionStatus"
              >
                  查看/编译歌单
              </el-button>
              <el-button
                  v-if="row.status === 'ready_to_start'"
                  size="small"
                  type="success"
                  @click="startLiveMatch(row)"
                  :loading="startingMatchId === row.id"
              >
                  开始直播
              </el-button>
               <el-button
                  v-if="row.status === 'live' && row.match_do_id"
                  size="small"
                  type="primary"
                  @click="$router.push(`/live-match/${row.match_do_id}`)"
              >
                  进入直播
              </el-button>
               <el-button
                  v-if="row.status === 'completed' || row.status === 'archived'"
                  size="small"
                  disabled
              >
                  已结束
               </el-button>
              <!-- TODO: Add Edit/Delete buttons if backend supports -->
              <!-- <el-button size="small" @click="handleEdit(row)">编辑</el-button> -->
              <!-- <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button> -->
            </template>
          </el-table-column>
        </el-table>

        <!-- Create Match Dialog -->
        <el-dialog v-model="createMatchDialogVisible" title="创建新赛程" width="500px">
          <el-form :model="newMatchForm" ref="newMatchFormRef" label-width="100px">
            <el-form-item label="轮次名称" prop="round_name" :rules="[{ required: true, message: '请输入轮次名称', trigger: 'blur' }]">
              <el-input v-model="newMatchForm.round_name" />
            </el-form-item>
            <el-form-item label="队伍 A" prop="team1_id" :rules="[{ required: true, message: '请选择队伍 A', trigger: 'change' }]">
              <el-select v-model="newMatchForm.team1_id" placeholder="选择队伍 A">
                <el-option v-for="team in store.teams" :key="team.id" :label="team.name" :value="team.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="队伍 B" prop="team2_id" :rules="[{ required: true, message: '请选择队伍 B', trigger: 'change' }]">
              <el-select v-model="newMatchForm.team2_id" placeholder="选择队伍 B">
                <el-option v-for="team in store.teams" :key="team.id" :label="team.name" :value="team.id" />
              </el-select>
            </el-form-item>
             <el-form-item label="计划时间" prop="scheduled_time">
                 <el-date-picker
                     v-model="newMatchForm.scheduled_time"
                     type="datetime"
                     placeholder="选择日期时间"
                     value-format="YYYY-MM-DDTHH:mm:ssZ"
                 />
             </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="createMatchDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitCreateMatchForm" :loading="creatingMatch">创建</el-button>
          </template>
        </el-dialog>

        <!-- Confirm Setup Dialog (Modified for Player Selection Status & Compilation) -->
        <el-dialog v-model="confirmSetupDialogVisible" :title="`赛程配置: ${currentMatchToSetup?.round_name}`" width="800px">
            <div v-if="currentMatchToSetup">
                <!-- Corrected: el-alert should not be self-closing -->
                <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                    查看选手选歌和顺序状态，并在所有选手完成后编译最终歌单。
                </el-alert>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-card :header="`${currentMatchToSetup.team1_name} 选手选歌状态`">
                            <div v-if="matchSelectionStatus">
                                <p>
                                    已完成: {{ matchSelectionStatus.team1Status.completedSelections }} / {{ matchSelectionStatus.team1Status.requiredSelections }}
                                    <el-tag :type="matchSelectionStatus.team1Status.completedSelections === matchSelectionStatus.team1Status.requiredSelections ? 'success' : 'warning'" size="small">
                                        {{ matchSelectionStatus.team1Status.completedSelections === matchSelectionStatus.team1Status.requiredSelections ? '已完成' : '未完成' }}
                                    </el-tag>
                                </p>
                                <div v-if="matchSelectionStatus.team1Status.missingMembers.length > 0">
                                    <el-text type="warning" size="small">
                                        未选歌选手: {{ matchSelectionStatus.team1Status.missingMembers.map(m => m.nickname).join(', ') }}
                                    </el-text>
                                </div>
                                <!-- TODO: Display selected songs/order for each player -->
                                <!-- This would require fetching match_player_selections here -->
                            </div>
                            <div v-else>
                                <el-text type="info">点击下方按钮检查状态</el-text>
                            </div>
                        </el-card>
                    </el-col>
                     <el-col :span="12">
                        <el-card :header="`${currentMatchToSetup.team2_name} 选手选歌状态`">
                             <div v-if="matchSelectionStatus">
                                <p>
                                    已完成: {{ matchSelectionStatus.team2Status.completedSelections }} / {{ matchSelectionStatus.team2Status.requiredSelections }}
                                     <el-tag :type="matchSelectionStatus.team2Status.completedSelections === matchSelectionStatus.team2Status.requiredSelections ? 'success' : 'warning'" size="small">
                                        {{ matchSelectionStatus.team2Status.completedSelections === matchSelectionStatus.team2Status.requiredSelections ? '已完成' : '未完成' }}
                                    </el-tag>
                                </p>
                                 <div v-if="matchSelectionStatus.team2Status.missingMembers.length > 0">
                                    <el-text type="warning" size="small">
                                        未选歌选手: {{ matchSelectionStatus.team2Status.missingMembers.map(m => m.nickname).join(', ') }}
                                    </el-text>
                                </div>
                                <!-- TODO: Display selected songs/order for each player -->
                            </div>
                             <div v-else>
                                <el-text type="info">点击下方按钮检查状态</el-text>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>

                <el-card header="最终比赛歌单 (编译后)" style="margin-top: 20px;">
                    <!-- Corrected: el-alert should not be self-closing -->
                    <!-- Corrected: Safer v-if condition -->
                    <el-alert v-if="currentMatchToSetup.match_song_list && currentMatchToSetup.match_song_list.length > 0" type="success" :closable="false" style="margin-bottom: 10px;">
                        已编译生成最终歌单。共 {{ currentMatchToSetup.match_song_list.length }} 首歌曲。
                    </el-alert>
                     <!-- Corrected: el-alert should not be self-closing -->
                     <el-alert v-else type="info" :closable="false" style="margin-bottom: 10px;">
                        选手选歌完成后，点击下方按钮编译生成最终歌单。
                    </el-alert>

                    <!-- Safely bind data, use empty array if match_song_list is null/undefined -->
                    <el-table :data="currentMatchToSetup.match_song_list || []" style="width: 100%;" border stripe>
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
                        <el-table-column prop="song_title" label="曲名" />
                        <el-table-column prop="song_difficulty" label="难度" width="100" />
                        <el-table-column label="选曲选手" width="150">
                            <template #default="{ row }">
                                {{ store.getMemberNicknameById(row.picker_member_id) }} ({{ store.getTeamNameById(row.picker_team_id) }}) <!-- Use store getters -->
                            </template>
                        </el-table-column>
                         <!-- Remove delete button from compiled list view -->
                         <!-- <el-table-column label="操作" width="100">
                             <template #default="{ $index }">
                                 <el-button size="small" type="danger" @click="removeSongFromMatchList($index)">删除</el-button>
                             </template>
                         </el-table-column> -->
                    </el-table>
                </el-card>

                 <!-- Manual Setup / Override (Optional - can add later if needed) -->
                 <!-- <el-card header="手动配置 (覆盖选手选歌)" style="margin-top: 20px;">
                     <el-alert type="warning" :closable="false" style="margin-bottom: 10px;">
                         手动配置将覆盖选手的所有选歌和顺序。请谨慎操作。
                     </el-alert>
                     ... (Add manual player order and song list selection UI here) ...
                 </el-card> -->

            </div>
            <template #footer>
                <el-button @click="confirmSetupDialogVisible = false">关闭</el-button>
                 <el-button
                     type="primary"
                     @click="checkSelectionStatus"
                     :loading="store.isLoading.checkingMatchSelectionStatus"
                     :disabled="!currentMatchToSetup"
                 >
                     检查选手选歌状态
                 </el-button>
                <el-button
                    type="success"
                    @click="compileMatchSetup"
                    :loading="store.isLoading.compilingMatchSetup"
                    :disabled="!matchSelectionStatus?.isReadyToCompile || store.isLoading.compilingMatchSetup"
                >
                    编译生成最终歌单
                </el-button>
                 <!-- Add Manual Save button if manual override is implemented -->
                 <!-- <el-button type="warning" @click="submitConfirmSetupForm" :loading="confirmingSetup">保存手动配置</el-button> -->
            </template>
        </el-dialog> <!-- Corrected: Closing el-dialog tag -->

         <!-- Add Song to Match Dialog (Remove this - manual song adding is not the primary flow) -->
         <!-- <el-dialog v-model="addSongToMatchDialogVisible" title="添加歌曲到歌单" width="600px"> ... </el-dialog> -->


      </el-card> <!-- Corrected: Closing el-card tag -->
    </div> <!-- Corrected: Closing div tag -->
  </template> <!-- Corrected: Closing template tag -->

  <script setup lang="ts">
  // Import types directly from store.ts
  import { useAppStore, type TournamentMatch, type CreateTournamentMatchPayload, type ConfirmMatchSetupPayload, type MatchSong, type Song, type Member, type MatchSelectionStatusFrontend } from '@/store';
  import { onMounted, ref, reactive, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
  // Removed debounce as it's not used in Schedule.vue snippet
  import { Picture } from '@element-plus/icons-vue'; // Import Picture icon

  const store = useAppStore();
  const router = useRouter();

  // --- Access R2 Public URL from Pages Environment Variables ---
  // Replace 'VITE_R2_PUBLIC_BUCKET_URL' with the actual name you set in Pages
  // const R2_PUBLIC_BUCKET_URL = import.meta.env.VITE_R2_PUBLIC_BUCKET_URL; // Not used in this component

  // --- Data Fetching ---
  onMounted(() => {
    store.fetchTournamentMatches();
    store.fetchTeams(); // Needed for team selects and display
    store.fetchMembers(); // Needed for player selects and display (in staff view)
    // store.fetchSongs(); // No longer needed to fetch all songs here unless for manual override
  });

  // --- Create Match Dialog ---
  const createMatchDialogVisible = ref(false);
  const newMatchFormRef = ref<FormInstance>();
  const newMatchForm = reactive<CreateTournamentMatchPayload>({
    round_name: '',
    team1_id: null,
    team2_id: null,
    scheduled_time: null,
  });
  const creatingMatch = ref(false);

  const openCreateMatchDialog = () => {
    newMatchForm.round_name = '';
    newMatchForm.team1_id = null;
    newMatchForm.team2_id = null;
    newMatchForm.scheduled_time = null;
    createMatchDialogVisible.value = true;
  };

  const submitCreateMatchForm = async () => {
    if (!newMatchFormRef.value) return;
    await newMatchFormRef.value.validate(async (valid) => {
      if (valid) {
        if (newMatchForm.team1_id === newMatchForm.team2_id) {
            ElMessage.warning('队伍 A 和队伍 B 不能是同一个队伍');
            return;
        }
        creatingMatch.value = true;
        const result = await store.createTournamentMatch(newMatchForm);
        creatingMatch.value = false;
        if (result) {
          ElMessage.success('赛程创建成功');
          createMatchDialogVisible.value = false;
        } else {
          ElMessage.error(`创建失败: ${store.error}`);
        }
      } else {
        console.log('Form validation failed');
      }
    });
  };

  // --- Confirm Setup Dialog (Modified) ---
  const confirmSetupDialogVisible = ref(false);
  const currentMatchToSetup = ref<TournamentMatch | null>(null);
  const matchSelectionStatus = ref<MatchSelectionStatusFrontend | null>(null); // To store the status check result
  // Removed checkingStatusMatchId as we use store.isLoading.checkingMatchSelectionStatus directly
  // Removed setupForm, confirmingSetup, selectedStage, maxInitialSongs, nextSongPickerInfo, etc.
  // Removed addSongToMatchDialogVisible, selectedSongForMatch, newMatchSongForm, songSearchQuery, debouncedSearchSongs, handleSongSelectForMatch, addSelectedSongToMatchList, removeSongFromMatchList

  const openConfirmSetupDialog = async (match: TournamentMatch) => {
      currentMatchToSetup.value = match;
      matchSelectionStatus.value = null; // Reset status when opening
      confirmSetupDialogVisible.value = true;
      // Optionally check status immediately when opening
      // await checkSelectionStatus(); // Decide if you want to auto-check on open
  };

  const checkSelectionStatus = async () => {
      if (!currentMatchToSetup.value) return;
      // Use store loading state directly
      const status = await store.fetchMatchSelectionStatus(currentMatchToSetup.value.id); // Corrected action name
      if (status) {
          matchSelectionStatus.value = status;
          ElMessage.success('选手选歌状态检查完成');
      } else {
          ElMessage.error(`检查状态失败: ${store.error}`);
      }
  };

  const compileMatchSetup = async () => {
      if (!currentMatchToSetup.value) return;
      if (!matchSelectionStatus.value?.isReadyToCompile) {
          ElMessage.warning('选手选歌尚未全部完成，无法编译歌单。');
          return;
      }

      // Use store loading state directly
      const compiledMatchResponse = await store.compileMatchSetup(currentMatchToSetup.value.id); // Get the full response

      if (compiledMatchResponse?.success) { // Check success property from the response
          ElMessage.success('歌单编译成功！赛程状态已更新为“准备开始”。');
          // Update the local currentMatchToSetup to show the compiled list
          // The store.compileMatchSetup action is planned to return the updated match in data.tournamentMatch
          if (compiledMatchResponse.tournamentMatch) {
               currentMatchToSetup.value = compiledMatchResponse.tournamentMatch;
          } else {
               // Fallback: If backend didn't return the match, find it in the store's list
               const updatedMatch = store.tournamentMatches.find(m => m.id === currentMatchToSetup.value?.id);
               if (updatedMatch) currentMatchToSetup.value = updatedMatch;
          }

          // No need to close the dialog, staff can review the compiled list
      } else {
          // Error message is already set by the store action
          ElMessage.error(`歌单编译失败: ${store.error}`);
      }
  };

  // Helper to get member nickname for display in compiled song list
  // Use the getter from the store
  const getMemberNicknameById = (memberId: number | undefined | null) => {
      return store.getMemberNicknameById(memberId);
  };

  // Helper to get team name for display in compiled song list
  // Use the getter from the store
  const getTeamNameById = (teamId: number | undefined | null) => {
      return store.getTeamNameById(teamId);
  };


  // --- Match Status Display Helpers ---
  const matchStatusTagType = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'pending_song_confirmation': return 'warning'; // Use warning for pending selection/compilation
      case 'ready_to_start': return 'success';
      case 'live': return 'primary';
      case 'completed': return 'success';
      case 'archived': return 'info';
      default: return 'info';
    }
  };

  const matchStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return '已计划';
      case 'pending_song_confirmation': return '待选手选歌/待编译'; // Updated text
      case 'ready_to_start': return '准备开始';
      case 'live': return '直播中';
      case 'completed': return '已完成';
      case 'archived': return '已归档';
      default: return '未知状态';
    }
  };

  // --- Start Live Match ---
  const startingMatchId = ref<number | null>(null);

  const startLiveMatch = async (match: TournamentMatch) => {
      if (match.status !== 'ready_to_start') {
          ElMessage.warning('赛程状态不是“准备开始”，无法启动直播。请先完成歌单编译。');
          return;
      }
       if (!match.match_song_list || match.match_song_list.length === 0) {
            ElMessage.warning('歌单为空，无法启动直播。请先编译歌单。');
            return;
       }
       if (!match.team1_player_order || match.team1_player_order.length === 0 || !match.team2_player_order || match.team2_player_order.length === 0) {
            ElMessage.warning('选手出场顺序未配置，无法启动直播。请先编译歌单。');
            return;
       }


      ElMessageBox.confirm(
          `确定要开始赛程 "${match.round_name}" 的直播吗？`,
          '提示',
          {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning',
          }
      ).then(async () => {
          startingMatchId.value = match.id;
          const result = await store.startLiveMatch(match.id);
          startingMatchId.value = null;
          if (result && result.match_do_id) {
              ElMessage.success('直播已启动！');
              // Optionally redirect to the live match view
              router.push(`/live-match/${result.match_do_id}`);
          } else {
              ElMessage.error(`启动直播失败: ${store.error}`);
          }
      }).catch(() => {
          // User cancelled
      });
  };

  </script>

  <style scoped>
  .schedule-view {
    max-width: 1200px; /* Adjust as needed */
    margin: 20px auto; /* Add some margin */
    padding: 20px;
  }
  .el-form-item {
      margin-right: 15px; /* Spacing between filter items */
      margin-bottom: 15px; /* Add bottom margin for better layout */
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
