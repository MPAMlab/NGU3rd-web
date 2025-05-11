<template>
    <div class="schedule-view">
      <el-card header="赛程管理" v-loading="store.isLoading.tournamentMatches || store.isLoading.teams || store.isLoading.members || store.isLoading.songs">
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
              >
                  配置歌单/顺序
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
  
        <!-- Confirm Setup Dialog -->
        <el-dialog v-model="confirmSetupDialogVisible" :title="`配置赛程: ${currentMatchToSetup?.round_name}`" width="800px">
            <div v-if="currentMatchToSetup">
                <el-alert type="info" :closable="false" style="margin-bottom: 20px;">
                    请配置队伍出场顺序和比赛歌单。
                </el-alert>
  
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-card :header="`${currentMatchToSetup.team1_name} 出场顺序`">
                            <!-- Simple list for player order - replace with ElTransfer or drag/drop if needed -->
                            <el-select
                                v-model="setupForm.team1_player_order"
                                multiple
                                placeholder="选择队伍 A 选手 (按顺序)"
                                style="width: 100%;"
                                filterable
                            >
                                <el-option
                                    v-for="member in team1Members"
                                    :key="member.id"
                                    :label="member.nickname"
                                    :value="member.id"
                                />
                            </el-select>
                             <el-text type="info" size="small">请按实际出场顺序选择选手ID</el-text>
                        </el-card>
                    </el-col>
                     <el-col :span="12">
                        <el-card :header="`${currentMatchToSetup.team2_name} 出场顺序`">
                             <!-- Simple list for player order -->
                            <el-select
                                v-model="setupForm.team2_player_order"
                                multiple
                                placeholder="选择队伍 B 选手 (按顺序)"
                                style="width: 100%;"
                                filterable
                            >
                                <el-option
                                    v-for="member in team2Members"
                                    :key="member.id"
                                    :label="member.nickname"
                                    :value="member.id"
                                />
                            </el-select>
                             <el-text type="info" size="small">请按实际出场顺序选择选手ID</el-text>
                        </el-card>
                    </el-col>
                </el-row>
  
                <el-card header="比赛歌单" style="margin-top: 20px;">
                    <el-button type="primary" @click="openAddSongToMatchDialog">添加歌曲到歌单</el-button>
  
                    <el-table :data="setupForm.match_song_list" style="width: 100%; margin-top: 10px;" border stripe>
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
                                {{ getMemberNicknameById(row.picker_member_id) }} ({{ getTeamNameById(row.picker_team_id) }})
                            </template>
                        </el-table-column>
                         <el-table-column label="操作" width="100">
                             <template #default="{ $index }">
                                 <el-button size="small" type="danger" @click="removeSongFromMatchList($index)">删除</el-button>
                             </template>
                         </el-table-column>
                    </el-table>
                </el-card>
            </div>
            <template #footer>
                <el-button @click="confirmSetupDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitConfirmSetupForm" :loading="confirmingSetup">确认配置</el-button>
            </template>
        </el-dialog>
  
         <!-- Add Song to Match Dialog -->
         <el-dialog v-model="addSongToMatchDialogVisible" title="添加歌曲到歌单" width="600px">
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
                 @current-change="handleSongSelectForMatch"
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
  
             <el-form v-if="selectedSongForMatch" :model="newMatchSongForm" style="margin-top: 20px;" label-width="100px">
                 <el-form-item label="已选歌曲">
                     <el-text>{{ selectedSongForMatch.title }}</el-text>
                 </el-form-item>
                 <el-form-item label="选择难度" prop="selected_difficulty" :rules="[{ required: true, message: '请选择难度', trigger: 'change' }]">
                     <el-select v-model="newMatchSongForm.selected_difficulty" placeholder="选择难度">
                         <el-option
                             v-for="(level, diff) in selectedSongForMatch.parsedLevels"
                             :key="diff"
                             :label="`${diff} ${level}`"
                             :value="diff"
                             :disabled="!level"
                         />
                     </el-select>
                 </el-form-item>
                 <el-form-item label="选曲队伍" prop="picker_team_id" :rules="[{ required: true, message: '请选择选曲队伍', trigger: 'change' }]">
                     <el-select v-model="newMatchSongForm.picker_team_id" placeholder="选择选曲队伍">
                         <el-option :label="currentMatchToSetup?.team1_name" :value="currentMatchToSetup?.team1_id" />
                         <el-option :label="currentMatchToSetup?.team2_name" :value="currentMatchToSetup?.team2_id" />
                     </el-select>
                 </el-form-item>
                  <el-form-item label="选曲选手" prop="picker_member_id" :rules="[{ required: true, message: '请选择选曲选手', trigger: 'change' }]">
                     <el-select v-model="newMatchSongForm.picker_member_id" placeholder="选择选曲选手">
                         <el-option
                             v-for="member in pickerTeamMembers"
                             :key="member.id"
                             :label="member.nickname"
                             :value="member.id"
                         />
                     </el-select>
                 </el-select>
                 </el-form-item>
             </el-form>
  
             <template #footer>
                 <el-button @click="addSongToMatchDialogVisible = false">取消</el-button>
                 <el-button type="primary" @click="addSelectedSongToMatchList" :disabled="!selectedSongForMatch || !newMatchSongForm.selected_difficulty || !newMatchSongForm.picker_member_id">添加到歌单</el-button>
             </template>
         </el-dialog>
  
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore, type TournamentMatch, type CreateTournamentMatchPayload, type ConfirmMatchSetupPayload, type MatchSong, type Song, type Member } from '@/store';
  import { onMounted, ref, reactive, computed } from 'vue';
  import { useRouter } from 'vue-router'; // <-- Import useRouter
  import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
  import { debounce } from 'lodash-es';
  
  const store = useAppStore();
  const router = useRouter(); // <-- Get router instance
  
  // --- Data Fetching ---
  onMounted(() => {
    store.fetchTournamentMatches();
    store.fetchTeams(); // Needed for team selects
    store.fetchMembers(); // Needed for player selects
    store.fetchSongs(); // Needed for song selection
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
  
  // --- Confirm Setup Dialog ---
  const confirmSetupDialogVisible = ref(false);
  const currentMatchToSetup = ref<TournamentMatch | null>(null);
  const setupForm = reactive<ConfirmMatchSetupPayload>({
      team1_player_order: [],
      team2_player_order: [],
      match_song_list: [],
  });
  const confirmingSetup = ref(false);
  
  const team1Members = computed(() => {
      if (!currentMatchToSetup.value) return [];
      const team1Code = store.teams.find(t => t.id === currentMatchToSetup.value?.team1_id)?.code;
      return store.members.filter(m => m.team_code === team1Code);
  });
  
  const team2Members = computed(() => {
      if (!currentMatchToSetup.value) return [];
       const team2Code = store.teams.find(t => t.id === currentMatchToSetup.value?.team2_id)?.code;
      return store.members.filter(m => m.team_code === team2Code);
  });
  
  const getMemberNicknameById = (memberId: number) => {
      const member = store.members.find(m => m.id === memberId);
      return member?.nickname || '未知选手';
  };
  
  const getTeamNameById = (teamId: number) => {
      const team = store.teams.find(t => t.id === teamId);
      return team?.name || '未知队伍';
  };
  
  
  const openConfirmSetupDialog = (match: TournamentMatch) => {
      currentMatchToSetup.value = match;
      // Initialize form with existing data if any
      setupForm.team1_player_order = match.team1_player_order || [];
      setupForm.team2_player_order = match.team2_player_order || [];
      setupForm.match_song_list = match.match_song_list || [];
      confirmSetupDialogVisible.value = true;
  };
  
  const submitConfirmSetupForm = async () => {
      if (!currentMatchToSetup.value) return;
  
      if (setupForm.team1_player_order.length === 0 || setupForm.team2_player_order.length === 0) {
          ElMessage.warning('请配置双方队伍的出场顺序');
          return;
      }
       if (setupForm.match_song_list.length === 0) {
          ElMessage.warning('请添加比赛歌曲到歌单');
          return;
      }
  
      confirmingSetup.value = true;
      const result = await store.confirmMatchSetup(currentMatchToSetup.value.id, setupForm);
      confirmingSetup.value = false;
  
      if (result) {
          ElMessage.success('赛程配置成功');
          confirmSetupDialogVisible.value = false;
      } else {
          ElMessage.error(`配置失败: ${store.error}`);
      }
  };
  
  // --- Add Song to Match Dialog ---
  const addSongToMatchDialogVisible = ref(false);
  const songSearchQuery = ref('');
  const selectedSongForMatch = ref<Song | null>(null);
  const newMatchSongForm = reactive<{
      selected_difficulty: string; // <-- Changed from null to string
      picker_team_id: number | null;
      picker_member_id: number | null;
  }>({
      selected_difficulty: '', // <-- Changed from null to ''
      picker_team_id: null,
      picker_member_id: null,
  });
  
  const pickerTeamMembers = computed(() => {
      if (!newMatchSongForm.picker_team_id) return [];
      const teamCode = store.teams.find(t => t.id === newMatchSongForm.picker_team_id)?.code;
      return store.members.filter(m => m.team_code === teamCode);
  });
  
  
  const openAddSongToMatchDialog = () => {
      songSearchQuery.value = '';
      selectedSongForMatch.value = null;
      newMatchSongForm.selected_difficulty = ''; // <-- Changed from null to ''
      newMatchSongForm.picker_team_id = null;
      newMatchSongForm.picker_member_id = null;
      store.fetchSongs(); // Refresh song list
      addSongToMatchDialogVisible.value = true;
  };
  
  const debouncedSearchSongs = debounce(() => {
      store.fetchSongs({ search: songSearchQuery.value });
  }, 300); // Debounce search by 300ms
  
  const handleSongSelectForMatch = (song: Song) => {
      selectedSongForMatch.value = song;
      // Reset difficulty and picker when song changes
      newMatchSongForm.selected_difficulty = ''; // <-- Changed from null to ''
      newMatchSongForm.picker_team_id = null;
      newMatchSongForm.picker_member_id = null;
  };
  
  const addSelectedSongToMatchList = () => {
      if (!selectedSongForMatch.value || !newMatchSongForm.selected_difficulty || !newMatchSongForm.picker_member_id || !newMatchSongForm.picker_team_id) {
          ElMessage.warning('请选择歌曲、难度、选曲队伍和选手');
          return;
      }
  
      const song = selectedSongForMatch.value;
      const difficulty = newMatchSongForm.selected_difficulty;
      const pickerMemberId = newMatchSongForm.picker_member_id;
      const pickerTeamId = newMatchSongForm.picker_team_id;
  
      const parsedLevels = song.parsedLevels || {};
      const difficultyValue = parsedLevels[difficulty as keyof typeof parsedLevels] || '??';
      const fullDifficultyString = `${difficulty} ${difficultyValue}`;
  
      const newMatchSong: MatchSong = {
          song_id: song.id,
          song_title: song.title,
          song_difficulty: fullDifficultyString,
          song_element: song.category === 'original' ? 'fire' : song.category === 'niconico' ? 'wood' : null, // Example mapping
          cover_filename: song.cover_filename,
          bpm: song.bpm,
          fullCoverUrl: song.fullCoverUrl, // Use the URL provided by the backend
          picker_member_id: pickerMemberId,
          picker_team_id: pickerTeamId,
          is_tiebreaker_song: false, // Default to false for initial list
          status: 'pending',
      };
  
      setupForm.match_song_list.push(newMatchSong);
      addSongToMatchDialogVisible.value = false;
      selectedSongForMatch.value = null; // Clear selection
  };
  
  const removeSongFromMatchList = (index: number) => {
      setupForm.match_song_list.splice(index, 1);
  };
  
  
  // --- Start Live Match ---
  const startingMatchId = ref<number | null>(null);
  const startLiveMatch = async (match: TournamentMatch) => {
      if (!match.id) return;
      startingMatchId.value = match.id;
      const result = await store.startLiveMatch(match.id);
      startingMatchId.value = null;
      if (result && result.match_do_id) {
          ElMessage.success('比赛已开始直播');
          // Navigate to the live match view
          router.push(`/live-match/${result.match_do_id}`);
      } else {
          ElMessage.error(`开始直播失败: ${store.error}`);
      }
  };
  
  
  // --- Helpers ---
  const matchStatusTagType = (status: TournamentMatch['status']) => {
      switch (status) {
          case 'live': return 'success';
          case 'ready_to_start': return 'warning';
          case 'scheduled':
          case 'pending_song_confirmation': return 'info';
          case 'completed':
          case 'archived': return 'info';
          default: return 'info';
      }
  };
  
  const matchStatusText = (status: TournamentMatch['status']) => {
       switch (status) {
          case 'scheduled': return '已排程';
          case 'pending_song_confirmation': return '待确认歌单';
          case 'ready_to_start': return '准备就绪';
          case 'live': return '进行中';
          case 'completed': return '已完成';
          case 'archived': return '已归档';
          default: return '未知状态';
      }
  };
  
  </script>
  
  <style scoped>
  .schedule-view {
    max-width: 1200px;
    margin: 0 auto;
  }
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
  </style>
  