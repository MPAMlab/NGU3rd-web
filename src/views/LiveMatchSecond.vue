<!-- src/views/LiveMatchSecond.vue -->
<template>
    <div class="live-match-view bg-gradient-to-b from-[#0f172a] to-[#1e293b] min-h-screen font-sans">
        <div class="container mx-auto px-4 py-6">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <!-- Logo -->
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 glass rounded-full flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="w-8 h-8">
                    </div>
                    <span class="font-bold text-2xl text-white">NGU3rd</span>
                </div>

                <!-- Live Indicator -->
                <div class="status-tag success live-indicator px-4 py-1 animate-pulse">LIVE</div>

                <!-- Round Info -->
                <h2 class="text-xl font-bold text-white">
                    复赛直播: {{ store.currentSemifinalMatch?.round_name || '加载中...' }}
                </h2>
            </div>

            <!-- Loading/Error State -->
            <div v-if="store.isLoading.currentSemifinalMatch" class="glass rounded-xl p-8 text-center text-white">
                <div class="loading-indicator">加载比赛数据...</div>
            </div>
            <div v-else-if="!store.currentSemifinalMatch" class="glass rounded-xl p-8 text-center text-white">
                <div class="empty-state">比赛数据未加载或不存在</div>
            </div>

            <!-- Match Status Alert -->
            <div v-if="store.currentSemifinalMatch" class="mb-6">
                <div v-if="store.currentSemifinalMatch.status === 'completed'" class="status-tag success w-full justify-center py-2">比赛已结束</div>
                <div v-else-if="store.currentSemifinalMatch.status === 'archived'" class="status-tag info w-full justify-center py-2">比赛已归档</div>
                <div v-else-if="store.currentSemifinalMatch.status === 'scheduled'" class="status-tag info w-full justify-center py-2">比赛尚未开始</div>
                <div v-else-if="store.currentSemifinalMatch.status === 'pending_scores'" class="status-tag warning w-full justify-center py-2">等待分数提交...</div>
            </div>

            <!-- Main Content -->
            <div v-if="store.currentSemifinalMatch" class="flex gap-6 mb-6">
                <!-- Player 1 Column -->
                <div class="glass rounded-xl p-6 w-1/4">
                    <h3 class="font-bold text-xl mb-4 text-white">{{ store.currentSemifinalMatch.player1_nickname || '选手 A' }}</h3>
                    
                    <!-- Player Info -->
                    <div class="space-y-4 mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex-shrink-0"></div>
                            <div>
                                <p class="font-medium text-white">{{ store.currentSemifinalMatch.player1_nickname || '选手 A' }}</p>
                                <p class="text-gray-300">职业: {{ store.currentSemifinalMatch.player1_profession || '未知' }}</p>
                            </div>
                        </div>

                        <div v-if="store.currentSemifinalMatch.player1_percentage !== null && store.currentSemifinalMatch.player1_percentage !== undefined" class="bg-white/5 rounded-lg p-4">
                            <p class="text-white"><strong>完成率:</strong> {{ store.currentSemifinalMatch.player1_percentage.toFixed(4) }}%</p>
                            <template v-if="store.currentSemifinalMatch.results?.player1">
                                <p class="text-white"><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player1.originalScore.toFixed(4) }}</p>
                                <p class="text-white"><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player1.bonusScore.toFixed(4) }}</p>
                                <p class="text-white"><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player1.totalScore.toFixed(4) }}</p>
                            </template>
                            <div v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id" class="status-tag success mt-2">获胜</div>
                        </div>
                        <div v-else class="bg-white/5 rounded-lg p-4 text-white">等待分数提交</div>
                    </div>

                    <!-- Team Logo -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="max-h-16">
                    </div>
                </div>

                <!-- Center Column -->
                <div class="glass rounded-xl p-6 w-2/4 flex flex-col">
                    <h3 class="text-xl font-bold text-white mb-4 text-center">当前歌曲</h3>

                    <!-- Current Song Info -->
                    <div class="text-center mb-6 bg-white/5 rounded-lg p-4">
                        <h4 class="text-2xl font-bold text-white mb-2">等待歌曲信息...</h4>
                        <p class="text-gray-300">请等待比赛开始或分数提交</p>
                    </div>

                    <!-- Player Views (16:9 Aspect Ratio) -->
                    <div class="flex gap-4 mb-6">
                        <!-- Player 1 View -->
                        <div class="w-1/2 aspect-video">
                            <div class="h-full bg-[#00FF00] rounded-lg flex items-center justify-center text-black font-bold">
                                选手 A 视角
                            </div>
                        </div>
                        <!-- Player 2 View -->
                        <div class="w-1/2 aspect-video">
                            <div class="h-full bg-[#00FF00] rounded-lg flex items-center justify-center text-black font-bold">
                                选手 B 视角
                            </div>
                        </div>
                    </div>

                    <!-- Score Comparison -->
                    <div v-if="store.currentSemifinalMatch.results" class="bg-white/5 rounded-lg p-4 text-center">
                        <h4 class="font-bold mb-3 text-white">最终得分对比</h4>
                        <p class="text-2xl font-bold text-white">
                            {{ store.currentSemifinalMatch.results.player1.totalScore.toFixed(4) }}
                            <span class="text-gray-400 mx-3">vs</span>
                            {{ store.currentSemifinalMatch.results.player2.totalScore.toFixed(4) }}
                        </p>
                        <p v-if="store.currentSemifinalMatch.winner_player_id" class="mt-3 text-lg">
                            <span class="font-bold" :class="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id ? 'text-green-400' : 'text-red-400'">
                                {{ store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player1_id ? store.currentSemifinalMatch.player1_nickname : store.currentSemifinalMatch.player2_nickname }}
                            </span> 获胜!
                        </p>
                    </div>
                    <div v-else class="bg-white/5 rounded-lg p-4 text-center text-white">
                        <p>等待比赛结果...</p>
                    </div>
                </div>

                <!-- Player 2 Column -->
                <div class="glass rounded-xl p-6 w-1/4">
                    <h3 class="font-bold text-xl mb-4 text-white">{{ store.currentSemifinalMatch.player2_nickname || '选手 B' }}</h3>
                    
                    <!-- Player Info -->
                    <div class="space-y-4 mb-6">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex-shrink-0"></div>
                            <div>
                                <p class="font-medium text-white">{{ store.currentSemifinalMatch.player2_nickname || '选手 B' }}</p>
                                <p class="text-gray-300">职业: {{ store.currentSemifinalMatch.player2_profession || '未知' }}</p>
                            </div>
                        </div>

                        <div v-if="store.currentSemifinalMatch.player2_percentage !== null && store.currentSemifinalMatch.player2_percentage !== undefined" class="bg-white/5 rounded-lg p-4">
                            <p class="text-white"><strong>完成率:</strong> {{ store.currentSemifinalMatch.player2_percentage.toFixed(4) }}%</p>
                            <template v-if="store.currentSemifinalMatch.results?.player2">
                                <p class="text-white"><strong>原始得分:</strong> {{ store.currentSemifinalMatch.results.player2.originalScore.toFixed(4) }}</p>
                                <p class="text-white"><strong>技能加成:</strong> {{ store.currentSemifinalMatch.results.player2.bonusScore.toFixed(4) }}</p>
                                <p class="text-white"><strong>最终得分:</strong> {{ store.currentSemifinalMatch.results.player2.totalScore.toFixed(4) }}</p>
                            </template>
                            <div v-if="store.currentSemifinalMatch.winner_player_id === store.currentSemifinalMatch.player2_id" class="status-tag success mt-2">获胜</div>
                        </div>
                        <div v-else class="bg-white/5 rounded-lg p-4 text-white">等待分数提交</div>
                    </div>

                    <!-- Team Logo -->
                    <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/DSLH-logo2.png" alt="DSLH Logo" class="max-h-16">
                    </div>
                </div>
            </div>

            <!-- Admin Controls -->
            <div v-if="store.isAdminUser && store.currentSemifinalMatch?.status === 'completed'" class="mt-6 text-center">
                <button
                    @click="archiveMatch"
                    :disabled="store.isLoading.archivingSemifinalMatch"
                    class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {{ store.isLoading.archivingSemifinalMatch ? '归档中...' : '归档比赛' }}
                </button>
            </div>
        </div>
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
let pollInterval: number | undefined;

onMounted(async () => {
    if (matchId.value && !isNaN(matchId.value)) {
      await store.fetchSemifinalMatchData(matchId.value);
      if (store.currentSemifinalMatch?.status !== 'completed' && store.currentSemifinalMatch?.status !== 'archived') {
          pollInterval = window.setInterval(() => {
            if (store.currentSemifinalMatch?.status !== 'completed' && store.currentSemifinalMatch?.status !== 'archived') {
               store.fetchSemifinalMatchData(matchId.value);
            } else {
               clearInterval(pollInterval);
            }
          }, 5000) as number;
      }
    } else {
      ElMessage.error('无效的比赛ID');
      router.push('/schedule-second');
    }
});

onUnmounted(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
});

const archiveMatch = async () => {
    if (!store.currentSemifinalMatch) return;
    await store.archiveSemifinalMatch(store.currentSemifinalMatch.id);
};
</script>

<style scoped>
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}

.status-tag {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
}

.status-tag.success {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
}

.status-tag.warning {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
}

.status-tag.info {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.live-indicator {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
    100% {
        opacity: 1;
    }
}
</style>
