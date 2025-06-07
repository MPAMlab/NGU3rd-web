<!-- src/views/LiveMatchPublic.vue -->
<template>
    <!-- Main container for OBS, assuming 16:9 resolution is set in OBS source -->
    <!-- Use a dark background color from the prototype -->
    <div class="live-match-public-view bg-[#1a202c] text-white min-h-screen p-6 font-sans">
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

            <!-- Status Alerts (Styled Divs replacing el-alert) -->
            <div v-if="store.currentMatchState" class="mb-4">
                <div v-if="store.currentMatchState.status === 'archived'" class="status-tag info w-full justify-center">比赛已归档</div>
                <div v-else-if="store.currentMatchState.status === 'team_A_wins'" class="status-tag success w-full justify-center">{{ store.currentMatchState.teamA_name }} 获胜!</div>
                <div v-else-if="store.currentMatchState.status === 'team_B_wins'" class="status-tag success w-full justify-center">{{ store.currentMatchState.teamB_name }} 获胜!</div>
                <div v-else-if="store.currentMatchState.status === 'draw_pending_resolution'" class="status-tag danger w-full justify-center">比赛平局，等待裁判裁定胜负</div>
                <div v-else-if="store.currentMatchState.status === 'tiebreaker_pending_song'" class="status-tag danger w-full justify-center">标准轮次结束平局，等待裁判选择加时赛歌曲</div>
                <div v-else-if="store.currentMatchState.status === 'pending_scores'" class="status-tag warning w-full justify-center">等待双方提交成绩...</div>
                <div v-else-if="store.currentMatchState.status === 'round_finished'" class="status-tag success w-full justify-center">本轮结束，等待进入下一轮...</div>
            </div>


            <!-- Main Content: Team Info, Green Areas, Center Scoreboard -->
            <!-- Use flex-1 to make this section fill available height -->
            <div v-if="store.currentMatchState" class="flex flex-1 space-x-6">
                <!-- Team A Column (Left) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentMatchState.teamA_name }}</h3>

                    <!-- Player List -->
                    <div class="space-y-4 mb-6 flex-1"> <!-- flex-1 to push logo placeholder to bottom -->
                        <div
                            v-for="(playerId, index) in store.currentMatchState.teamA_player_order_ids"
                            :key="playerId"
                            class="flex items-center space-x-3 p-2 -mx-2 rounded-md"
                            :class="{ 'border-l-4 border-purple-500 pl-0 ml-0': isCurrentPlayer(playerId, 'A') }"
                        >
                            <!-- Player Avatar (Placeholder) -->
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0">
                                <!-- Replace with actual avatar image if available -->
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">{{ getMemberNicknameById(playerId) }}</p>
                                <p class="text-sm text-gray-400">
                                    <!-- Use member.color directly -->
                                    <span :class="getElementColorClass(getMemberById(playerId)?.color)">{{ getMemberById(playerId)?.color || '未知' }}</span>
                                    <!-- Use member.job directly -->
                                    ({{ getMemberById(playerId)?.job || '未知' }})
                                    <span class="status-dot available"></span> <!-- Status dot placeholder -->
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
                            <div class="health-fill-team1" :style="{ width: teamAHealthWidth }"></div> <!-- Changed class -->
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

                    <!-- Logo Placeholder (Bottom Left) -->
                    <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Logo Placeholder (Team A)
                        <!-- Insert Team A Logo Image Here -->
                        <img src="https://ngu3rd.mpam-lab.xyz/logo.webp" alt="NGU Logo" class="max-h-full max-w-full">
                    </div>
                </div>

                <!-- Center Column (Song Info + Green Areas + Round Summary) -->
                <div class="glass rounded-xl p-6 w-2/4 flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">
                            第 {{ (store.currentMatchState.current_match_song_index ?? 0) + 1 }} 轮
                            <span v-if="store.currentMatchState.current_song?.is_tiebreaker_song" class="text-purple-400">(加时赛)</span>
                        </h3>
                    </div>

                    <!-- Current Song Info -->
                    <div v-if="store.currentMatchState.current_song" class="text-center mb-6">
                        <h4 class="text-2xl font-bold mb-2">{{ store.currentMatchState.current_song.song_title }}</h4>
                        <!-- Use bpm property -->
                        <p class="text-gray-300 mb-1">难度: {{ store.currentMatchState.current_song.song_difficulty }} | BPM: {{ store.currentMatchState.current_song.bpm || 'N/A' }}</p>
                        <p class="text-gray-300">
                            选曲选手: {{ getMemberNicknameById(store.currentMatchState.current_song.picker_member_id) }} ({{ getTeamNameById(store.currentMatchState.current_song.picker_team_id) }})
                        </p>
                    </div>
                    <div v-else class="text-center mb-6">
                        <h4 class="text-2xl font-bold mb-2">等待歌曲信息...</h4>
                        <p class="text-gray-300">请等待裁判选择下一首歌曲</p>
                    </div>

                    <!-- Green Chroma Key Areas (Replacing Unsplash Views) -->
                    <!-- Use aspect-video (16/9) utility class -->
                    <div class="flex space-x-4 mb-6 flex-1"> <!-- flex-1 to push round summary down -->
                        <!-- Team A View (Left Green Area) -->
                        <div class="w-1/2 bg-[#00FF00] aspect-video rounded-lg flex items-center justify-center text-black text-sm font-bold">
                            {{ store.currentMatchState.teamA_name || '队伍 A' }}视角 (Chroma Key)
                        </div>
                        <!-- Team B View (Right Green Area) -->
                        <div class="w-1/2 bg-[#00FF00] aspect-video rounded-lg flex items-center justify-center text-black text-sm font-bold">
                            {{ store.currentMatchState.teamB_name || '队伍 B' }}视角 (Chroma Key)
                        </div>
                    </div>

                    <!-- Round Summary Display -->
                    <div v-if="store.currentMatchState.roundSummary" class="glass rounded-lg p-4 text-sm text-gray-300">
                        <h4 class="font-bold mb-3 text-white">上一轮总结 (第 {{ store.currentMatchState.roundSummary.round_number_in_match }} 轮)</h4>
                        <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                            <p><strong>歌曲:</strong> {{ store.currentMatchState.roundSummary.song_title }} ({{ store.currentMatchState.roundSummary.selected_difficulty }})</p>
                            <p><strong>{{ store.currentMatchState.teamA_name || '队伍 A' }} 选手:</strong> {{ store.currentMatchState.roundSummary.teamA_player_nickname }}</p>
                            <p><strong>{{ store.currentMatchState.teamB_name || '队伍 B' }} 选手:</strong> {{ store.currentMatchState.roundSummary.teamB_player_nickname }}</p>
                            <p><strong>{{ store.currentMatchState.teamA_name || '队伍 A' }} 百分比:</strong> {{ store.currentMatchState.roundSummary.teamA_percentage?.toFixed(2) || 'N/A' }}%</p>
                            <p><strong>{{ store.currentMatchState.teamB_name || '队伍 B' }} 百分比:</strong> {{ store.currentMatchState.roundSummary.teamB_percentage?.toFixed(2) || 'N/A' }}%</p>
                            <p><strong>{{ store.currentMatchState.teamA_name || '队伍 A' }} 伤害:</strong> {{ store.currentMatchState.roundSummary.teamA_final_damage_dealt || 'N/A' }}</p>
                            <p><strong>{{ store.currentMatchState.teamB_name || '队伍 B' }} 伤害:</strong> {{ store.currentMatchState.roundSummary.teamB_final_damage_dealt || 'N/A' }}</p>
                            <p><strong>{{ store.currentMatchState.teamA_name || '队伍 A' }} 血量变化:</strong> {{ store.currentMatchState.roundSummary.teamA_health_change || 'N/A' }}</p>
                            <p><strong>{{ store.currentMatchState.teamB_name || '队伍 B' }} 血量变化:</strong> {{ store.currentMatchState.roundSummary.teamB_health_change || 'N/A' }}</p>
                            <p><strong>{{ store.currentMatchState.teamA_name || '队伍 A' }} 赛后血量:</strong> {{ store.currentMatchState.roundSummary.teamA_health_after || 'N/A' }}</p>
                            <p><strong>{{ store.currentMatchState.teamB_name || '队伍 B' }} 赛后血量:</strong> {{ store.currentMatchState.roundSummary.teamB_health_after || 'N/A' }}</p>
                            <p class="col-span-2">
                                <strong>复影折镜:</strong>
                                A: <span :class="store.currentMatchState.roundSummary.teamA_mirror_triggered ? 'status-available' : 'status-used'">{{ store.currentMatchState.roundSummary.teamA_mirror_triggered ? '是' : '否' }}</span>,
                                B: <span :class="store.currentMatchState.roundSummary.teamB_mirror_triggered ? 'status-available' : 'status-used'">{{ store.currentMatchState.roundSummary.teamB_mirror_triggered ? '是' : '否' }}</span>
                            </p>
                             <div v-if="store.currentMatchState.roundSummary.log && store.currentMatchState.roundSummary.log.length > 0" class="col-span-2">
                                <strong>日志:</strong>
                                <p v-for="(log, index) in store.currentMatchState.roundSummary.log" :key="index" class="text-xs text-gray-400">{{ log }}</p>
                            </div>
                            <p v-else class="col-span-2"><strong>日志:</strong> -</p>
                        </div>
                    </div>
                     <div v-else class="glass rounded-lg p-4 text-sm text-gray-300 text-center">
                         <p>等待第一轮总结...</p>
                     </div>
                </div>

                <!-- Team B Column (Right) -->
                <div class="glass rounded-xl p-6 w-1/4 flex flex-col">
                    <h3 class="font-bold text-lg mb-4">{{ store.currentMatchState.teamB_name }}</h3>

                    <!-- Player List -->
                    <div class="space-y-4 mb-6 flex-1"> <!-- flex-1 to push logo placeholder to bottom -->
                         <div
                             v-for="(playerId, index) in store.currentMatchState.teamB_player_order_ids"
                             :key="playerId"
                             class="flex items-center space-x-3 p-2 -mx-2 rounded-md"
                             :class="{ 'border-l-4 border-purple-500 pl-0 ml-0': isCurrentPlayer(playerId, 'B') }"
                         >
                            <!-- Player Avatar (Placeholder) -->
                            <div class="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0">
                                <!-- Replace with actual avatar image if available -->
                            </div>
                            <div class="flex-1">
                                <p class="font-medium">{{ getMemberNicknameById(playerId) }}</p>
                                <p class="text-sm text-gray-400">
                                     <!-- Use member.color directly -->
                                     <span :class="getElementColorClass(getMemberById(playerId)?.color)">{{ getMemberById(playerId)?.color || '未知' }}</span>
                                    <!-- Use member.job directly -->
                                    ({{ getMemberById(playerId)?.job || '未知' }})
                                     <span class="status-dot available"></span> <!-- Status dot placeholder -->
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
                            <div class="health-fill-team2" :style="{ width: teamBHealthWidth }"></div> <!-- Changed class -->
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

                    <!-- Logo Placeholder (Bottom Right) -->
                    <div class="w-full h-20 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        Logo Placeholder (Team B)
                         <!-- Insert Team B Logo Image Here -->
                        <img src="https://ngu3rd.mpam-lab.xyz/DSLH-logo2.png" alt="DSLH Logo" class="max-h-full max-w-full"> 
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAppStore, type MatchState, type Member } from '@/store'; // Ensure Member type is imported
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus'; // Keeping ElMessage for non-visual notifications

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
    } else {
        ElMessage.error('无效的比赛ID');
        // Redirect to a public page, e.g., match history or home
        router.push('/match-history'); // Adjust redirect path as needed
    }
});

