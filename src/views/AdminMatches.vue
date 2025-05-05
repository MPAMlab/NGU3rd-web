<!-- src/views/AdminMatches.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useKindeAuth } from '../composables/useKindeAuth'; // Adjust path
import { Match, Team, Member, MatchTurn, Song, LiveMatchState } from '../types'; // Adjust path
import Sidebar from '../components/Sidebar.vue'; // Import Sidebar
import PlayerCard from '../components/PlayerCard.vue'; // Import PlayerCard
import HealthBar from '../components/HealthBar.vue'; // Import HealthBar

const { authenticatedFetch, userMember } = useKindeAuth();

const currentView = ref<'list' | 'setup' | 'editing' | 'completed'>('list');
const loading = ref(true);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const alertMessage = ref<string | null>(null); // For health/game alerts

const matches = ref<Match[]>([]);
const selectedMatch = ref<Match | null>(null);
const selectedMatchDetails = ref<{
    match: Match;
    team1: Team & { members: Member[] };
    team2: Team & { members: Member[] };
    turns: MatchTurn[];
} | null>(null);

// State for Round Setup View
const setupTeam1Players = ref<Member[]>([]);
const setupTeam2Players = ref<Member[]>([]);
const setupPlayerOrder = ref<{ team1: number[], team2: number[] }>({ team1: [], team2: [] }); // Store selected member IDs

// State for Match Editing View
const editingTeam1Health = computed(() => selectedMatchDetails.value?.team1.current_health ?? 0);
const editingTeam2Health = computed(() => selectedMatchDetails.value?.team2.current_health ?? 0);
const editingTeam1HasMirror = computed(() => selectedMatchDetails.value?.team1.has_revive_mirror === 1);
const editingTeam2HasMirror = computed(() => selectedMatchDetails.value?.team2.has_revive_mirror === 1);
const editingCurrentTurnIndex = computed(() => selectedMatchDetails.value?.match.current_song_index ?? 0);
const editingTotalTurns = computed(() => selectedMatchDetails.value?.turns.length ?? 0); // Assuming turns are pre-defined for final, or dynamic for others

const editingCurrentTurnInfo = computed(() => {
    if (!selectedMatchDetails.value) return null;
    // Find the turn corresponding to the current_song_index
    return selectedMatchDetails.value.turns.find(turn => turn.song_index === editingCurrentTurnIndex.value);
});

const editingCurrentPlayers = computed(() => {
    if (!editingCurrentTurnInfo.value || !selectedMatchDetails.value) return { team1: null, team2: null };
    const team1Player = selectedMatchDetails.value.team1.members.find(m => m.id === editingCurrentTurnInfo.value?.playing_member_id_team1);
    const team2Player = selectedMatchDetails.value.team2.members.find(m => m.id === editingCurrentTurnInfo.value?.playing_member_id_team2);
    return { team1: team1Player, team2: team2Player };
});


const turnFormData = ref({
    team1MemberId: null as number | null,
    team2MemberId: null as number | null,
    scorePercent1: '',
    scorePercent2: '',
    difficultyLevelPlayed: '', // Should come from selected song or input
    songName: '', // Should come from selected song or input
    songId: null as number | null, // Optional song ID
});

// State for Round Completed View
const completedWinnerTeamName = ref('');
const completedTeam1FinalHealth = ref(0);
const completedTeam2FinalHealth = ref(0);


onMounted(() => {
    fetchMatches();
});

