<template>
    <div class="live-match-second-view">
      <el-card v-if="store.currentSemifinalMatch" :header="`复赛直播: ${store.currentSemifinalMatch.round_name}`" v-loading="store.isLoading.currentSemifinalMatch">
        <el-alert
          v-if="store.currentSemifinalMatch.status === 'completed'"
          title="比赛已结束"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
        <el-alert
          v-else-if="store.currentSemifinalMatch.status === 'archived'"
          title="比赛已归档"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
         <el-alert
          v-else-if="store.currentSemifinalMatch.status === 'scheduled'"
          title="比赛尚未开始"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px;"
        />
  
  
        <el-row :gutter="20">
          <!-- Player A -->
          <el-col :span="12">
            <el-card :header="store.currentSemifinalMatch.player1_nickname || '选手 A'">
              <!-- Display submitted percentage from the match object -->
              <div class="player-info" v-if="store.currentSemifinalMatch.player1_percentage !== null && store.currentSemifinalMatch.player1_percentage !== undefined">
                <p><strong>完成率:</strong> {{ store.currentSemifinalMatch.player1_percentage.toFixed(4) || '0' }}%</p>
                <p><strong>职业:</strong> {{ store.currentSemifinalMatch.player1_profession || '未知' }}</p>
                <!-- Display calculated scores from the results object -->
                <template v-if="store.currentSemifinalMatch.results?.player1">
                  <p><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player1.originalScore.toFixed(4) || '0' }}</p>
                  <p><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player1.bonusScore.toFixed(4) || '0' }}</p>
                  <p><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player1.totalScore.toFixed(4) || '0' }}</p>
                </template>
                <el-tag v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id" type="success">获胜</el-tag>
              </div>
               <el-empty v-else description="等待分数提交"></el-empty>
            </el-card>
          </el-col>
  
          <!-- Player B -->
          <el-col :span="12">
            <el-card :header="store.currentSemifinalMatch.player2_nickname || '选手 B'">
               <!-- Display submitted percentage from the match object -->
              <div class="player-info" v-if="store.currentSemifinalMatch.player2_percentage !== null && store.currentSemifinalMatch.player2_percentage !== undefined">
                <p><strong>完成率:</strong> {{ store.currentSemifinalMatch.player2_percentage.toFixed(4) || '0' }}%</p>
                <p><strong>职业:</strong> {{ store.currentSemifinalMatch.player2_profession || '未知' }}</p>
                <!-- Display calculated scores from the results object -->
                <template v-if="store.currentSemifinalMatch.results?.player2">
                  <p><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player2.originalScore.toFixed(4) || '0' }}</p>
                  <p><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player2.bonusScore.toFixed(4) || '0' }}</p>
                  <p><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player2.totalScore.toFixed(4) || '0' }}</p>
                </template>
                <el-tag v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player2_id" type="success">获胜</el-tag>
              </div>
               <el-empty v-else description="等待分数提交"></el-empty>
            </el-card>
          </el-col>
        </el-row>
  
        <el-card style="margin-top: 20px;" header="计分详情">
          <div v-if="store.currentSemifinalMatch.results">
            <h4>{{ store.currentSemifinalMatch.results.player1.nickname }} 计分日志:</h4>
            <ul>
              <li v-for="(log, index) in store.currentSemifinalMatch.results.player1.log" :key="`p1-log-${index}`">{{ log }}</li>
            </ul>
  
            <el-divider></el-divider>
  
            <h4>{{ store.currentSemifinalMatch.results.player2.nickname }} 计分日志:</h4>
            <ul>
              <li v-for="(log, index) in store.currentSemifinalMatch.results.player2.log" :key="`p2-log-${index}`">{{ log }}</li>
            </ul>
          </div>
          <el-empty v-else description="暂无计分详情"></el-empty>
        </el-card>
  
        <div v-if="store.isAdminUser && store.currentSemifinalMatch.status === 'completed'" style="margin-top: 20px; text-align: center;">
          <el-button type="info" @click="archiveMatch" :loading="store.isLoading.archivingSemifinalMatch">归档比赛</el-button>
        </div>
      </el-card>
      <el-alert v-else title="比赛数据未加载或不存在" type="info" show-icon :closable="false" />
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore, type SemifinalMatch } from '@/store';
  import { onMounted, onUnmounted, computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage } from 'element-plus';
  
  const store = useAppStore();
  const route = useRoute();
  const router = useRouter();
  
  const matchId = computed(() => Number(route.params.id));
  
  // Explicitly type pollInterval as number
  let pollInterval: number | undefined;
  
  onMounted(async () => {
    if (matchId.value) {
      await store.fetchSemifinalMatchData(matchId.value);
      // Set up polling for live updates if the match is not completed/archived
      if (store.currentSemifinalMatch?.status !== 'completed' && store.currentSemifinalMatch?.status !== 'archived') {
          // Use window.setInterval and cast the return value to number
          pollInterval = window.setInterval(() => {
            // Only poll if the status is still relevant for updates
            if (store.currentSemifinalMatch?.status !== 'completed' && store.currentSemifinalMatch?.status !== 'archived') {
               store.fetchSemifinalMatchData(matchId.value);
            } else {
               clearInterval(pollInterval);
            }
          }, 5000) as number; // Poll every 5 seconds
      }
  
      // Fetch members for nickname lookup (public endpoint)
      store.fetchMembers();
  
    } else {
      ElMessage.error('无效的比赛ID');
      router.push('/schedule-second');
    }
  });
  
  onUnmounted(() => {
    // Clean up interval on component unmount
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    // Optionally clear the match data in the store when leaving the page
    // store.currentSemifinalMatch = null;
  });
  
  
  const archiveMatch = async () => {
    if (!store.currentSemifinalMatch) return;
    await store.archiveSemifinalMatch(store.currentSemifinalMatch.id);
    // The store action updates the status and shows message
  };
  </script>
  
  <style scoped>
  .live-match-second-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .player-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  </style>
  