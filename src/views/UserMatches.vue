<!-- src/views/UserMatches.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useKindeAuth } from '../composables/useKindeAuth'; // Adjust path
import { Team, Match, MatchTurn, Member } from '../types'; // Adjust path
import Sidebar from '../components/Sidebar.vue'; // Import Sidebar
import HealthBar from '../components/HealthBar.vue'; // Import HealthBar

const { authenticatedFetch, userMember } = useKindeAuth();

const loading = ref(true);
const error = ref<string | null>(null);

const userTeam = ref<Team | null>(null);
const userTeamMembers = ref<Member[]>([]);
const userMatches = ref<Match[]>([]); // Matches involving the user's team
const userMatchTurns = ref<MatchTurn[]>([]); // Turns from matches involving the user's team

const activeTab = ref('details'); // 'details', 'songs', 'stats'

onMounted(async () => {
    // userMember is already fetched by the router guard/checkAuthStatus
    if (!userMember.value) {
        // This case should be handled by the router guard redirecting to home
        // But as a fallback, show an error or redirect
        error.value = 'User not registered or data not loaded.';
        loading.value = false;
        return;
    }

    await fetchUserData(userMember.value.team_code);
});

async function fetchUserData(teamCode: string | null) {
    if (!teamCode) {
        error.value = 'User is not part of a team.';
        loading.value = false;
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        // Fetch team details and members
        const teamResponse = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/teams/${teamCode}`);
        if (!teamResponse.ok) {
             const err = await teamResponse.json();
             throw new Error(err.error || `Failed to fetch team ${teamCode}: ${teamResponse.statusText}`);
        }
        const teamData = await teamResponse.json();
        userTeam.value = teamData.team;
        userTeamMembers.value = teamData.members;
        console.log("Fetched user team:", userTeam.value, userTeamMembers.value);


        // Fetch matches involving this team
        // NOTE: This requires a new backend endpoint like GET /api/matches?teamCode=:code
        // For now, let's simulate or assume such an endpoint exists.
        // If not, you'd need an admin endpoint to fetch all matches and filter client-side (less efficient).
        const matchesResponse = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/matches?teamCode=${teamCode}`); // Assuming this endpoint exists
         if (!matchesResponse.ok) {
             const err = await matchesResponse.json();
             throw new Error(err.error || `Failed to fetch matches for team ${teamCode}: ${matchesResponse.statusText}`);
         }
         const matchesData = await matchesResponse.json();
         userMatches.value = matchesData.matches || [];
         console.log("Fetched user matches:", userMatches.value);

         // Fetch turns for these matches (optional, for detailed view)
         // This might require multiple calls or a new endpoint like GET /api/match-turns?teamCode=:code
         // For simplicity, let's skip fetching all turns initially unless needed for a specific view.
         // If you need turn details per match, fetch them when viewing a specific match detail.


    } catch (e: any) {
        console.error("Error fetching user data:", e);
        error.value = e.message || 'Failed to load user data.';
    } finally {
        loading.value = false;
    }
}

function switchTab(tabName: string) {
    activeTab.value = tabName;
    // TODO: Fetch data specific to the tab if needed (e.g., songs, stats)
    // For 'songs' tab, you might need to fetch user's song selections.
    // For 'stats' tab, you might need to fetch aggregated stats or all turns to calculate.
}

// Computed properties for match overview stats (simulated for now)
const totalWins = computed(() => userMatches.value.filter(m => m.status === 'completed' && m.winner_team_code === userTeam.value?.code).length);
const totalLosses = computed(() => userMatches.value.filter(m => m.status === 'completed' && m.winner_team_code !== userTeam.value?.code).length);
// Total score/damage stats require fetching turn data and summing up.

// Computed property for current match (find the active one)
const currentMatch = computed(() => userMatches.value.find(m => m.status === 'active'));

// Computed properties for historical matches (completed ones)
const historicalMatches = computed(() => userMatches.value.filter(m => m.status === 'completed'));

// Helper to get opponent team code/name for a match
function getOpponentTeam(match: Match) {
    if (!userTeam.value) return null;
    return match.team1_code === userTeam.value.code ? { code: match.team2_code, name: match.team2_name } : { code: match.team1_code, name: match.team1_name };
}