async function fetchMatches() {
    loading.value = true;
    error.value = null;
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed to fetch matches: ${response.statusText}`);
        }
        const data = await response.json();
        matches.value = data.matches || [];
        console.log("Fetched matches:", matches.value);
    } catch (e: any) {
        console.error("Error fetching matches:", e);
        error.value = e.message || 'Failed to load matches.';
    } finally {
        loading.value = false;
    }
}

async function selectMatch(matchId: number) {
    loading.value = true;
    error.value = null;
    selectedMatchDetails.value = null; // Clear previous selection
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed to fetch match ${matchId} details: ${response.statusText}`);
        }
        const data = await response.json();
        selectedMatchDetails.value = data.match;
        selectedMatch.value = data.match; // Also set the basic match ref

        console.log("Fetched match details:", selectedMatchDetails.value);

        // Determine which view to show based on match status
        if (selectedMatchDetails.value?.match.status === 'scheduled') {
            setupTeam1Players.value = selectedMatchDetails.value.team1.members;
            setupTeam2Players.value = selectedMatchDetails.value.team2.members;
            // Reset player order selection
            setupPlayerOrder.value = { team1: [], team2: [] };
            // Pre-select first players if available (optional)
            if (setupTeam1Players.value.length > 0) setupPlayerOrder.value.team1[0] = setupTeam1Players.value[0].id;
            if (setupTeam2Players.value.length > 0) setupPlayerOrder.value.team2[0] = setupTeam2Players.value[0].id;

            currentView.value = 'setup';
        } else if (selectedMatchDetails.value?.match.status === 'active') {
             // Populate player order for editing view (based on setup or previous turns)
             // In a real app, player order might be fixed after setup or determined per turn.
             // For now, let's assume player order is fixed after setup and stored somewhere,
             // or we need to fetch it. The backend /api/admin/matches/:id should return this.
             // Assuming for now the backend returns playerOrderA/B in the match details or we derive it.
             // If player order is per turn, the editing view needs to select players for the *next* turn.
             // Let's simplify: Assume player order is fixed 1,2,3 after setup.
             setupPlayerOrder.value.team1 = selectedMatchDetails.value.team1.members.map(m => m.id);
             setupPlayerOrder.value.team2 = selectedMatchDetails.value.team2.members.map(m => m.id);

             // Reset turn form data
             resetTurnFormData();

             currentView.value = 'editing';
        } else if (selectedMatchDetails.value?.match.status === 'completed') {
            completedWinnerTeamName.value = selectedMatchDetails.value.match.winner_team_code === selectedMatchDetails.value.team1.code ? selectedMatchDetails.value.team1.name : selectedMatchDetails.value.team2.name;
            completedTeam1FinalHealth.value = selectedMatchDetails.value.team1.current_health;
            completedTeam2FinalHealth.value = selectedMatchDetails.value.team2.current_health;
            currentView.value = 'completed';
        } else {
             // Unknown status, maybe show an error or default view
             error.value = `Unknown match status: ${selectedMatchDetails.value?.match.status}`;
             currentView.value = 'list'; // Go back to list
        }


    } catch (e: any) {
        console.error(`Error fetching match ${matchId} details:`, e);
        error.value = e.message || 'Failed to load match details.';
        currentView.value = 'list'; // Go back to list on error
    } finally {
        loading.value = false;
    }
}

function resetTurnFormData() {
     turnFormData.value = {
        team1MemberId: null,
        team2MemberId: null,
        scorePercent1: '',
        scorePercent2: '',
        difficultyLevelPlayed: '',
        songName: '',
        songId: null,
     };
     alertMessage.value = null;
     successMessage.value = null;
}


async function startMatch() {
    if (!selectedMatchDetails.value) return;

    // Validate player order selection in setup view
    if (selectedMatchDetails.value.match.stage !== 'final') { // Final stage songs are pre-set, player order might be different
        if (setupPlayerOrder.value.team1.filter(id => id !== null).length !== 3 || setupPlayerOrder.value.team2.filter(id => id !== null).length !== 3) {
            alert("请为两支队伍选择完整的3名选手顺序！");
            return;
        }
         // Check for duplicates within each team's order
         const team1Set = new Set(setupPlayerOrder.value.team1);
         const team2Set = new Set(setupPlayerOrder.value.team2);
         if (team1Set.size !== 3 || team2Set.size !== 3) {
             alert("每支队伍的选手顺序不能重复！");
             return;
         }
    }


    if (!confirm(`确定要开始比赛 ${selectedMatchDetails.value.match.id} 吗？`)) return;

    loading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
        // Send player order with the start request if needed by backend
        // Our backend start endpoint doesn't currently take player order.
        // It assumes player order is handled elsewhere or fixed (e.g., by join order).
        // If player order is set at start, the backend API needs modification.
        // For now, we proceed assuming backend doesn't need order here.
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${selectedMatchDetails.value.match.id}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed to start match: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Match started:", result);

        successMessage.value = "比赛已成功开始！";
        // Refresh match details to switch to editing view
        await selectMatch(selectedMatchDetails.value.match.id);

    } catch (e: any) {
        console.error("Error starting match:", e);
        error.value = e.message || '启动比赛失败。';
    } finally {
        loading.value = false;
    }
}

