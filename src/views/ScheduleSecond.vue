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

        <!-- Create Match Dialog (No changes needed here for the profession display issue) -->
        <el-dialog v-model="createMatchDialogVisible" title="创建新复赛" width="500px">
          <el-form :model="newMatchForm" ref="newMatchFormRef" label-width="100px">
            <el-form-item label="轮次名称" prop="round_name" :rules="[{ required: true, message: '请输入轮次名称', trigger: 'blur' }]">
              <el-input v-model="newMatchForm.round_name" />
            </el-form-item>

            <el-form-item label="队伍 A" prop="team1_code" :rules="[{ required: true, message: '请选择队伍 A', trigger: 'change' }]">
                <el-select v-model="newMatchForm.team1_code" placeholder="选择队伍 A" @change="newMatchForm.player1_id = null">
                    <el-option v-for="team in store.teams" :key="team.code" :label="team.name" :value="team.code" />
                </el-select>
            </el-form-item>
            <el-form-item label="选手 A" prop="player1_id" :rules="[{ required: true, message: '请选择选手 A', trigger: 'change' }]">
              <el-select v-model="newMatchForm.player1_id" placeholder="选择选手 A" :disabled="!newMatchForm.team1_code">
                <el-option
                    v-for="member in filteredMembersTeam1"
                    :key="member.id"
                    :label="formatMemberLabel(member)"
                    :value="member.id"
                ></el-option>
              </el-select>
            </el-form-item>

             <el-form-item label="队伍 B" prop="team2_code" :rules="[{ required: true, message: '请选择队伍 B', trigger: 'change' }]">
                <el-select v-model="newMatchForm.team2_code" placeholder="选择队伍 B" @change="newMatchForm.player2_id = null">
                    <el-option v-for="team in store.teams" :key="team.code" :label="team.name" :value="team.code" />
                </el-select>
            </el-form-item>
            <el-form-item label="选手 B" prop="player2_id" :rules="[{ required: true, message: '请选择选手 B', trigger: 'change' }]">
              <el-select v-model="newMatchForm.player2_id" placeholder="选择选手 B" :disabled="!newMatchForm.team2_code">
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
                  <!-- Use computed property for profession display -->
                  <el-card :header="`${currentMatch.player1_nickname || '选手 A'} (${player1ProfessionDisplay})`">
                    <el-form-item label="完成率">
                      <el-input-number v-model="scoreForm.player1.percentage" :precision="4" :step="0.0001" :min="0" :max="101" />%
                    </el-form-item>
                  </el-card>
                </el-col>
                <el-col :span="12">
                   <!-- Use computed property for profession display -->
                  <el-card :header="`${currentMatch.player2_nickname || '选手 B'} (${player2ProfessionDisplay})`">
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
                  <!-- Use profession from results if available (should be Chinese from backend now), fallback to computed property (Chinese) -->
                  <el-card :header="`${currentMatch.results.player1.nickname || '选手 A'} (${currentMatch.results.player1.profession || player1ProfessionDisplay})`">
                    <p><strong>完成率:</strong> {{ currentMatch.player1_percentage?.toFixed(4) || '0' }}%</p>
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
                   <!-- Use profession from results if available (should be Chinese from backend now), fallback to computed property (Chinese) -->
                   <el-card :header="`${currentMatch.results.player2.nickname || '选手 B'} (${currentMatch.results.player2.profession || player2ProfessionDisplay})`">
                     <p><strong>完成率:</strong> {{ currentMatch.player2_percentage?.toFixed(4) || '0' }}%</p>
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
  import { useAppStore, type SemifinalMatch, type CreateSemifinalMatchPayloadFrontend, type SubmitSemifinalScoresPayload, type Profession, type Member, type Team } from '@/store';
  import { onMounted, ref, reactive, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { ElMessage, type FormInstance } from 'element-plus';

  const store = useAppStore();
  const router = useRouter();

  // --- Data Fetching ---
  onMounted(() => {
    store.fetchSemifinalMatches();
    store.fetchMembers(); // This fetches members with professions (English job names)
    store.fetchTeams();
  });

  // --- Profession Mapping (English from DB/Store to Chinese for Backend Payload) ---
  // Define the mapping from English job (from store.members) to Chinese Profession (for backend payload)
  // IMPORTANT: Confirm these English keys match the 'job' values in your members data
  const professionMap: Record<string, Profession> = {
      'defender': '矩盾手',
      'supporter': '炼星师', // Assuming 'supporter' maps to '炼星师'
      'attacker': '绝剑士', // Assuming 'attacker' maps to '绝剑士'
      // Add other mappings if necessary
  };

  // --- Create Match Dialog ---
  const createMatchDialogVisible = ref(false);
  const newMatchFormRef = ref<FormInstance>();
  const newMatchForm = reactive<CreateSemifinalMatchPayloadFrontend & { team1_code: string | null; team2_code: string | null }>({
    round_name: '',
    player1_id: null,
    player2_id: null,
    scheduled_time: null,
    team1_code: null,
    team2_code: null,
  });

  const filteredMembersTeam1 = computed(() => {
      if (!newMatchForm.team1_code) {
          return [];
      }
      return store.members.filter(member => member.team_code === newMatchForm.team1_code);
  });

  const filteredMembersTeam2 = computed(() => {
      if (!newMatchForm.team2_code) {
          return [];
      }
      return store.members.filter(member => member.team_code === newMatchForm.team2_code);
  });

  // formatMemberLabel still uses the raw job string from member (English)
  const formatMemberLabel = (member: Member): string => {
      const profession = member.job || '未知职业'; // This will show English job name in dropdown
      const element = member.color || '未知元素';
      return `${member.nickname} (${element}, ${profession})`;
  };

  const openCreateMatchDialog = () => {
    newMatchForm.round_name = '';
    newMatchForm.player1_id = null;
    newMatchForm.player2_id = null;
    newMatchForm.scheduled_time = null;
    newMatchForm.team1_code = null;
    newMatchForm.team2_code = null;
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
        const payloadToSend = {
            round_name: newMatchForm.round_name,
            player1_id: newMatchForm.player1_id,
            player2_id: newMatchForm.player2_id,
            scheduled_time: newMatchForm.scheduled_time,
        };
        const result = await store.createSemifinalMatch(payloadToSend);
        if (result) {
          ElMessage.success('复赛创建成功');
          createMatchDialogVisible.value = false;
        } else {
          ElMessage.error(`创建失败: ${store.error || '未知错误'}`);
        }
      } else {
        console.log('Form validation failed');
      }
    });
  };

  // --- Score Dialog ---
  const scoreDialogVisible = ref(false);
  const currentMatch = ref<SemifinalMatch | null>(null);
  const scoreForm = reactive({
    player1: {
      percentage: 0
    },
    player2: {
      percentage: 0
    }
  });

  // Computed properties to get player professions from store.members and map to Chinese for display
  const player1ProfessionDisplay = computed(() => {
      if (!currentMatch.value || !currentMatch.value.player1_id) return '未知职业';
      const member = store.members.find(m => m.id === currentMatch.value?.player1_id);
      const englishJob = member?.job || '';
      // Use the map for display as well
      return professionMap[englishJob] || englishJob || '未知职业'; // Fallback to English if mapping fails
  });

  const player2ProfessionDisplay = computed(() => {
      if (!currentMatch.value || !currentMatch.value.player2_id) return '未知职业';
      const member = store.members.find(m => m.id === currentMatch.value?.player2_id);
      const englishJob = member?.job || '';
      // Use the map for display as well
      return professionMap[englishJob] || englishJob || '未知职业'; // Fallback to English if mapping fails
  });


  const openScoreDialog = (match: SemifinalMatch) => {
    currentMatch.value = match;
    scoreForm.player1.percentage = match.player1_percentage || 0;
    scoreForm.player2.percentage = match.player2_percentage || 0;

    scoreDialogVisible.value = true;
  };

  const submitScores = async () => {
    if (!currentMatch.value) return;

    // Get the actual professions (English job names) by looking up in store.members
    const player1Member = store.members.find(m => m.id === currentMatch.value?.player1_id);
    const player2Member = store.members.find(m => m.id === currentMatch.value?.player2_id);

    const player1EnglishJob = player1Member?.job;
    const player2EnglishJob = player2Member?.job;

    // --- NEW: Map English job names to Chinese Profession names for the payload ---
    const player1ProfessionForPayload = player1EnglishJob ? professionMap[player1EnglishJob] : null;
    const player2ProfessionForPayload = player2EnglishJob ? professionMap[player2EnglishJob] : null;
    // --- END NEW ---


    // Basic validation for percentage input
    if (scoreForm.player1.percentage === 0 || scoreForm.player2.percentage === 0) {
         ElMessage.warning('完成率不能为 0');
         return;
    }

     // Check if professions were successfully fetched AND mapped to valid Chinese professions
     // Use the MAPPED professions for validation against the Chinese list
     if (!player1ProfessionForPayload || !player2ProfessionForPayload || !['矩盾手', '炼星师', '绝剑士'].includes(player1ProfessionForPayload) || !['矩盾手', '炼星师', '绝剑士'].includes(player2ProfessionForPayload)) {
          ElMessage.error('无法获取选手职业信息或职业无效，请检查选手数据');
          console.error("Attempted to submit scores with invalid or unmapped professions:", { player1EnglishJob, player2EnglishJob, player1ProfessionForPayload, player2ProfessionForPayload });
          return;
     }


    const payload: SubmitSemifinalScoresPayload = {
      player1: {
        id: currentMatch.value.player1_id,
        profession: player1ProfessionForPayload, // Use the MAPPED Chinese profession
        percentage: scoreForm.player1.percentage
      },
      player2: {
        id: currentMatch.value.player2_id,
        profession: player2ProfessionForPayload, // Use the MAPPED Chinese profession
        percentage: scoreForm.player2.percentage
      }
    };

    const result = await store.submitSemifinalResults(currentMatch.value.id, payload);

    if (result) {
      ElMessage.success('比赛结果已提交并计算');
      // Dialog stays open to show results
    } else {
      ElMessage.error(`提交失败: ${store.error || '未知错误'}`);
    }
  };

  const archiveMatch = async (matchId: number) => {
      await store.archiveSemifinalMatch(matchId);
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
