<!-- src/views/LiveMatchPublic.vue -->
<template>
    <div class="live-match-public-view bg-gray-900 text-white min-h-screen p-6">
        <div class="max-w-6xl mx-auto">
            <div v-if="store.currentMatchState" class="glass rounded-xl p-6" v-loading="store.isLoading.currentMatch">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-purple-400">
                        直播赛程: {{ store.currentMatchState.round_name }}
                    </h2>
                    <el-tag :type="matchStateTagType(store.currentMatchState.status)" size="large">
                        {{ matchStateText(store.currentMatchState.status) }}
                    </el-tag>
                </div>

                <!-- Status Alerts -->
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
                 <el-alert
                    v-else-if="store.currentMatchState.status === 'pending_scores'"
                    title="等待双方提交成绩..."
                    type="info"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 20px;"
                 />
                 <el-alert
                    v-else-if="store.currentMatchState.status === 'round_finished'"
                    title="本轮结束，等待进入下一轮..."
                    type="success"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 20px;"
                 />


                <!-- Main Content: Team Info and Center Scoreboard -->
                <div class="flex flex-col md:flex-row md:space-x-6">
                    <!-- Team A Info -->
                    <div class="glass rounded-lg p-4 mb-6 md:mb-0 md:w-1/4">
                        <h3 class="font-bold text-lg mb-3">{{ store.currentMatchState.teamA_name }}</h3>
                        <p class="text-sm text-gray-300 mb-2">
                            <strong class="text-white">当前血量:</strong> {{ store.currentMatchState.teamA_score }}
                        </p>
                        <!-- Health Bar for Team A -->
                        <div class="health-bar mb-4">
                            <div class="health-fill" :style="{ width: teamAHealthWidth }"></div>
                        </div>

                        <p class="text-sm text-gray-300 mb-2">
                            <strong class="text-white">当前选手:</strong> {{ store.currentMatchState.teamA_current_player_nickname }} ({{ store.currentMatchState.teamA_current_player_profession || '未知职业' }})
                        </p>
                        <p class="text-sm text-gray-300 mb-4">
                            <strong class="text-white">复影折镜:</strong>
                            <span :class="store.currentMatchState.teamA_mirror_available ? 'text-green-400' : 'text-red-400'">
                                {{ store.currentMatchState.teamA_mirror_available ? '可用' : '已使用' }}
                            </span>
                        </p>
                        <hr class="my-4 border-gray-700">
                        <p class="text-sm text-gray-300 mb-2"><strong class="text-white">出场顺序:</strong></p>
                        <div class="flex flex-wrap gap-1">
                            <span
                                v-for="(playerId, index) in store.currentMatchState.teamA_player_order_ids"
                                :key="playerId"
                                :class="[
                                    'px-2 py-0.5 rounded-full text-xs',
                                    index === store.currentMatchState.current_match_song_index % store.currentMatchState.teamA_player_order_ids.length
                                        ? 'bg-purple-500 bg-opacity-30 text-purple-300'
                                        : 'bg-gray-700 text-gray-400'
                                ]"
                            >
                                {{ getMemberNicknameById(playerId) }}
                            </span>
                        </div>
                    </div>

                    <!-- Center Scoreboard / Current Song -->
                    <div class="glass rounded-xl p-6 md:flex-1">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold">
                                第 {{ store.currentMatchState.current_match_song_index + 1 }} 轮
                                <span v-if="store.currentMatchState.current_song?.is_tiebreaker_song" class="text-purple-400">(加时赛)</span>
                            </h3>
                        </div>

                        <div v-if="store.currentMatchState.current_song" class="text-center mb-6">
                            <!-- Green Block Placeholder for Song Cover -->
                            <div class="w-40 h-40 mx-auto rounded-lg bg-[#00ff00] flex items-center justify-center text-black text-sm font-bold mb-4">
                                <!-- Optional: Add an icon or text -->
                                <el-icon :size="40" color="#333"><Picture /></el-icon>
                            </div>

                            <h4 class="text-xl font-bold mb-2">{{ store.currentMatchState.current_song.song_title }}</h4>
                            <p class="text-gray-300 mb-1">难度: {{ store.currentMatchState.current_song.song_difficulty }}</p>
                            <p class="text-gray-300">
                                选曲选手: {{ getMemberNicknameById(store.currentMatchState.current_song.picker_member_id) }} ({{ getTeamNameById(store.currentMatchState.current_song.picker_team_id) }})
                            </p>
                        </div>
                         <div v-else class="text-center mb-6">
                             <div class="w-40 h-40 mx-auto rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 text-sm font-bold mb-4">
                                <el-icon :size="40"><Picture /></el-icon>
                             </div>
                             <p class="text-gray-300">等待歌曲信息...</p>
                         </div>

                        <hr class="my-6 border-gray-700">

                        <!-- Round Summary Display -->
                        <div v-if="store.currentMatchState.roundSummary">
                            <h4 class="text-lg font-bold mb-4">上一轮总结 (第 {{ store.currentMatchState.roundSummary.round_number_in_match }} 轮)</h4>
                            <div class="space-y-3 text-sm text-gray-300">
                                <p><strong>歌曲:</strong> {{ store.currentMatchState.roundSummary.song_title }} ({{ store.currentMatchState.roundSummary.selected_difficulty }})</p>
                                <p><strong>{{ store.currentMatchState.teamA_name }} 选手:</strong> {{ store.currentMatchState.roundSummary.teamA_player_nickname }}</p>
                                <p><strong>{{ store.currentMatchState.teamB_name }} 选手:</strong> {{ store.currentMatchState.roundSummary.teamB_player_nickname }}</p>
                                <p><strong>{{ store.currentMatchState.teamA_name }} 百分比:</strong> {{ store.currentMatchState.roundSummary.teamA_percentage }}%</p>
                                <p><strong>{{ store.currentMatchState.teamB_name }} 百分比:</strong> {{ store.currentMatchState.roundSummary.teamB_percentage }}%</p>
                                <p><strong>{{ store.currentMatchState.teamA_name }} 伤害:</strong> {{ store.currentMatchState.roundSummary.teamA_final_damage_dealt }}</p>
                                <p><strong>{{ store.currentMatchState.teamB_name }} 伤害:</strong> {{ store.currentMatchState.roundSummary.teamB_final_damage_dealt }}</p>
                                <p><strong>{{ store.currentMatchState.teamA_name }} 血量变化:</strong> {{ store.currentMatchState.roundSummary.teamA_health_change }}</p>
                                <p><strong>{{ store.currentMatchState.teamB_name }} 血量变化:</strong> {{ store.currentMatchState.roundSummary.teamB_health_change }}</p>
                                <p><strong>{{ store.currentMatchState.teamA_name }} 赛后血量:</strong> {{ store.currentMatchState.roundSummary.teamA_health_after }}</p>
                                <p><strong>{{ store.currentMatchState.teamB_name }} 赛后血量:</strong> {{ store.currentMatchState.roundSummary.teamB_health_after }}</p>
                                <p>
                                    <strong>复影折镜:</strong>
                                    A: <span :class="store.currentMatchState.roundSummary.teamA_mirror_triggered ? 'text-green-400' : 'text-gray-400'">{{ store.currentMatchState.roundSummary.teamA_mirror_triggered ? '是' : '否' }}</span>,
                                    B: <span :class="store.currentMatchState.roundSummary.teamB_mirror_triggered ? 'text-green-400' : 'text-gray-400'">{{ store.currentMatchState.roundSummary.teamB_mirror_triggered ? '是' : '否' }}</span>
                                </p>
                                <p>
                                    <strong>小分调整:</strong>
                                    A: {{ store.currentMatchState.roundSummary.teamA_effect_value_applied }},
                                    B: {{ store.currentMatchState.roundSummary.teamB_effect_value_applied }}
                                </p>
                                <div v-if="store.currentMatchState.roundSummary.log && store.currentMatchState.roundSummary.log.length > 0">
                                    <strong>日志:</strong>
                                    <p v-for="(log, index) in store.currentMatchState.roundSummary.log" :key="index" class="text-xs text-gray-400">{{ log }}</p>
                                </div>
                                <p v-else><strong>日志:</strong> -</p>
                            </div>
                        </div>
                         <div v-else>
                             <p class="text-gray-300">等待第一轮总结...</p>
                         </div>
                    </div>

                    <!-- Team B Info -->
                    <div class="glass rounded-lg p-4 md:w-1/4">
                        <h3 class="font-bold text-lg mb-3">{{ store.currentMatchState.teamB_name }}</h3>
                        <p class="text-sm text-gray-300 mb-2">
                            <strong class="text-white">当前血量:</strong> {{ store.currentMatchState.teamB_score }}
                        </p>
                         <!-- Health Bar for Team B -->
                        <div class="health-bar mb-4">
                            <div class="opponent-health-fill" :style="{ width: teamBHealthWidth }"></div>
                        </div>
                        <p class="text-sm text-gray-300 mb-2">
                            <strong class="text-white">当前选手:</strong> {{ store.currentMatchState.teamB_current_player_nickname }} ({{ (store.currentMatchState as MatchState).teamB_current_player_profession || '未知职业' }})
                        </p>
                        <p class="text-sm text-gray-300 mb-4">
                            <strong class="text-white">复影折镜:</strong>
                             <span :class="store.currentMatchState.teamB_mirror_available ? 'text-green-400' : 'text-red-400'">
                                {{ store.currentMatchState.teamB_mirror_available ? '可用' : '已使用' }}
                            </span>
                        </p>
                        <hr class="my-4 border-gray-700">
                        <p class="text-sm text-gray-300 mb-2"><strong class="text-white">出场顺序:</strong></p>
                        <div class="flex flex-wrap gap-1">
                            <span
                                v-for="(playerId, index) in store.currentMatchState.teamB_player_order_ids"
                                :key="playerId"
                                :class="[
                                    'px-2 py-0.5 rounded-full text-xs',
                                    index === store.currentMatchState.current_match_song_index % store.currentMatchState.teamB_player_order_ids.length
                                        ? 'bg-purple-500 bg-opacity-30 text-purple-300'
                                        : 'bg-gray-700 text-gray-400'
                                ]"
                            >
                                {{ getMemberNicknameById(playerId) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <el-alert v-else title="比赛数据未加载或不存在" type="info" show-icon :closable="false" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore, type MatchState } from '@/store';
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'; // Keep ElMessage for basic info/error display

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const doId = computed(() => route.params.doId as string);

// --- Lifecycle ---
onMounted(() => {
    if (doId.value) {
        // Connect to WebSocket for real-time updates
        store.connectWebSocket(doId.value);
        // Fetch initial state via HTTP in case WS connection is slow or fails initially
        store.fetchMatchState(doId.value);
        // Fetch members and teams for nickname/team name lookup (these are public endpoints)
        store.fetchMembers();
        store.fetchTeams();
        // No need to fetch songs here as public view doesn't select songs
    } else {
        ElMessage.error('无效的比赛ID');
        // Redirect to a public page, e.g., match history or home
        router.push('/match-history');
    }
});

onUnmounted(() => {
    // Disconnect WebSocket when leaving the page
    store.disconnectWebSocket();
});

// --- Helpers ---
const getMemberNicknameById = (memberId: number | undefined | null) => {
    if (memberId === undefined || memberId === null) return '未知选手';
    // Look up member from the store's members list
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
    // Use optional chaining in case currentMatchState is null briefly
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

// --- Health Bar Computed Properties ---
// Assuming max score is 100 for health bar visualization
const maxHealth = 100;

const teamAHealthWidth = computed(() => {
    if (!store.currentMatchState) return '0%';
    // Ensure score is within 0-maxHealth range for display
    const score = Math.max(0, Math.min(maxHealth, store.currentMatchState.teamA_score));
    return `${(score / maxHealth) * 100}%`;
});

const teamBHealthWidth = computed(() => {
    if (!store.currentMatchState) return '0%';
     // Ensure score is within 0-maxHealth range for display
    const score = Math.max(0, Math.min(maxHealth, store.currentMatchState.teamB_score));
    return `${(score / maxHealth) * 100}%`;
});

</script>

<style scoped>
/* Add Tailwind CSS classes directly in the template */
/* Define the glass effect if not globally available */
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}

/* Custom styles for health bars */
.health-bar {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
}

.health-fill {
    height: 100%;
    /* Using a purple/indigo gradient similar to match.html for Team A */
    background: linear-gradient(90deg, #8b5cf6, #6366f1);
    transition: width 0.5s ease-in-out;
}

.opponent-health-fill {
    height: 100%;
    /* Using a red gradient similar to match.html for Team B */
    background: linear-gradient(90deg, #ef4444, #f87171);
    transition: width 0.5s ease-in-out;
}

/* Override Element Plus default styles for better dark mode integration if needed */
/* Example: Adjusting Alert background/text */
.el-alert {
    --el-alert-bg-color: rgba(255, 255, 255, 0.05); /* Match glass background */
    --el-alert-text-color: #d1d5db; /* gray-300 */
    --el-alert-title-font-size: 1rem; /* Adjust font size */
}

/* Specific alert types might need color adjustments */
.el-alert--info {
    --el-alert-title-color: #9ca3af; /* gray-400 */
    --el-alert-icon-color: #9ca3af; /* gray-400 */
}
.el-alert--warning {
     --el-alert-title-color: #fcd34d; /* yellow-300 */
     --el-alert-icon-color: #fcd34d; /* yellow-300 */
}
.el-alert--success {
     --el-alert-title-color: #86efac; /* green-300 */
     --el-alert-icon-color: #86efac; /* green-300 */
}
.el-alert--error {
     --el-alert-title-color: #fca5a5; /* red-300 */
     --el-alert-icon-color: #fca5a5; /* red-300 */
}

/* Adjust Element Plus Tag styles */
.el-tag {
    --el-tag-border-color: transparent; /* Remove border */
}
.el-tag--info {
    --el-tag-bg-color: rgba(107, 114, 128, 0.3); /* gray-500/30 */
    --el-tag-text-color: #9ca3af; /* gray-400 */
}
.el-tag--success {
    --el-tag-bg-color: rgba(52, 211, 153, 0.3); /* green-500/30 */
    --el-tag-text-color: #86efac; /* green-300 */
}
.el-tag--warning {
    --el-tag-bg-color: rgba(251, 191, 36, 0.3); /* yellow-500/30 */
    --el-tag-text-color: #fcd34d; /* yellow-300 */
}
.el-tag--danger {
    --el-tag-bg-color: rgba(239, 68, 68, 0.3); /* red-500/30 */
    --el-tag-text-color: #fca5a5; /* red-300 */
}

/* Adjust Element Plus Loading spinner color if needed */
/* .el-loading-spinner .path { stroke: #8b5cf6 !important; } */

</style>