async function recordTurn() {
    if (!selectedMatchDetails.value) return;

    // Get current players based on current turn index and player order
    const team1PlayerId = setupPlayerOrder.value.team1[editingCurrentTurnIndex.value];
    const team2PlayerId = setupPlayerOrder.value.team2[editingCurrentTurnIndex.value];

    if (!team1PlayerId || !team2PlayerId) {
         alert("无法确定当前轮次的对战选手，请检查设置。");
         return;
    }

    // Validate score inputs
    const score1 = turnFormData.value.scorePercent1;
    const score2 = turnFormData.value.scorePercent2;

    // Basic format validation (e.g., "100.4902")
    const scoreRegex = /^\d+\.\d{4}$/;
    if (!scoreRegex.test(score1) || !scoreRegex.test(score2)) {
        alert("完成率格式不正确。请确保格式为 X.YYYY (例如 100.4902)。");
        return;
    }

    // Validate song info
    if (!turnFormData.value.songName || !turnFormData.value.difficultyLevelPlayed) {
         alert("请填写歌曲名称和难度。");
         return;
    }

    // Combine score and effect input (if needed by backend)
    // Our backend calculation only uses the score percentage.
    // The "特殊效果血量调整" input in the HTML prototype is not directly used in the MATLAB logic.
    // If this is a separate manual adjustment, you'd need a different API endpoint or add it to the turn data and modify backend calculation.
    // For now, we'll ignore the effect inputs based on the provided MATLAB logic.

    const turnData = {
        matchId: selectedMatchDetails.value.match.id,
        team1MemberId: team1PlayerId,
        team2MemberId: team2PlayerId,
        scorePercent1: score1,
        scorePercent2: score2,
        difficultyLevelPlayed: turnFormData.value.difficultyLevelPlayed,
        songName: turnFormData.value.songName,
        songId: turnFormData.value.songId, // Can be null
    };

    if (!confirm(`确定要记录本轮成绩并计算吗？\n队伍A (${editingCurrentPlayers.value.team1?.nickname}): ${score1}\n队伍B (${editingCurrentPlayers.value.team2?.nickname}): ${score2}`)) return;

    loading.value = true;
    error.value = null;
    successMessage.value = null;
    alertMessage.value = null;


    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${selectedMatchDetails.value.match.id}/record-turn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(turnData),
        });
        if (!response.ok) {
             const err = await response.json();
             throw new Error(err.error || `Failed to record turn: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Turn recorded:", result);

        successMessage.value = "轮次成绩已记录。";

        // Check if match ended based on the response
        if (result.matchStatus === 'completed') {
             alertMessage.value = `比赛结束！胜者是 ${result.winnerTeamCode || '未知队伍'}！`;
             // The backend already updated the status to 'completed'.
             // Refresh match details to switch to the completed view.
             await selectMatch(selectedMatchDetails.value.match.id);

        } else {
             // Match is still active, refresh details to show updated health and next turn info
             await selectMatch(selectedMatchDetails.value.match.id);
        }

    } catch (e: any) {
        console.error("Error recording turn:", e);
        error.value = e.message || '记录成绩失败。';
    } finally {
         loading.value = false;
    }
}

async function endMatch() {
     if (!selectedMatchDetails.value) return;
     if (!confirm(`确定要手动结束比赛 ${selectedMatchDetails.value.match.id} 吗？`)) return;

     loading.value = true;
     error.value = null;
     successMessage.value = null;
     alertMessage.value = null;

     try {
         const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${selectedMatchDetails.value.match.id}/end`, {
             method: 'POST',
         });
         if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || `Failed to end match: ${response.statusText}`);
         }
         const result = await response.json();
         console.log("Match ended:", result);

         successMessage.value = `比赛已手动结束！胜者是 ${result.winnerTeamCode || '未知队伍'}。`;
         // Refresh match details to switch to the completed view
         await selectMatch(selectedMatchDetails.value.match.id);

     } catch (e: any) {
         console.error("Error ending match:", e);
         error.value = e.message || '结束比赛失败。';
     } finally {
         loading.value = false;
     }
}

