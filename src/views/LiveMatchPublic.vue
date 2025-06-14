<!-- src/views/LiveMatchPublic.vue -->
<template>
    <div class="live-match-public-view bg-[#1a202c] text-white min-h-screen p-6 font-sans">
        <div class="h-full flex flex-col">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <!-- Logo Placeholder (Top Left) -->
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 glass rounded-full flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="w-8 h-8">
                    </div>
                    <span class="font-bold text-2xl">NGU3rd</span>
                </div>

                <!-- LIVE Indicator -->
                <span class="status-tag success live-indicator">LIVE</span>

                <!-- Round Info (Top Right) -->
                <h2 class="text-xl font-bold text-gray-300">
                    {{ store.currentMatchState?.round_name || '加载中...' }}
                </h2>
            </div>

            <!-- Loading/Error State -->
            <div v-if="store.isLoading.currentMatch" class="loading-indicator">
                加载比赛数据...
            </div>
            <div v-else-if="!store.currentMatchState" class="empty-state">
                比赛数据未加载或不存在
            </div>

            <!-- Status Alerts -->
            <div v-if="store.currentMatchState" class="mb-4">
                <div v-if="store.currentMatchState.status === 'archived'" class="status-tag info w-full justify-center">比赛已归档</div>
                <div v-else-if="store.currentMatchState.status === 'team_A_wins'" class="status-tag success w-full justify-center">{{ store.currentMatchState.teamA_name }} 获胜!</div>
                <div v-else-if="store.currentMatchState.status === 'team_B_wins'" class="status-tag success w-full justify-center">{{ store.currentMatchState.teamB_name }} 获胜!</div>
                <div v-else-if="store.currentMatchState.status === 'draw_pending_resolution'" class="status-tag danger w-full justify-center">比赛平局，等待裁判裁定胜负</div>
                <div v-else-if="store.currentMatchState.status === 'tiebreaker_pending_song'" class="status-tag danger w-full justify-center">标准轮次结束平局，等待裁判选择加时赛歌曲</div>
                <div v-else-if="store.currentMatchState.status === 'pending_scores'" class="status-tag warning w-full justify-center">等待双方提交成绩...</div>
                <div v-else-if="store.currentMatchState.status === 'round_finished'" class="status-tag success w-full justify-center">本轮结束，等待进入下一轮...</div>
            </div>

            <!-- Main Content -->
            <div v-if="store.currentMatchState" class="flex flex-1 space-x-6">
                <!-- Team A Column (Left) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentMatchState.teamA_name }}</h3>

                    <!-- Player List -->
                    <div class="space-y-4 mb-6 flex-1">
                        <div
                            v-for="(playerId, index) in store.currentMatchState.teamA_player_order_ids"
                            :key="playerId"
                            class="flex items-center space-x-3 p-2 -mx-2 rounded-md"
                            :class="{ 'border-l-4 border-purple-500 pl-0 ml-0': isCurrentPlayer(playerId, 'A') }"
                        >
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
                            <div class="flex-1">
                                <p class="font-medium">{{ getMemberNicknameById(playerId) }}</p>
                                <p class="text-sm text-gray-400">
                                    <span :class="getElementColorClass(getMemberById(playerId)?.color)">{{ getMemberById(playerId)?.color || '未知' }}</span>
                                    ({{ getMemberById(playerId)?.job || '未知' }})
                                    <span class="status-dot available"></span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Health Section -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">队伍血量</span>
                            <span class="font-bold text-lg">{{ store.currentMatchState.teamA_score }}</span>
                        </div>
                        <div class="health-bar">
                            <div class="health-fill-team1" :style="{ width: teamAHealthWidth }"></div>
                        </div>
                    </div>

                    <!-- Mirror Status -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">复影折镜状态:</span>
                            <span :class="store.currentMatchState.teamA_mirror_available ? 'status-available' : 'status-used'">
                                {{ store.currentMatchState.teamA_mirror_available ? '可用' : '已使用' }}
                            </span>
                        </div>
                    </div>

                    <!-- Logo -->
                    <div class="w-full h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="max-h-full max-w-full">
                    </div>
                </div>

                <!-- Center Column - Just 9:16 Camera Frames -->
                <div class="glass rounded-xl p-6 w-2/4 flex flex-col items-center justify-center">
                    <div class="flex justify-center space-x-6 w-full h-full">
                        <!-- Team A View (Left Green Area) -->
                        <div class="camera-container">
                            <div class="camera-frame bg-[#00FF00]"></div>
                        </div>
                        <!-- Team B View (Right Green Area) -->
                        <div class="camera-container">
                            <div class="camera-frame bg-[#00FF00]"></div>
                        </div>
                    </div>
                </div>

                <!-- Team B Column (Right) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentMatchState.teamB_name }}</h3>

                    <!-- Player List -->
                    <div class="space-y-4 mb-6 flex-1">
                        <div
                            v-for="(playerId, index) in store.currentMatchState.teamB_player_order_ids"
                            :key="playerId"
                            class="flex items-center space-x-3 p-2 -mx-2 rounded-md"
                            :class="{ 'border-l-4 border-purple-500 pl-0 ml-0': isCurrentPlayer(playerId, 'B') }"
                        >
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
                            <div class="flex-1">
                                <p class="font-medium">{{ getMemberNicknameById(playerId) }}</p>
                                <p class="text-sm text-gray-400">
                                    <span :class="getElementColorClass(getMemberById(playerId)?.color)">{{ getMemberById(playerId)?.color || '未知' }}</span>
                                    ({{ getMemberById(playerId)?.job || '未知' }})
                                    <span class="status-dot available"></span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Health Section -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">队伍血量</span>
                            <span class="font-bold text-lg">{{ store.currentMatchState.teamB_score }}</span>
                        </div>
                        <div class="health-bar">
                            <div class="health-fill-team2" :style="{ width: teamBHealthWidth }"></div>
                        </div>
                    </div>

                    <!-- Mirror Status -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">复影折镜状态:</span>
                            <span :class="store.currentMatchState.teamB_mirror_available ? 'status-available' : 'status-used'">
                                {{ store.currentMatchState.teamB_mirror_available ? '可用' : '已使用' }}
                            </span>
                        </div>
                    </div>

                    <!-- Logo -->
                    <div class="w-full h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                        <img src="https://ngu3rd.mpam-lab.xyz/DSLH-logo2.png" alt="DSLH Logo" class="max-h-full max-w-full">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore, type MatchState, type Member } from '@/store';
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const doId = computed(() => route.params.doId as string);

