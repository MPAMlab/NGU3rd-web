<!-- src/views/LiveMatchSecond.vue -->
<template>
    <!-- Main container for OBS, assuming 16:9 resolution is set in OBS source -->
    <div class="live-match-second-view bg-[#1a202c] text-white min-h-screen p-6 font-sans">
         <!-- Use a container that fills height and uses flexbox for the 3 columns -->
        <!-- Remove max-w-6xl for OBS to fill the source size -->
        <div class="h-full flex flex-col">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                 <!-- Logo Placeholder (Top Left) -->
                 <div class="flex items-center space-x-3">
                     <!-- Replace with your actual logo if needed -->
                     <div class="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center text-xs">Logo</div>
                     <span class="font-bold text-xl">NGU3rd</span>
                 </div>

                <!-- LIVE Indicator -->
                <span class="status-tag success live-indicator">LIVE</span> <!-- Added live-indicator class -->

                <!-- Round Info (Top Right) -->
                <h2 class="text-xl font-bold text-gray-300">
                    复赛直播: {{ store.currentSemifinalMatch?.round_name || '加载中...' }}
                </h2>
            </div>

            <!-- Loading/Error State -->
            <div v-if="store.isLoading.currentSemifinalMatch" class="loading-indicator">
                加载比赛数据...
            </div>
            <div v-else-if="!store.currentSemifinalMatch" class="empty-state">
                 比赛数据未加载或不存在
            </div>

             <!-- Status Alerts (Styled Divs replacing el-alert) -->
            <div v-if="store.currentSemifinalMatch" class="mb-4">
                <div v-if="store.currentSemifinalMatch.status === 'completed'" class="status-tag success w-full justify-center">比赛已结束</div>
                <div v-else-if="store.currentSemifinalMatch.status === 'archived'" class="status-tag info w-full justify-center">比赛已归档</div>
                 <div v-else-if="store.currentSemifinalMatch.status === 'scheduled'" class="status-tag info w-full justify-center">比赛尚未开始</div>
                 <div v-else-if="store.currentSemifinalMatch.status === 'pending_scores'" class="status-tag warning w-full justify-center">等待分数提交...</div>
            </div>


            <!-- Main Content: Player Info, Green Areas, Score Comparison -->
             <!-- Use flex-1 to make this section fill available height -->
            <div v-if="store.currentSemifinalMatch" class="flex flex-1 space-x-6">
                <!-- Player 1 Column (Left) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentSemifinalMatch.player1_nickname || '选手 A' }}</h3>

                    <!-- Player Info -->
                    <div class="space-y-4 mb-6 flex-1"> <!-- flex-1 to push logo placeholder to bottom -->
                        <div class="flex items-center space-x-3">
                            <!-- Player Avatar (Placeholder) -->
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0">
                                <!-- Replace with actual avatar image if available -->
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">{{ store.currentSemifinalMatch.player1_nickname || '选手 A' }}</p>
                                <p class="text-sm text-gray-400">
                                     <!-- Removed element display -->
                                    <!-- Use player1_profession directly for role -->
                                    职业: {{ store.currentSemifinalMatch.player1_profession || '未知' }}
                                </p>
                            </div>
                        </div>

                        <div v-if="store.currentSemifinalMatch.player1_percentage !== null && store.currentSemifinalMatch.player1_percentage !== undefined">
                            <p class="text-sm text-gray-300"><strong>完成率:</strong> {{ store.currentSemifinalMatch.player1_percentage.toFixed(4) }}%</p>
                            <template v-if="store.currentSemifinalMatch.results?.player1">
                                <p class="text-sm text-gray-300"><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player1.originalScore.toFixed(4) }}</p>
                                <p class="text-sm text-gray-300"><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player1.bonusScore.toFixed(4) }}</p>
                                <p class="text-sm text-gray-300"><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player1.totalScore.toFixed(4) }}</p>
                            </template>
                            <div v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id" class="status-tag success mt-2 w-min">获胜</div>
                        </div>
                        <div v-else class="empty-state text-left p-0">等待分数提交</div>
                    </div>

                    <!-- Logo Placeholder (Bottom Left) -->
                    <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Logo Placeholder (Player 1)
                         <!-- Insert Player 1 Logo Image Here -->
                         <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="max-h-full max-w-full">
                    </div>
                </div>

                <!-- Center Column (Song Info + Green Areas + Score Comparison) -->
                <div class="glass rounded-xl p-6 w-2/4 flex flex-col">
                     <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">
                            当前歌曲
                        </h3>
                    </div>

                    <!-- Current Song Info (Removed specific song title/difficulty display from results) -->
                    <div class="text-center mb-6">
                        <h4 class="text-2xl font-bold mb-2">等待歌曲信息...</h4>
                        <p class="text-gray-300">请等待比赛开始或分数提交</p>
                    </div>


                    <!-- Green Chroma Key Areas (Replacing Unsplash Views) -->
                    <!-- Use aspect-video (16/9) utility class -->
                    <div class="flex space-x-4 mb-6 flex-1"> <!-- flex-1 to push score comparison down -->
                        <!-- Player 1 View (Left Green Area) -->
                        <div class="w-1/2 bg-[#00FF00] aspect-video rounded-lg flex items-center justify-center text-black text-sm font-bold">
                            选手 A 视角 (Chroma Key)
                        </div>
                        <!-- Player 2 View (Right Green Area) -->
                        <div class="w-1/2 bg-[#00FF00] aspect-video rounded-lg flex items-center justify-center text-black text-sm font-bold">
                            选手 B 视角 (Chroma Key)
                        </div>
                    </div>

                    <!-- Simple Score Comparison / Status -->
                    <div v-if="store.currentSemifinalMatch.results" class="glass rounded-lg p-4 text-sm text-gray-300 text-center">
                         <h4 class="font-bold mb-3 text-white">最终得分对比</h4>
                         <p class="text-lg font-bold">
                             {{ store.currentSemifinalMatch.results.player1.totalScore.toFixed(4) }}
                             <span class="text-gray-400 mx-2">vs</span>
                             {{ store.currentSemifinalMatch.results.player2.totalScore.toFixed(4) }}
                         </p>
                         <p v-if="store.currentSemifinalMatch.winner_player_id" class="mt-2">
                             <span class="font-bold" :class="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id ? 'text-green-400' : 'text-red-400'">
                                 {{ store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id ? store.currentSemifinalMatch.player1_nickname : store.currentSemifinalMatch.player2_nickname }}
                             </span> 获胜!
                         </p>
                    </div>
                     <div v-else class="glass rounded-lg p-4 text-sm text-gray-300 text-center">
                         <p>等待比赛结果...</p>
                     </div>

                </div>

                <!-- Player 2 Column (Right) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentSemifinalMatch.player2_nickname || '选手 B' }}</h3>

                    <!-- Player Info -->
                    <div class="space-y-4 mb-6 flex-1"> <!-- flex-1 to push logo placeholder to bottom -->
                         <div class="flex items-center space-x-3">
                            <!-- Player Avatar (Placeholder) -->
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0">
                                <!-- Replace with actual avatar image if available -->
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">{{ store.currentSemifinalMatch.player2_nickname || '选手 B' }}</p>
                                <p class="text-sm text-gray-400">
                                     <!-- Removed element display -->
                                    <!-- Use player2_profession directly for role -->
                                    职业: {{ store.currentSemifinalMatch.player2_profession || '未知' }}
                                </p>
                            </div>
                        </div>

                        <div v-if="store.currentSemifinalMatch.player2_percentage !== null && store.currentSemifinalMatch.player2_percentage !== undefined">
                            <p class="text-sm text-gray-300"><strong>完成率:</strong> {{ store.currentSemifinalMatch.player2_percentage.toFixed(4) }}%</p>
                            <template v-if="store.currentSemifinalMatch.results?.player2">
                                <p class="text-sm text-gray-300"><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player2.originalScore.toFixed(4) }}</p>
                                <p class="text-sm text-gray-300"><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player2.bonusScore.toFixed(4) }}</p>
                                <p class="text-sm text-gray-300"><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player2.totalScore.toFixed(4) }}</p>
                            </template>
                            <div v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player2_id" class="status-tag success mt-2 w-min">获胜</div>
                        </div>
                        <div v-else class="empty-state text-left p-0">等待分数提交</div>
                    </div>

                    <!-- Logo Placeholder (Bottom Right) -->
                    <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Logo Placeholder (Player 2)
                         <!-- Insert Player 2 Logo Image Here -->
                         <img src="https://ngu3rd.mpam-lab.xyz/DSLH-logo2.png" alt="DSLH Logo" class="max-h-full max-w-full"> 
                    </div>
                </div>
            </div>

            <!-- Scoring Details Section -->
            <div v-if="store.currentSemifinalMatch?.results" class="glass rounded-xl p-6 mt-6">
                 <h4 class="font-bold text-lg mb-4">计分详情</h4>
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                     <div>
                         <h5 class="font-medium mb-2 text-white">{{ store.currentSemifinalMatch.results.player1.nickname }} 计分日志:</h5>
                         <ul class="list-disc list-inside space-y-1">
                             <li v-for="(log, index) in store.currentSemifinalMatch.results.player1.log" :key="`p1-log-${index}`">{{ log }}</li>
                             <li v-if="!store.currentSemifinalMatch.results.player1.log || store.currentSemifinalMatch.results.player1.log.length === 0">暂无日志</li>
                         </ul>
                     </div>
                     <div>
                         <h5 class="font-medium mb-2 text-white">{{ store.currentSemifinalMatch.results.player2.nickname }} 计分日志:</h5>
                         <ul class="list-disc list-inside space-y-1">
                             <li v-for="(log, index) in store.currentSemifinalMatch.results.player2.log" :key="`p2-log-${index}`">{{ log }}</li>
                             <li v-if="!store.currentSemifinalMatch.results.player2.log || store.currentSemifinalMatch.results.player2.log.length === 0">暂无日志</li>
                         </ul>
                     </div>
                 </div>
            </div>
             <div v-else-if="!store.isLoading.currentSemifinalMatch && store.currentSemifinalMatch" class="glass rounded-xl p-6 mt-6 empty-state">
                 暂无计分详情
             </div>


            <div v-if="store.isAdminUser && store.currentSemifinalMatch?.status === 'completed'" class="mt-6 text-center">
                <!-- Styled button replacing el-button -->
                <button
                    @click="archiveMatch"
                    :disabled="store.isLoading.archivingSemifinalMatch"
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {{ store.isLoading.archivingSemifinalMatch ? '归档中...' : '归档比赛' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore, type SemifinalMatch } from '@/store'; // Ensure SemifinalMatch type is imported
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'; // Keeping ElMessage for non-visual notifications

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const matchId = computed(() => Number(route.params.id));

// Explicitly type pollInterval as number
let pollInterval: number | undefined;

onMounted(async () => {
    if (matchId.value && !isNaN(matchId.value)) {
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

      // Fetch members for nickname lookup (public endpoint) - might be needed if player nicknames aren't fully in SemifinalMatch
      // store.fetchMembers(); // Uncomment if needed
      // store.fetchTeams(); // Uncomment if needed

    } else {
      ElMessage.error('无效的比赛ID');
      router.push('/schedule-second'); // Adjust redirect path as needed
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

// --- Helpers ---

// Removed getChineseElementColorClass as element is not available on SemifinalMatch profession

// Removed getProfessionElementFromStr as element is not available on SemifinalMatch profession

// Removed getProfessionRoleFromStr as we use player_profession directly

const archiveMatch = async () => {
    if (!store.currentSemifinalMatch) return;
    await store.archiveSemifinalMatch(store.currentSemifinalMatch.id);
    // The store action updates the status and shows message
};
</script>

<style scoped>
/* Add any specific overrides or complex styles here if needed */
/* Most styles are now in main.css */
</style>

