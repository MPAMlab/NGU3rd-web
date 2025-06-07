<template>
    <div class="schedule-second-view">
      <el-card header="复赛管理" v-loading="store.isLoading.semifinalMatches || store.isLoading.members || store.isLoading.teams">
        <el-button type="primary" @click="openCreateMatchDialog">创建新复赛</el-button>

        <el-table :data="store.semifinalMatches" style="width: 100%; margin-top: 20px;" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="round_name" label="轮次" />
          <el-table-column label="选手">
            <template #default="{ row }">
              <!-- Use player_nickname fields from the backend -->
              {{ row.player1_nickname || '未知选手' }} vs {{ row.player2_nickname || '未知选手' }}
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
                v-if="row.status === 'scheduled'"
                size="small"
                type="primary"
                @click="openScoreDialog(row)"
              >
                输入分数
              </el-button>
              <el-button
                v-if="row.status === 'completed' || row.status === 'archived'"
                size="small"
                type="success"
                @click="$router.push(`/live-match-second/${row.id}`)"
              >
                查看结果/直播
              </el-button>
               <el-button
                  v-if="row.status === 'completed'"
                  size="small"
                  type="info"
                  @click="archiveMatch(row.id)"
                  :loading="store.isLoading.archivingSemifinalMatch"
               >
                   归档
               </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Create Match Dialog -->
        <el-dialog v-model="createMatchDialogVisible" title="创建新复赛" width="500px">
          <el-form :model="newMatchForm" ref="newMatchFormRef" label-width="100px">
            <el-form-item label="轮次名称" prop="round_name" :rules="[{ required: true, message: '请输入轮次名称', trigger: 'blur' }]">
              <el-input v-model="newMatchForm.round_name" />
            </el-form-item>

            <!-- Team and Player Selection for Player 1 -->
            <!-- MODIFICATION: Use team_code instead of team_id -->
            <el-form-item label="队伍 A" prop="team1_code" :rules="[{ required: true, message: '请选择队伍 A', trigger: 'change' }]">
                <el-select v-model="selectedTeam1Code" placeholder="选择队伍 A" @change="newMatchForm.player1_id = null">
                    <!-- Assuming Team interface has 'code' and 'name' -->
                    <el-option v-for="team in store.teams" :key="team.code" :label="team.name" :value="team.code" />
                </el-select>
            </el-form-item>
            <el-form-item label="选手 A" prop="player1_id" :rules="[{ required: true, message: '请选择选手 A', trigger: 'change' }]">
              <!-- MODIFICATION: Disable based on selectedTeam1Code -->
              <el-select v-model="newMatchForm.player1_id" placeholder="选择选手 A" :disabled="!selectedTeam1Code">
                <el-option
                    v-for="member in filteredMembersTeam1"
                    :key="member.id"
                    :label="formatMemberLabel(member)"
                    :value="member.id"
                ></el-option>
              </el-select>
            </el-form-item>

            <!-- Team and Player Selection for Player 2 -->
             <!-- MODIFICATION: Use team_code instead of team_id -->
             <el-form-item label="队伍 B" prop="team2_code" :rules="[{ required: true, message: '请选择队伍 B', trigger: 'change' }]">
                <el-select v-model="selectedTeam2Code" placeholder="选择队伍 B" @change="newMatchForm.player2_id = null">
                     <!-- Assuming Team interface has 'code' and 'name' -->
                    <el-option v-for="team in store.teams" :key="team.code" :label="team.name" :value="team.code" />
                </el-select>
            </el-form-item>
            <el-form-item label="选手 B" prop="player2_id" :rules="[{ required: true, message: '请选择选手 B', trigger: 'change' }]">
               <!-- MODIFICATION: Disable based on selectedTeam2Code -->
              <el-select v-model="newMatchForm.player2_id" placeholder="选择选手 B" :disabled="!selectedTeam2Code">
                <el-option
                    v-for="member in filteredMembersTeam2"
                    :key="member.id"
                    :label="formatMemberLabel(member)"
                    :value="member.id"
                ></el-option>
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
            <el-button type="primary" @click="submitCreateMatchForm" :loading="store.isLoading.creatingSemifinalMatch">创建</el-button>
          </template>
        </el-dialog>

        <!-- Score Input Dialog -->
        <el-dialog v-model="scoreDialogVisible" :title="`输入比赛分数: ${currentMatch?.round_name}`" width="600px">
          <div v-if="currentMatch">
            <el-form :model="scoreForm">
              <el-row :gutter="20">
                <el-col :span="12">
                  <!-- Display player 1 info including profession from match data -->
                  <el-card :header="`${currentMatch.player1_nickname || '选手 A'} (${currentMatch.player1_profession || '未知职业'})`">
                    <!-- Removed manual profession select -->
                    <el-form-item label="完成率">
                      <el-input-number v-model="scoreForm.player1.percentage" :precision="4" :step="0.0001" :min="0" :max="101" />%
                    </el-form-item>
                  </el-card>
                </el-col>
                <el-col :span="12">
                   <!-- Display player 2 info including profession from match data -->
                  <el-card :header="`${currentMatch.player2_nickname || '选手 B'} (${currentMatch.player2_profession || '未知职业'})`">
                    <!-- Removed manual profession select -->
                    <el-form-item label="完成率">
                      <el-input-number v-model="scoreForm.player2.percentage" :precision="4" :step="0.0001" :min="0" :max="101" />%
                    </el-form-item>
                  </el-card>
                </el-col>
              </el-row>
            </el-form>
            <el-divider>计分结果</el-divider>

            <!-- Display results fetched from backend after submission -->
            <div v-if="currentMatch.results">
              <el-row :gutter="20">
                <el-col :span="12">
                  <!-- Use profession from results if available, fallback to match data -->
                  <el-card :header="`${currentMatch.results.player1.nickname || '选手 A'} (${currentMatch.results.player1.profession || currentMatch.player1_profession || '未知职业'})`">
                    <!-- Display submitted percentage from the match object -->
                    <p><strong>完成率:</strong> {{ currentMatch.player1_percentage?.toFixed(4) || '0' }}%</p>
                    <!-- Ensure results properties are numbers before toFixed -->
                    <p><strong>原始得分:</strong> {{ typeof currentMatch.results.player1.originalScore === 'number' ? currentMatch.results.player1.originalScore.toFixed(4) : 'N/A' }}</p>
                    <p><strong>技能加成:</strong> {{ typeof currentMatch.results.player1.bonusScore === 'number' ? currentMatch.results.player1.bonusScore.toFixed(4) : 'N/A' }}</p>
                    <p><strong>最终得分:</strong> {{ typeof currentMatch.results.player1.totalScore === 'number' ? currentMatch.results.player1.totalScore.toFixed(4) : 'N/A' }}</p>
                    <el-divider>计分日志</el-divider>
                    <ul>
                      <li v-for="(log, index) in currentMatch.results.player1.log" :key="`p1-log-${index}`">{{ log }}</li>
                    </ul>
                  </el-card>
                </el-col>
                <el-col :span="12">
                   <!-- Use profession from results if available, fallback to match data -->
                   <el-card :header="`${currentMatch.results.player2.nickname || '选手 B'} (${currentMatch.results.player2.profession || currentMatch.player2_profession || '未知职业'})`">
                     <!-- Display submitted percentage from the match object -->
                     <p><strong>完成率:</strong> {{ currentMatch.player2_percentage?.toFixed(4) || '0' }}%</p>
                     <!-- Ensure results properties are numbers before toFixed -->
                    <p><strong>原始得分:</strong> {{ typeof currentMatch.results.player2.originalScore === 'number' ? currentMatch.results.player2.originalScore.toFixed(4) : 'N/A' }}</p>
                    <p><strong>技能加成:</strong> {{ typeof currentMatch.results.player2.bonusScore === 'number' ? currentMatch.results.player2.bonusScore.toFixed(4) : 'N/A' }}</p>
                    <p><strong>最终得分:</strong> {{ typeof currentMatch.results.player2.totalScore === 'number' ? currentMatch.results.player2.totalScore.toFixed(4) : 'N/A' }}</p>
                    <el-divider>计分日志</el-divider>
                    <ul>
                      <li v-for="(log, index) in currentMatch.results.player2.log" :key="`p2-log-${index}`">{{ log }}</li>
                    </ul>
                  </el-card>
                </el-col>
              </el-row>

              <el-alert
                  v-if="currentMatch.winner_player_id"
                  :title="`${store.getMemberNicknameById(currentMatch.winner_player_id)} 获胜！`"
                  type="success"
                  style="margin-top: 20px;"
              />
               <el-alert
                   v-else-if="currentMatch.results && typeof currentMatch.results.player1.totalScore === 'number' && typeof currentMatch.results.player2.totalScore === 'number' && currentMatch.results.player1.totalScore === currentMatch.results.player2.totalScore"
                   title="比赛平局！"
                   type="info"
                   style="margin-top: 20px;"
               />
            </div>
             <div v-else>
                 <el-empty description="请先计算分数"></el-empty>
             </div>
          </div>

          <template #footer>
            <el-button @click="scoreDialogVisible = false">关闭</el-button>
            <el-button
                type="success"
                @click="submitScores"
                :loading="store.isLoading.submittingSemifinalResults"
                :disabled="scoreForm.player1.percentage === 0 || scoreForm.player2.percentage === 0"
            >
                提交并计算分数
            </el-button>
          </template>
        </el-dialog>

      </el-card>
    </div>
  </template>

  <script setup lang="ts">
  import { useAppStore, type SemifinalMatch, type CreateSemifinalMatchPayloadFrontend, type SubmitSemifinalScoresPayload, type Profession, type Member, type Team } from '@/store'; // Import Team type
  import { onMounted, ref, reactive, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, type FormInstance } from 'element-plus';

  const store = useAppStore();
  const router = useRouter();

  // --- Data Fetching ---
  onMounted(() => {
    store.fetchSemifinalMatches(); // Fetch only semifinal matches from the new table
    store.fetchMembers(); // Needed for player selects and display
    store.fetchTeams(); // Needed for team selects
  });

  // --- Create Match Dialog ---
  const createMatchDialogVisible = ref(false);
  const newMatchFormRef = ref<FormInstance>();
  // Use the frontend payload type for the form
  const newMatchForm = reactive<CreateSemifinalMatchPayloadFrontend>({
    round_name: '',
    player1_id: null,
    player2_id: null,
    scheduled_time: null,
  });

  // State for team selection in the create dialog (UI only)
  // MODIFICATION: Use team_code instead of team_id
  const selectedTeam1Code = ref<string | null>(null);
  const selectedTeam2Code = ref<string | null>(null);

  // Computed properties to filter members by selected team code
  const filteredMembersTeam1 = computed(() => {
      if (!selectedTeam1Code.value) {
          return [];
      }
      // MODIFICATION: Filter by team_code
      return store.members.filter(member => member.team_code === selectedTeam1Code.value);
  });

  const filteredMembersTeam2 = computed(() => {
      if (!selectedTeam2Code.value) {
          return [];
      }
       // MODIFICATION: Filter by team_code
      return store.members.filter(member => member.team_code === selectedTeam2Code.value);
  });

  // Helper to format member label for select options
  const formatMemberLabel = (member: Member): string => {
      // Assuming member object has nickname, job, and color (for element)
      const profession = member.job || '未知职业';
      const element = member.color || '未知元素'; // MODIFICATION: Use color for element
      return `${member.nickname} (${element}, ${profession})`;
  };


  const openCreateMatchDialog = () => {
    // Reset form and team selections
    newMatchForm.round_name = '';
    newMatchForm.player1_id = null;
    newMatchForm.player2_id = null;
    newMatchForm.scheduled_time = null;
    // MODIFICATION: Reset team codes
    selectedTeam1Code.value = null;
    selectedTeam2Code.value = null;
    createMatchDialogVisible.value = true;
  };

  const submitCreateMatchForm = async () => {
    if (!newMatchFormRef.value) return;
    await newMatchFormRef.value.validate(async (valid) => {
      if (valid) {
        if (newMatchForm.player1_id === newMatchForm.player2_id) {
          ElMessage.warning('选手 A 和选手 B 不能是同一个选手');
          return;
        }
        // Call the store action to create a semifinal match
        // The payload only needs player IDs, backend fetches professions etc.
        const result = await store.createSemifinalMatch(newMatchForm);
        if (result) {
          ElMessage.success('复赛创建成功');
          createMatchDialogVisible.value = false;
        } else {
          ElMessage.error(`创建失败: ${store.error}`);
        }
      } else {
        console.log('Form validation failed');
      }
    });
  };

  // --- Score Dialog ---
  const scoreDialogVisible = ref(false);
  const currentMatch = ref<SemifinalMatch | null>(null); // Store the full SemifinalMatch object
  const scoreForm = reactive({
    player1: {
      // Profession is not selected here, it's derived from currentMatch
      percentage: 0
    },
    player2: {
      // Profession is not selected here, it's derived from currentMatch
      percentage: 0
    }
  });

  const openScoreDialog = (match: SemifinalMatch) => {
    currentMatch.value = match;
    // Reset form, populate if results already exist (e.g., reopening dialog)
    // Use the percentage stored on the match object itself if available
    scoreForm.player1.percentage = match.player1_percentage || 0;
    scoreForm.player2.percentage = match.player2_percentage || 0;

    // Profession is NOT set in the form, it's taken from currentMatch for display and payload
    // scoreForm.player1.profession = (match.player1_profession as Profession) || '绝剑士'; // No longer needed in form
    // scoreForm.player2.profession = (match.player2_profession as Profession) || '绝剑士'; // No longer needed in form


    scoreDialogVisible.value = true;
  };

  const submitScores = async () => {
    if (!currentMatch.value) return;

    // Get the actual professions from the currentMatch object (fetched from backend)
    const player1Profession = currentMatch.value.player1_profession;
    const player2Profession = currentMatch.value.player2_profession;

    // Basic validation for percentage input
    if (scoreForm.player1.percentage === 0 || scoreForm.player2.percentage === 0) {
         ElMessage.warning('完成率不能为 0');
         return;
    }
     // Check if professions were successfully fetched and are valid
     if (!player1Profession || !player2Profession || !['矩盾手', '炼星师', '绝剑士'].includes(player1Profession) || !['矩盾手', '炼星师', '绝剑士'].includes(player2Profession)) {
          ElMessage.error('无法获取选手职业信息或职业无效，请检查选手数据');
          console.error("Attempted to submit scores with invalid professions:", { player1Profession, player2Profession });
          return;
     }


    const payload: SubmitSemifinalScoresPayload = {
      player1: {
        id: currentMatch.value.player1_id, // Use player_id from the match object
        profession: player1Profession as Profession, // Use profession from match data (fetched from backend)
        percentage: scoreForm.player1.percentage
      },
      player2: {
        id: currentMatch.value.player2_id, // Use player_id from the match object
        profession: player2Profession as Profession, // Use profession from match data (fetched from backend)
        percentage: scoreForm.player2.percentage
      }
    };

    // Call the store action to submit scores to the backend
    const result = await store.submitSemifinalResults(currentMatch.value.id, payload);

    if (result) {
      ElMessage.success('比赛结果已提交并计算');
      // The store action already updates the specific match in the list and currentMatch if it's the same.
      // The dialog will automatically update because currentMatch is reactive.
      // Keep dialog open to show results, or close if preferred
      // scoreDialogVisible.value = false;
    } else {
      ElMessage.error(`提交失败: ${store.error}`);
    }
  };

  const archiveMatch = async (matchId: number) => {
      await store.archiveSemifinalMatch(matchId);
      // The store action shows message and updates the list/current match
  }


  // --- Helper Functions ---
  const matchStatusTagType = (status: SemifinalMatch['status']) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'completed': return 'success';
      case 'archived': return 'info';
      default: return 'info';
    }
  };

  const matchStatusText = (status: SemifinalMatch['status']) => {
    switch (status) {
      case 'scheduled': return '待开始';
      case 'completed': return '已完成';
      case 'archived': return '已归档';
      default: return status;
    }
  };
  </script>

  <style scoped>
  .schedule-second-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  </style>