onMounted(() => {
    if (doId.value) {
        store.connectWebSocket(doId.value);
        store.fetchMatchState(doId.value);
        store.fetchMembers();
        store.fetchTeams();
    } else {
        ElMessage.error('无效的比赛ID');
        router.push('/match-history');
    }
});

onUnmounted(() => {
    store.disconnectWebSocket();
});

const getMemberById = (memberId: number | undefined | null): Member | undefined => {
     if (memberId === undefined || memberId === null) return undefined;
     return store.members.find(m => m.id === memberId);
};

const getMemberNicknameById = (memberId: number | undefined | null) => {
    const member = getMemberById(memberId);
    return member?.nickname || `ID:${memberId}`;
};

const getElementColorClass = (color: string | null | undefined) => {
    switch (color) {
        case 'fire': return 'element-fire';
        case 'wood': return 'element-wood';
        case 'water': return 'element-water';
        default: return 'text-gray-400';
    }
};

const getTeamNameById = (teamId: number | undefined | null) => {
    if (teamId === undefined || teamId === null) return '未知队伍';
    const team = store.teams.find(t => t.id === teamId);
    return team?.name || `ID:${teamId}`;
};

const isCurrentPlayer = (playerId: number | undefined | null, team: 'A' | 'B') => {
    if (!store.currentMatchState || playerId === undefined || playerId === null) return false;

    const playerOrder = team === 'A' ? store.currentMatchState.teamA_player_order_ids : store.currentMatchState.teamB_player_order_ids;
    if (!Array.isArray(playerOrder) || playerOrder.length === 0) return false;

    const currentIndex = store.currentMatchState.current_match_song_index ?? 0;
    const playerIndexInOrder = currentIndex % playerOrder.length;

    return playerOrder[playerIndexInOrder] === playerId;
};

const maxHealth = 100;

const teamAHealthWidth = computed(() => {
    if (!store.currentMatchState) return '0%';
    const score = Math.max(0, Math.min(maxHealth, store.currentMatchState.teamA_score));
    return `${(score / maxHealth) * 100}%`;
});

const teamBHealthWidth = computed(() => {
    if (!store.currentMatchState) return '0%';
    const score = Math.max(0, Math.min(maxHealth, store.currentMatchState.teamB_score));
    return `${(score / maxHealth) * 100}%`;
});
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

.status-tag.danger {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

.health-bar {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
}

.health-fill-team1 {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #6366f1);
    transition: width 0.5s ease-in-out;
}

.health-fill-team2 {
    height: 100%;
    background: linear-gradient(90deg, #ef4444, #f87171);
    transition: width 0.5s ease-in-out;
}

.status-available {
    color: #10b981;
}

.status-used {
    color: #ef4444;
}

.element-fire {
    color: #ef4444;
}

.element-wood {
    color: #10b981;
}

.element-water {
    color: #3b82f6;
}

.live-indicator {
    animation: pulse 2s infinite;
}

/* Larger 9:16 Camera Container */
.camera-container {
    width: 300px; /* Increased width */
    height: 533px; /* Maintaining 9:16 ratio */
    margin: 0 10px;
}

.camera-frame {
    width: 100%;
    height: 100%;
    border-radius: 8px;
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