async function getRandomSongForMatch() {
     if (!selectedMatchDetails.value) return null;

     loading.value = true;
     error.value = null;
     // successMessage.value = null; // Don't clear success message for recording turn

     try {
         const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${selectedMatchDetails.value.match.id}/random-song`);
         if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || `Failed to get random song: ${response.statusText}`);
         }
         const data = await response.json();
         const randomSong: Song = data.song;
         console.log("Random song:", randomSong);

         // Populate the song fields in the turn form
         turnFormData.value.songName = randomSong.name;
         // You might need logic to select a default difficulty or let staff choose
         // For now, let's pick the highest difficulty available (e.g., ReM > MST > EXP...)
         const difficulties = ['ReM', 'MST', 'EXP', 'ADV', 'BAS'];
         for (const diff of difficulties) {
             if (randomSong.difficulties && randomSong.difficulties[diff as keyof Song['difficulties']]) {
                 turnFormData.value.difficultyLevelPlayed = diff;
                 break;
             }
         }
         turnFormData.value.songId = randomSong.id || null; // Use song ID if available

         successMessage.value = `已获取随机歌曲：${randomSong.name} (${turnFormData.value.difficultyLevelPlayed})`;

         return randomSong;
     } catch (e: any) {
         console.error("Error getting random song:", e);
         error.value = e.message || '获取随机歌曲失败。';
         return null;
     } finally {
         loading.value = false;
     }
}

// TODO: Implement handleAdminCreateMatch
// TODO: Implement handleAdminSetFinalSongs (for final matches)

function backToList() {
    selectedMatchDetails.value = null;
    selectedMatch.value = null;
    setupTeam1Players.value = [];
    setupTeam2Players.value = [];
    setupPlayerOrder.value = { team1: [], team2: [] };
    resetTurnFormData();
    error.value = null;
    successMessage.value = null;
    alertMessage.value = null;
    currentView.value = 'list';
    fetchMatches(); // Refresh the list
}

// Computed properties for view switching
const isListView = computed(() => currentView.value === 'list');
const isSetupView = computed(() => currentView.value === 'setup');
const isEditingView = computed(() => currentView.value === 'editing');
const isCompletedView = computed(() => currentView.value === 'completed');

// Computed properties for player order selects in Setup view
const setupTeam1PlayerOptions = computed(() => setupTeam1Players.value.map(p => ({ value: p.id, text: `${p.nickname} (${p.profession})` })));
const setupTeam2PlayerOptions = computed(() => setupTeam2Players.value.map(p => ({ value: p.id, text: `${p.nickname} (${p.profession})` })));

// Computed properties for player cards in Editing view
const editingTeam1PlayerCards = computed(() => {
    if (!selectedMatchDetails.value) return [];
    // Map player IDs in order to full member objects
    return setupPlayerOrder.value.team1
        .map(playerId => selectedMatchDetails.value?.team1.members.find(m => m.id === playerId))
        .filter(player => player !== undefined) as Member[]; // Filter out undefined and cast
});
const editingTeam2PlayerCards = computed(() => {
    if (!selectedMatchDetails.value) return [];
     return setupPlayerOrder.value.team2
        .map(playerId => selectedMatchDetails.value?.team2.members.find(m => m.id === playerId))
        .filter(player => player !== undefined) as Member[]; // Filter out undefined and cast
});

// Computed property to check if match is completed after recording turn
const isMatchCompletedAfterTurn = computed(() => {
    if (!selectedMatchDetails.value) return false;
    // Check the health *after* the calculation (if available in a reactive way, or re-fetch)
    // For simplicity here, we'll rely on the backend response status
    // A better way is to update selectedMatchDetails.value after recordTurn
    // Let's assume selectMatch updates it correctly.
    return selectedMatchDetails.value.match.status === 'completed';
});

// Computed property to show the "End Match" button
const showEndMatchButton = computed(() => {
    // Show if in editing view and match is active
    return isEditingView.value && selectedMatchDetails.value?.match.status === 'active';
});

// Computed property to show the "Submit Score" button
const showSubmitScoreButton = computed(() => {
     // Show if in editing view and match is active and not completed by this turn
     return isEditingView.value && selectedMatchDetails.value?.match.status === 'active';
});

// Computed property to show "Add Random Song" button
const showAddRandomSongButton = computed(() => {
    // Show if in editing view, match is active, and current turn index is >= 12 (or other rule)
    return isEditingView.value && selectedMatchDetails.value?.match.status === 'active' && editingCurrentTurnIndex.value >= 12; // Example rule
});


</script>

<template>
    <div class="flex h-screen">
        <Sidebar /> <!-- Use the reusable Sidebar component -->

        <!-- 主内容区域 -->
        <div class="flex-1 overflow-auto pb-16 md:pb-0" id="main-panel-content">
            <div class="max-w-7xl mx-auto p-6">
                <!-- Top Header -->
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-2xl font-bold">编辑轮次信息</h1>
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

                <!-- Match Stage Selector (Placeholder) -->
                <div class="glass rounded-xl p-6 mb-8">
                    <div class="flex flex-wrap gap-4">
                        <!-- Add buttons here to filter matches by stage -->
                        <button class="glass px-6 py-3 rounded-lg font-medium bg-purple-600/30 hover:bg-purple-600/50 transition">初赛阶段</button>
                        <button class="glass px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">复赛阶段</button>
                        <button class="glass px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition">决赛阶段</button>
                    </div>
                </div>

                <!-- Loading/Error States -->
                <div v-if="loading" class="text-center text-gray-400">加载中...</div>
                <div v-else-if="error" class="alert-danger">{{ error }}</div>

                <!-- Rounds List View -->
                <div v-show="isListView && !loading && !error">
                    <h2 class="text-2xl font-semibold mb-4">所有轮次</h2>
                    <div class="glass rounded-lg p-6">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th>轮次</th>
                                        <th>状态</th>
                                        <th>队伍 A</th>
                                        <th>队伍 B</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="match in matches" :key="match.id" class="glass hover:bg-white/5">
                                        <td class="py-3 pl-4 rounded-l-lg">{{ match.stage }} - 第{{ match.round_number }}轮</td>
                                        <td class="py-3">
                                            <span v-if="match.status === 'completed'" class="text-green-400">已完成</span>
                                            <span v-else-if="match.status === 'active'" class="text-yellow-400">进行中</span>
                                            <span v-else class="text-gray-400">待开始</span>
                                        </td>
                                        <td class="py-3">{{ match.team1_name }}</td>
                                        <td class="py-3">{{ match.team2_name }}</td>
                                        <td class="py-3 rounded-r-lg">
                                            <button class="text-purple-400 hover:underline" @click="selectMatch(match.id)">
                                                {{ match.status === 'completed' ? '查看' : match.status === 'active' ? '编辑' : '设置' }}
                                            </button>
                                        </td>
                                    </tr>
                                     <tr v-if="matches.length === 0 && !loading && !error">
                                         <td colspan="5" class="text-center py-4 text-gray-400">暂无比赛数据。</td>
                                     </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Round Setup View -->
                <div v-show="isSetupView && selectedMatchDetails && !loading && !error">
                    <button class="text-gray-400 hover:underline mb-4" @click="backToList">&larr; 返回轮次列表</button>
                    <h2 class="text-2xl font-semibold mb-4">设置轮次：<span>{{ selectedMatchDetails.match.stage }} - 第{{ selectedMatchDetails.match.round_number }}轮</span></h2>

                    <div class="glass rounded-lg p-6 mb-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Team A Setup -->
                            <div class="glass rounded-lg p-4">
                                <h3 class="text-xl font-bold mb-4 text-blue-400">{{ selectedMatchDetails.team1.name }}</h3>
                                <div class="space-y-4">
                                    <div v-for="i in 3" :key="i">
                                        <label class="block text-sm font-medium text-gray-300 mb-1">选手 {{ i }} ({{ i === 1 ? '首发' : '' }})</label>
                                        <select v-model="setupPlayerOrder.team1[i-1]" class="w-full input-glass">
                                            <option :value="null">选择选手</option>
                                            <option v-for="player in setupTeam1Players" :key="player.id" :value="player.id">
                                                {{ player.nickname }} ({{ player.profession }})
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Team B Setup -->
                            <div class="glass rounded-lg p-4">
                                <h3 class="text-xl font-bold mb-4 text-red-400">{{ selectedMatchDetails.team2.name }}</h3>
                                <div class="space-y-4">
                                     <div v-for="i in 3" :key="i">
                                        <label class="block text-sm font-medium text-gray-300 mb-1">选手 {{ i }} ({{ i === 1 ? '首发' : '' }})</label>
                                        <select v-model="setupPlayerOrder.team2[i-1]" class="w-full input-glass">
                                            <option :value="null">选择选手</option>
                                            <option v-for="player in setupTeam2Players" :key="player.id" :value="player.id">
                                                {{ player.nickname }} ({{ player.profession }})
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text-center">
                        <button @click="startMatch" class="btn-primary">设置顺序并开始轮次</button>
                    </div>
                </div>


                <!-- Match Editing View -->
                <div v-show="isEditingView && selectedMatchDetails && !loading && !error">
                     <button class="text-gray-400 hover:underline mb-4" @click="backToList">&larr; 返回轮次列表</button>
                    <h2 class="text-2xl font-semibold mb-4">编辑轮次：<span>{{ selectedMatchDetails.match.stage }} - 第{{ selectedMatchDetails.match.round_number }}轮</span></h2>

                    <!-- 正在进行的比赛 -->
                    <div class="glass rounded-xl p-6 mb-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-l-4 border-purple-500">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold flex items-center">
                                <span class="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 circle-pulse"></span>
                                正在进行的比赛：<span>第 {{ editingCurrentTurnIndex + 1 }} 场</span>
                            </h3>
                            <span class="text-sm bg-purple-600/50 px-3 py-1 rounded-full">{{ selectedMatchDetails.match.status === 'active' ? '进行中' : selectedMatchDetails.match.status }}</span>
                        </div>

                        <!-- 队伍对战状态 -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                            <!-- 队伍A -->
                            <div class="glass rounded-lg p-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="font-bold text-lg text-blue-400">{{ selectedMatchDetails.team1.name }}</h4>
                                    <div>
                                        <span class="text-sm text-gray-400 mr-2">血量:</span>
                                        <span class="text-xl font-bold">{{ editingTeam1Health }}</span>
                                    </div>
                                </div>
                                <HealthBar :health="editingTeam1Health" team-color="blue" class="mb-4" />
                                <div class="grid grid-cols-3 gap-2">
                                    <PlayerCard
                                        v-for="player in editingTeam1PlayerCards"
                                        :key="player.id"
                                        :player="player"
                                        :is-current="editingCurrentPlayers.team1?.id === player.id"
                                    />
                                </div>
                            </div>

                            <!-- 队伍B -->
                            <div class="glass rounded-lg p-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="font-bold text-lg text-red-400">{{ selectedMatchDetails.team2.name }}</h4>
                                     <div>
                                        <span class="text-sm text-gray-400 mr-2">血量:</span>
                                        <span class="text-xl font-bold">{{ editingTeam2Health }}</span>
                                    </div>
                                </div>
                                <HealthBar :health="editingTeam2Health" team-color="red" class="mb-4" />
                                <div class="grid grid-cols-3 gap-2">
                                     <PlayerCard
                                        v-for="player in editingTeam2PlayerCards"
                                        :key="player.id"
                                        :player="player"
                                        :is-current="editingCurrentPlayers.team2?.id === player.id"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- 当前歌曲 -->
                        <div class="glass rounded-lg p-4 mb-6">
                            <h3 class="font-bold mb-4">当前歌曲 (<span id="current-song-index">{{ editingCurrentTurnIndex + 1 }}</span>/<span id="total-songs">{{ editingTotalTurns }}</span>)</h3>
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <!-- Song Cover - Placeholder or fetch based on songName/Id -->
                                <img src="https://via.placeholder.com/100x100?text=Song" alt="歌曲封面" class="w-24 h-24 rounded-lg object-cover">
                                <div class="flex-1">
                                    <h4 class="font-bold text-lg">{{ editingCurrentTurnInfo?.song_name_override || '等待歌曲信息...' }}</h4>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        <span v-if="editingCurrentTurnInfo?.difficulty_level_played" class="bg-yellow-500/30 text-yellow-300 text-xs px-2 py-1 rounded">难度: {{ editingCurrentTurnInfo.difficulty_level_played }}</span>
                                        <!-- Element/Picker info might not be in MatchTurn, needs lookup -->
                                        <span class="bg-red-500/30 text-red-300 text-xs px-2 py-1 rounded">属性: ?</span>
                                        <span class="bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded">? 选择</span>
                                    </div>
                                </div>
                                <!-- Add random song button here if needed for >12 songs -->
                                 <div v-if="showAddRandomSongButton" class="md:flex-shrink-0">
                                    <button @click="getRandomSongForMatch" class="glass px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition flex items-center">
                                        <img src="https://unpkg.com/lucide-static@latest/icons/plus.svg" class="w-4 h-4 mr-1">
                                        添加随机歌曲
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 记录当前对战选手成绩 -->
                        <div class="glass rounded-lg p-6 mb-6">
                            <h3 class="font-bold mb-4">记录当前对战选手成绩</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- 队伍A当前选手成绩 -->
                                <div>
                                    <h4 class="font-medium mb-3 text-blue-400">{{ editingCurrentPlayers.team1?.nickname || '选手 A' }}</h4>
                                    <div class="space-y-3">
                                        <div class="flex items-center space-x-3">
                                            <img :src="editingCurrentPlayers.team1?.avatar_url || 'https://via.placeholder.com/150'" alt="队员头像" class="w-10 h-10 rounded-full object-cover">
                                            <div class="flex-1">
                                                <label class="block text-xs text-gray-400 mb-1">完成率小数点后四位 (X.YYYY)</label>
                                                <input type="text" v-model="turnFormData.scorePercent1" class="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass" placeholder="输入 X.YYYY" pattern="\d+\.\d{4}" required>
                                            </div>
                                        </div>
                                         <div class="flex items-center space-x-3">
                                            <img src="https://unpkg.com/lucide-static@latest/icons/heart.svg" class="w-10 h-10 text-red-400 p-2 glass rounded-full"> <!-- Placeholder for effect icon -->
                                            <div class="flex-1">
                                                <label class="block text-xs text-gray-400 mb-1">特殊效果血量调整 (+/-) (暂不使用)</label>
                                                <input type="number" v-model="turnFormData.effect1" class="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass" placeholder="输入数值" disabled>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 队伍B当前选手成绩 -->
                                <div>
                                    <h4 class="font-medium mb-3 text-red-400">{{ editingCurrentPlayers.team2?.nickname || '选手 B' }}</h4>
                                     <div class="space-y-3">
                                        <div class="flex items-center space-x-3">
                                            <img :src="editingCurrentPlayers.team2?.avatar_url || 'https://via.placeholder.com/150'" alt="队员头像" class="w-10 h-10 rounded-full object-cover">
                                            <div class="flex-1">
                                                 <label class="block text-xs text-gray-400 mb-1">完成率小数点后四位 (X.YYYY)</label>
                                                <input type="text" v-model="turnFormData.scorePercent2" class="w-full mt-1 bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass" placeholder="输入 X.YYYY" pattern="\d+\.\d{4}" required>
                                            </div>
                                        </div>
                                         <div class="flex items-center space-x-3">
                                             <img src="https://unpkg.com/lucide-static@latest/icons/heart.svg" class="w-10 h-10 text-red-400 p-2 glass rounded-full"> <!-- Placeholder for effect icon -->
                                            <div class="flex-1">
                                                 <label class="block text-xs text-gray-400 mb-1">特殊效果血量调整 (+/-) (暂不使用)</label>
                                                <input type="number" v-model="turnFormData.effect2" class="w-full mt-1 bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass" placeholder="输入数值" disabled>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex justify-center mt-6">
                                <button v-if="showSubmitScoreButton" @click="recordTurn" class="btn-primary">提交成绩并计算伤害</button>
                            </div>
                        </div>

                        <!-- Alert Area -->
                        <div v-if="alertMessage" class="alert-danger">
                            <p class="font-bold">注意：<span>{{ alertMessage }}</span></p>
                        </div>
                         <div v-if="successMessage" class="alert-success">
                            <p class="font-bold">成功：<span>{{ successMessage }}</span></p>
                        </div>


                        <!-- 比赛结束按钮 -->
                        <div class="flex justify-center mt-6">
                            <button v-if="showEndMatchButton" @click="endMatch" class="bg-red-600 hover:bg-red-700 transition px-8 py-3 rounded-lg font-medium flex items-center">
                                <img src="https://unpkg.com/lucide-static@latest/icons/flag.svg" class="w-5 h-5 mr-2">
                                结束本轮次比赛
                            </button>
                        </div>
                    </div>

                    <!-- 曲目列表 -->
                    <div class="glass rounded-xl p-6 mb-8">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-bold">轮次曲目列表</h2>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead>
                                    <tr class="text-left text-gray-400 text-sm">
                                        <th class="pb-3 pl-4">序号</th>
                                        <th class="pb-3">曲目</th>
                                        <th class="pb-3">难度</th>
                                        <th class="pb-3">属性</th>
                                        <th class="pb-3">选择者</th>
                                        <th class="pb-3">状态</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     <tr v-for="turn in selectedMatchDetails.turns" :key="turn.id" :class="['glass hover:bg-white/5 song-item', { 'border-l-4 border-purple-500': turn.song_index === editingCurrentTurnIndex }]">
                                        <td class="py-3 pl-4 rounded-l-lg">{{ turn.song_index + 1 }}</td>
                                        <td class="py-3">
                                            <div class="flex items-center space-x-3">
                                                <!-- Song Cover - Placeholder -->
                                                <img src="https://via.placeholder.com/50x50?text=Song" alt="歌曲封面" class="w-10 h-10 rounded object-cover">
                                                <div>
                                                    <p class="font-medium">{{ turn.song_name_override }}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="py-3">{{ turn.difficulty_level_played }}</td>
                                        <td class="py-3">
                                             <!-- Element - Needs lookup or stored in turn -->
                                             <span class="text-xs text-gray-400">?</span>
                                        </td>
                                        <td class="py-3">
                                             <!-- Picker - Needs lookup from member ID -->
                                             {{ selectedMatchDetails.team1.members.find(m => m.id === turn.playing_member_id_team1)?.nickname || selectedMatchDetails.team2.members.find(m => m.id === turn.playing_member_id_team2)?.nickname || '?' }}
                                        </td>
                                        <td class="py-3 rounded-r-lg">
                                             <span v-if="turn.song_index < editingCurrentTurnIndex" class="text-green-400">已完成</span>
                                             <span v-else-if="turn.song_index === editingCurrentTurnIndex" class="text-yellow-400">进行中</span>
                                             <span v-else class="text-gray-400">待进行</span>
                                        </td>
                                    </tr>
                                     <tr v-if="selectedMatchDetails.turns.length === 0 && !loading && !error">
                                         <td colspan="6" class="text-center py-4 text-gray-400">暂无轮次记录。</td>
                                     </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Round Completed View -->
                <div v-show="isCompletedView && selectedMatchDetails && !loading && !error">
                    <button class="text-gray-400 hover:underline mb-4" @click="backToList">&larr; 返回轮次列表</button>
                    <div class="glass rounded-lg p-6 text-center">
                        <h2 class="text-3xl font-bold mb-4">轮次结束！</h2>
                        <p class="text-xl mb-4">轮次：<span>{{ selectedMatchDetails.match.stage }} - 第{{ selectedMatchDetails.match.round_number }}轮</span></p>
                        <div class="text-2xl font-bold mb-6">获胜队伍：<span class="text-purple-400">{{ completedWinnerTeamName }}</span></div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div class="glass rounded-lg p-4">
                                <h3 class="text-xl font-bold mb-4 text-blue-400">{{ selectedMatchDetails.team1.name }}</h3>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>最终血量</span>
                                        <span class="font-bold">{{ completedTeam1FinalHealth }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="glass rounded-lg p-4">
                                <h3 class="text-xl font-bold mb-4 text-red-400">{{ selectedMatchDetails.team2.name }}</h3>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span>最终血量</span>
                                        <span class="font-bold">{{ completedTeam2FinalHealth }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button class="btn-primary" @click="backToList">返回轮次列表</button>
                    </div>
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
    color: white;
}
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
 .input-glass {
     background: rgba(255, 255, 255, 0.1);
     border: 1px solid rgba(255, 255, 255, 0.2);
     color: white;
     padding: 8px 12px;
     border-radius: 4px;
 }
 .input-glass:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
 }
 select.input-glass option {
    background: #1e293b; /* Dark background for dropdown options */
    color: white;
 }

.btn-primary {
    background: linear-gradient(90deg, #8b5cf6, #c084fc);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    transition: opacity 0.3s ease;
}
.btn-primary:hover {
    opacity: 0.9;
}
 .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
 }

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    transition: opacity 0.3s ease;
     border: 1px solid rgba(255, 255, 255, 0.1);
}
 .btn-secondary:hover {
    opacity: 0.8;
 }


/* Sidebar styles are now in Sidebar.vue */
/* .sidebar-item { ... } */
/* .sidebar-item:hover { ... } */
/* .sidebar-item.active { ... } */

.team-a {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
}
.team-b {
    background: linear-gradient(135deg, #f43f5e, #e11d48);
}
/* HealthBar styles are now in HealthBar.vue */
/* .health-bar { ... } */
.health-bar-bg {
    background: rgba(0, 0, 0, 0.3);
}
.match-card {
    transition: all 0.3s ease;
}
.match-card:hover {
    transform: translateY(-4px);
}
.song-item {
    transition: all 0.2s ease;
}
.song-item:hover {
    background: rgba(255, 255, 255, 0.03); /* Slightly lighter hover for table rows */
}
.circle-pulse {
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
    }
}

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
/* tbody tr:hover is handled by .song-item:hover */


.alert-danger {
    background: rgba(239, 68, 68, 0.1); /* red-500 with alpha */
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171; /* red-400 */
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
}
 .alert-success {
    background: rgba(16, 185, 129, 0.1); /* green-500 with alpha */
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #6ee7b7; /* green-300 */
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
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

/* PlayerCard styles are now in PlayerCard.vue */
/* .player-card.current { ... } */
</style>