onUnmounted(() => {
    // Disconnect WebSocket when leaving the page
    store.disconnectWebSocket();
});

// --- Helpers ---
const getMemberById = (memberId: number | undefined | null): Member | undefined => {
     if (memberId === undefined || memberId === null) return undefined;
     return store.members.find(m => m.id === memberId);
};

const getMemberNicknameById = (memberId: number | undefined | null) => {
    const member = getMemberById(memberId);
    return member?.nickname || `ID:${memberId}`;
};

// Helper to get element color class based on the 'color' property ('fire', 'wood', 'water')
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

// Determine if a player is the current player for their team
const isCurrentPlayer = (playerId: number | undefined | null, team: 'A' | 'B') => {
    if (!store.currentMatchState || playerId === undefined || playerId === null) return false;

    const playerOrder = team === 'A' ? store.currentMatchState.teamA_player_order_ids : store.currentMatchState.teamB_player_order_ids;
    // Ensure playerOrder is an array before accessing length
    if (!Array.isArray(playerOrder) || playerOrder.length === 0) return false;

    const currentIndex = store.currentMatchState.current_match_song_index ?? 0;
    const playerIndexInOrder = currentIndex % playerOrder.length;

    return playerOrder[playerIndexInOrder] === playerId;
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
/* Add any specific overrides or complex styles here if needed */
/* Most styles are now in main.css */
</style>