// Helper to determine win/loss status for a completed match
function getMatchResultStatus(match: Match) {
    if (!userTeam.value || match.status !== 'completed') return null;
    return match.winner_team_code === userTeam.value.code ? 'win' : 'loss';
}

// Helper to format timestamp (assuming timestamps are in seconds)
function formatTimestamp(timestamp: number | null | undefined): string {
    if (!timestamp) return 'N/A';
    try {
        const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        console.error("Failed to format timestamp:", timestamp, e);
        return 'Invalid Date';
    }
}

// Placeholder for song selection data (needs fetching)
const userSongSelections = ref<any[]>([]); // Replace any with actual type

// Placeholder for team stats data (needs fetching or calculation)
const teamStats = ref<any>(null); // Replace any with actual type

// Helper to get element color class (copied from LivePage or PlayerCard)
const getElementColorClass = (element: string) => {
  switch (element) {
    case 'fire': return 'element-fire';
    case 'wood': return 'element-wood';
    case 'blue': return 'element-water';
    default: return '';
  }
};


</script>

<template>
    <div class="flex h-screen">
        <Sidebar /> <!-- Use the reusable Sidebar component -->

        <!-- 主内容区域 -->
        <div class="flex-1 overflow-auto p-6 pb-20 md:pb-6">
            <div class="max-w-6xl mx-auto">
                <!-- Top Header -->
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-2xl font-bold">比赛战绩</h1>
                    <div class="flex items-center space-x-4">
                        <!-- Notification Button - Placeholder -->
                        <button class="glass p-2 rounded-lg">
                            <img src="https://unpkg.com/lucide-static@latest/icons/bell.svg" class="w-5 h-5">
                        </button>
                        <!-- Mobile menu button (if needed) -->
                        <!-- <div class="md:hidden">
                            <button class="glass p-2 rounded-lg">
                                <img src="https://unpkg.com/lucide-static@latest/icons/menu.svg" class="w-5 h-5">
                            </button>
                        </div> -->
                    </div>
                </div>

                <!-- Loading/Error States -->
                <div v-if="loading" class="text-center text-gray-400">加载中...</div>
                <div v-else-if="error" class="alert-danger">{{ error }}</div>

                <!-- Content when data is loaded -->
                <div v-else-if="userTeam">
                    <!-- 比赛概览 -->
                    <div class="glass rounded-xl p-6 mb-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
                        <div class="flex flex-col md:flex-row md:items-center justify-between">
                            <div>
                                <h2 class="text-xl font-bold mb-2">{{ userTeam.name }}</h2>
                                <p class="text-gray-300 mb-4">当前状态: <span class="text-green-400 font-medium">{{ userTeam.status }}</span></p> <!-- Use actual team status -->
                            </div>
                            <div class="mt-4 md:mt-0 flex space-x-4">
                                <div class="glass p-4 rounded-lg">
                                    <div class="text-center">
                                        <p class="text-sm text-gray-300">胜场</p>
                                        <p class="font-bold text-xl">{{ totalWins }}</p>
                                    </div>
                                </div>
                                <div class="glass p-4 rounded-lg">
                                    <div class="text-center">
                                        <p class="text-sm text-gray-300">败场</p>
                                        <p class="font-bold text-xl">{{ totalLosses }}</p>
                                    </div>
                                </div>
                                <div class="glass p-4 rounded-lg">
                                    <div class="text-center">
                                        <p class="text-sm text-gray-300">总得分</p>
                                        <p class="font-bold text-xl text-gray-400">?</p> <!-- Requires turn data -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 标签页切换 -->
                    <div class="flex mb-6 overflow-x-auto">
                        <button :class="['tab px-6 py-3 rounded-t-lg font-medium', { 'active': activeTab === 'details' }]" @click="switchTab('details')">比赛详情</button>
                        <button :class="['tab px-6 py-3 rounded-t-lg font-medium', { 'active': activeTab === 'songs' }]" @click="switchTab('songs')">歌曲选择</button>
                        <button :class="['tab px-6 py-3 rounded-t-lg font-medium', { 'active': activeTab === 'stats' }]" @click="switchTab('stats')">队伍数据</button>
                    </div>

                    <!-- 比赛详情内容 -->
                    <div v-show="activeTab === 'details'" id="tab-details" class="tab-content glass rounded-xl p-6 mb-8">
                        <h3 class="text-lg font-bold mb-4">比赛进程</h3>

                        <!-- 比赛进程图 (Placeholder) -->
                        <div class="relative py-8 mb-8">
                            <div class="absolute left-0 right-0 top-1/2 h-1 bg-gray-700 -translate-y-1/2"></div>

                            <div class="flex justify-between relative">
                                <!-- 初赛 -->
                                <div :class="['flex flex-col items-center relative z-10', { 'text-green-400': userTeam.status !== 'scheduled' }]">
                                    <div :class="['w-8 h-8 rounded-full flex items-center justify-center mb-2', userTeam.status !== 'scheduled' ? 'bg-green-600' : 'bg-gray-700']">
                                        <img v-if="userTeam.status !== 'scheduled'" src="https://unpkg.com/lucide-static@latest/icons/check.svg" class="w-4 h-4">
                                        <span v-else class="text-sm font-bold">1</span>
                                    </div>
                                    <p class="text-sm font-medium">初赛</p>
                                    <p class="text-xs text-gray-400">{{ userTeam.status !== 'scheduled' ? '已完成' : '未开始' }}</p>
                                </div>

                                <!-- 复赛 -->
                                <div :class="['flex flex-col items-center relative z-10', { 'text-purple-400': userTeam.status === 'active' }]">
                                    <div :class="['w-8 h-8 rounded-full flex items-center justify-center mb-2', userTeam.status === 'active' ? 'bg-purple-600' : 'bg-gray-700']">
                                        <span class="text-sm font-bold">2</span>
                                    </div>
                                    <p class="text-sm font-medium">复赛</p>
                                    <p class="text-xs text-gray-400">{{ userTeam.status === 'active' ? '进行中' : '未开始' }}</p>
                                </div>

                                <!-- 决赛 -->
                                <div class="flex flex-col items-center relative z-10">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                                        <span class="text-sm font-bold">3</span>
                                    </div>
                                    <p class="text-sm font-medium">决赛</p>
                                    <p class="text-xs text-gray-400">未开始</p>
                                </div>
                            </div>
                        </div>

                        <!-- 当前比赛 -->
                        <div v-if="currentMatch" class="glass rounded-lg p-4 mb-6 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="font-medium">当前比赛</h4>
                                <span class="text-xs bg-purple-500 bg-opacity-30 text-purple-300 px-2 py-1 rounded-full">{{ currentMatch.status }}</span>
                            </div>
                            <div class="flex flex-col md:flex-row justify-between">
                                <div class="mb-4 md:mb-0">
                                    <p class="text-sm text-gray-300">{{ currentMatch.stage }} 第{{ currentMatch.round_number }}轮</p>
                                    <p class="font-bold text-lg">{{ userTeam.name }} vs {{ getOpponentTeam(currentMatch)?.name || currentMatch.team2_code }}</p>
                                    <p class="text-sm">时间: {{ formatTimestamp(currentMatch.created_at) }}</p>
                                </div>
                                <div>
                                    <div class="flex items-center justify-end mb-2">
                                        <span class="text-sm mr-2">我方血量:</span>
                                        <span class="font-bold">{{ userTeam.current_health }}</span>
                                    </div>
                                    <HealthBar :health="userTeam.current_health" team-color="blue" class="w-48" />
                                    <div class="flex items-center justify-end mt-3 mb-2">
                                        <span class="text-sm mr-2">对方血量:</span>
                                        <span class="font-bold">{{ currentMatch.team1_code === userTeam.code ? currentMatch.team2_health : currentMatch.team1_health }}</span> <!-- Need opponent health in Match type or fetch -->
                                    </div>
                                    <HealthBar :health="currentMatch.team1_code === userTeam.code ? currentMatch.team2_health : currentMatch.team1_health" team-color="red" class="w-48" /> <!-- Need opponent health -->
                                </div>
                            </div>
                        </div>
                         <div v-else>
                             <p class="text-gray-400">暂无正在进行的比赛。</p>
                         </div>


                        <!-- 历史比赛 -->
                        <h4 class="font-medium mb-4">历史比赛</h4>
                        <div class="space-y-4">
                            <div v-for="match in historicalMatches" :key="match.id" class="glass rounded-lg p-4 hover:bg-white/5 transition">
                                <div class="flex flex-col md:flex-row justify-between">
                                    <div class="mb-4 md:mb-0">
                                        <div class="flex items-center mb-1">
                                            <span class="text-sm text-gray-300 mr-2">{{ match.stage }} 第{{ match.round_number }}轮</span>
                                            <span :class="['text-xs px-2 py-0.5 rounded-full', getMatchResultStatus(match) === 'win' ? 'bg-green-500 bg-opacity-30 text-green-300' : 'bg-red-500 bg-opacity-30 text-red-300']">
                                                {{ getMatchResultStatus(match) === 'win' ? '胜利' : '失败' }}
                                            </span>
                                        </div>
                                        <p class="font-bold">{{ userTeam.name }} vs {{ getOpponentTeam(match)?.name || (match.team1_code === userTeam.code ? match.team2_code : match.team1_code) }}</p>
                                        <p class="text-sm">时间: {{ formatTimestamp(match.created_at) }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-sm">最终血量:
                                             <span :class="['font-bold', getMatchResultStatus(match) === 'win' ? 'text-green-400' : 'text-red-400']">{{ match.team1_code === userTeam.code ? match.team1_health : match.team2_health }}</span> <!-- Need final health in Match type -->
                                             :
                                             <span :class="['font-bold', getMatchResultStatus(match) === 'loss' ? 'text-green-400' : 'text-red-400']">{{ match.team1_code === userTeam.code ? match.team2_health : match.team1_health }}</span> <!-- Need final health -->
                                        </p>
                                        <p class="text-sm">总伤害输出: <span class="font-bold text-gray-400">?</span></p> <!-- Requires turn data -->
                                        <button class="mt-2 text-xs text-purple-400 hover:underline">查看详情</button> <!-- TODO: Implement match detail view -->
                                    </div>
                                </div>
                            </div>
                             <div v-if="historicalMatches.length === 0 && !loading && !error">
                                 <p class="text-gray-400">暂无历史比赛记录。</p>
                             </div>
                        </div>
                    </div>

                    <!-- 歌曲选择区域 (默认隐藏) -->
                    <div v-show="activeTab === 'songs'" id="tab-songs" class="tab-content glass rounded-xl p-6 mb-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold">歌曲选择</h3>
                            <div class="flex space-x-2">
                                <!-- <button class="bg-purple-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition">保存选择</button> -->
                                <span class="text-gray-400 text-sm">歌曲选择功能待实现</span>
                            </div>
                        </div>

                        <!-- 选择说明 -->
                        <div class="glass rounded-lg p-4 mb-6 bg-blue-900/20">
                            <div class="flex items-start space-x-3">
                                <div class="bg-blue-500 bg-opacity-20 p-2 rounded-full mt-1">
                                    <img src="https://unpkg.com/lucide-static@latest/icons/info.svg" class="w-5 h-5">
                                </div>
                                <div>
                                    <h4 class="font-medium mb-1">歌曲选择规则</h4>
                                    <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
                                        <li>初赛和复赛各可选择至多两首歌曲</li>
                                        <li>同一赛段内不能选择重复歌曲</li>
                                        <li>同组内可以选择相同歌曲</li>
                                        <li>若双方血量在12首歌后均未归零，将由staff随机后续歌曲</li>
                                        <li>决赛曲目由staff指定，不可挑选</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- 初赛歌曲选择 (Placeholder) -->
                        <div class="mb-8">
                            <h4 class="font-medium mb-4">初赛歌曲选择 (已选择 ?/2)</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <!-- Song cards will be populated here -->
                                <div class="text-gray-400">歌曲列表待加载...</div>
                            </div>
                        </div>

                        <!-- 复赛歌曲选择 (Placeholder) -->
                        <div>
                            <h4 class="font-medium mb-4">复赛歌曲选择 (已选择 ?/2)</h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <!-- Song cards will be populated here -->
                                <div class="text-gray-400">歌曲列表待加载...</div>
                            </div>
                        </div>
                    </div>

                    <!-- 队伍数据区域 (默认隐藏) -->
                    <div v-show="activeTab === 'stats'" id="tab-stats" class="tab-content glass rounded-xl p-6 mb-8">
                        <h3 class="text-lg font-bold mb-6">队伍数据分析</h3>

                        <!-- 队伍成员表现 -->
                        <div class="mb-8">
                            <h4 class="font-medium mb-4">队伍成员表现</h4>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead>
                                        <tr class="text-left text-gray-400 text-sm">
                                            <th class="pb-3 pl-4">队员</th>
                                            <th class="pb-3">职业</th>
                                            <th class="pb-3">场次</th>
                                            <th class="pb-3">平均完成率</th>
                                            <th class="pb-3">总伤害</th>
                                            <th class="pb-3 rounded-r-lg">MVP次数</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="member in userTeamMembers" :key="member.id" class="glass hover:bg-white/5">
                                            <td class="py-3 pl-4 rounded-l-lg">
                                                <div class="flex items-center space-x-3">
                                                    <img :src="member.avatar_url || 'https://via.placeholder.com/150'" :alt="`${member.nickname}头像`" class="w-8 h-8 rounded-full object-cover">
                                                    <span>{{ member.nickname }} <span v-if="member.id === userMember?.id">(你)</span></span>
                                                </div>
                                            </td>
                                            <td class="py-3">{{ member.profession }}</td>
                                            <td class="py-3 text-gray-400">?</td> <!-- Requires turn data -->
                                            <td class="py-3 text-gray-400">?</td> <!-- Requires turn data -->
                                            <td class="py-3 text-gray-400">?</td> <!-- Requires turn data -->
                                            <td class="py-3 rounded-r-lg text-gray-400">?</td> <!-- Requires turn data -->
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- 队伍总数据 -->
                        <div>
                             <h4 class="font-medium mb-4">队伍总览</h4>
                             <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                 <div class="glass rounded-lg p-4">
                                     <p class="text-sm text-gray-300">总血量恢复</p>
                                     <p class="font-bold text-xl mt-1 text-gray-400">?</p> <!-- Requires turn data -->
                                 </div>
                                 <div class="glass rounded-lg p-4">
                                     <p class="text-sm text-gray-300">总伤害无效化</p>
                                     <p class="font-bold text-xl mt-1 text-gray-400">?</p> <!-- Requires turn data -->
                                 </div>
                                 <div class="glass rounded-lg p-4">
                                     <p class="text-sm text-gray-300">复影折镜触发次数</p>
                                     <p class="font-bold text-xl mt-1 text-gray-400">?</p> <!-- Requires turn data -->
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
                 <div v-else-if="!loading && !error">
                     <p class="text-center text-gray-400">你还没有加入队伍。</p>
                 </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Keep all styles from the HTML <style> block */
body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    min-height: 100vh;
}
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
/* Sidebar styles are now in Sidebar.vue */
/* .sidebar-item { ... } */
/* .sidebar-item:hover { ... } */
/* .sidebar-item.active { ... } */

.element-fire {
    color: #ef4444;
}
.element-wood {
    color: #10b981;
}
.element-water {
    color: #3b82f6;
}
.bg-element-fire {
    background: linear-gradient(135deg, #ef4444, #f87171);
}
.bg-element-wood {
    background: linear-gradient(135deg, #10b981, #34d399);
}
.bg-element-water {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
}
.song-card {
    transition: all 0.3s ease;
}
.song-card:hover {
    transform: translateY(-5px);
}
.song-card.selected {
    border: 2px solid #8b5cf6;
}
.tab {
    transition: all 0.3s ease;
    cursor: pointer;
}
.tab.active {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
}
/* HealthBar styles are now in HealthBar.vue */
/* .health-bar { ... } */
/* .health-fill { ... } */
/* .opponent-health-fill { ... } */

table {
    width: 100%;
    border-collapse: collapse;
}
th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
th {
    color: #cbd5e1; /* slate-300 */
    font-weight: 500;
    font-size: 0.9rem;
}
tbody tr:last-child td {
    border-bottom: none;
}
tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

.alert-danger {
    background: rgba(239, 68, 68, 0.1); /* red-500 with alpha */
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171; /* red-400 */
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
}
</style>
