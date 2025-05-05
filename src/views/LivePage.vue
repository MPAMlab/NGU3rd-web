<!-- src/views/LivePage.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { LiveMatchState } from '../types'; // Adjust path
import HealthBar from '../components/HealthBar.vue'; // Import HealthBar component

const route = useRoute();
// Use defineProps to get matchId from route params (router/index.ts passes it as prop)
const props = defineProps<{
  matchId: string; // matchId will be a string from route params
}>();

const matchIdNumber = computed(() => parseInt(props.matchId, 10));

const liveState = ref<LiveMatchState | null>(null);
const websocket = ref<WebSocket | null>(null);
const connectionStatus = ref<'connecting' | 'open' | 'closed' | 'error'>('connecting');
const error = ref<string | null>(null);

const workerWsUrl = computed(() => {
    if (isNaN(matchIdNumber.value)) return null;
    // Use wss:// for production, ws:// for local dev if needed
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Assuming your Worker is hosted at the same domain as your frontend
    // Adjust if your Worker is on a different subdomain/domain
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}/api/live/ws/${matchIdNumber.value}`;
});

const workerHttpUrl = computed(() => {
     if (isNaN(matchIdNumber.value)) return null;
     const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
     const hostname = window.location.hostname;
     return `${protocol}//${hostname}/api/live/state/${matchIdNumber.value}`;
});


onMounted(() => {
    if (isNaN(matchIdNumber.value)) {
        error.value = 'Invalid match ID in URL.';
        connectionStatus.value = 'error';
        return;
    }
    // Fetch initial state via HTTP first
    fetchInitialState();
    // Then connect to WebSocket
    connectWebSocket();

    // Add orientation check
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
});

onUnmounted(() => {
    // Clean up WebSocket connection when component is unmounted
    if (websocket.value && websocket.value.readyState === WebSocket.OPEN) {
        websocket.value.close();
    }
     window.removeEventListener('resize', checkOrientation);
});

async function fetchInitialState() {
    if (!workerHttpUrl.value) return;
    try {
        const response = await fetch(workerHttpUrl.value);
        if (!response.ok) {
            // It's okay if state is not found initially (e.g., match not started)
            // But log other errors
            if (response.status !== 404) {
                 console.error("Failed to fetch initial live state:", response.status, await response.text());
            }
             liveState.value = null; // Ensure state is null if fetch fails
             return;
        }
        const data: LiveMatchState = await response.json();
        liveState.value = data;
        console.log("Fetched initial live state:", liveState.value);
    } catch (e) {
        console.error("Error fetching initial live state:", e);
        // Don't set global error, WebSocket might still connect
    }
}


function connectWebSocket() {
    if (!workerWsUrl.value) return;

    connectionStatus.value = 'connecting';
    error.value = null;
    websocket.value = new WebSocket(workerWsUrl.value);

    websocket.value.onopen = (event) => {
        console.log('WebSocket connection opened:', event);
        connectionStatus.value = 'open';
        // The DO sends the initial state upon connection, so no need to request it here
    };

    websocket.value.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        try {
            const state: LiveMatchState = JSON.parse(event.data);
            liveState.value = state; // Update reactive state
            console.log("Updated live state:", liveState.value);
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
            // Handle parsing error
        }
    };

    websocket.value.onerror = (event) => {
        console.error('WebSocket error:', event);
        connectionStatus.value = 'error';
        error.value = 'WebSocket connection error.';
    };

    websocket.value.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        connectionStatus.value = 'closed';
        if (!event.wasClean) {
            // Attempt to reconnect if the connection was not closed cleanly
            console.warn('WebSocket connection died, attempting to reconnect...');
            setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
        }
    };
}

// Helper to format calculation log for display
const formattedLog = computed(() => {
    if (!liveState.value?.lastTurnLog) return '';
    return liveState.value.lastTurnLog.join('\n');
});

// Orientation check logic
const isPortrait = ref(false);
function checkOrientation() {
    isPortrait.value = window.matchMedia("(orientation: portrait)").matches;
}

// Placeholder data for team members (replace with data fetched from API if needed)
// For a simple live page, you might not need full member details here,
// just names/avatars from the liveState or pre-fetched match data.
// If you need full rosters, fetch them when fetching initial state.
const team1Members = ref<any[]>([]); // Replace any with actual Member type if fetched
const team2Members = ref<any[]>([]); // Replace any with actual Member type if fetched

// Function to fetch team members (Example - integrate into fetchInitialState)
async function fetchTeamMembers(teamCode: string) {
    try {
        const response = await fetch(`${window.location.origin}/api/teams/${teamCode}`);
        if (!response.ok) {
            console.error(`Failed to fetch members for team ${teamCode}:`, response.status);
            return [];
        }
        const data = await response.json();
        return data.members || [];
    } catch (e) {
        console.error(`Error fetching members for team ${teamCode}:`, e);
        return [];
    }
}

// Update fetchInitialState to also fetch members
async function fetchInitialStateWithMembers() {
     if (!workerHttpUrl.value) return;
     try {
         const response = await fetch(workerHttpUrl.value);
         if (!response.ok) {
             if (response.status !== 404) {
                  console.error("Failed to fetch initial live state:", response.status, await response.text());
             }
              liveState.value = null;
              team1Members.value = [];
              team2Members.value = [];
              return;
         }
         const data: LiveMatchState = await response.json();
         liveState.value = data;
         console.log("Fetched initial live state:", liveState.value);

         // Fetch members for both teams
         if (liveState.value?.team1Code) {
             team1Members.value = await fetchTeamMembers(liveState.value.team1Code);
         }
          if (liveState.value?.team2Code) {
             team2Members.value = await fetchTeamMembers(liveState.value.team2Code);
         }


     } catch (e) {
         console.error("Error fetching initial live state and members:", e);
         liveState.value = null;
         team1Members.value = [];
         team2Members.value = [];
     }
}

// Replace the initial fetch call in onMounted
onMounted(() => {
    if (isNaN(matchIdNumber.value)) {
        error.value = 'Invalid match ID in URL.';
        connectionStatus.value = 'error';
        return;
    }
    fetchInitialStateWithMembers(); // Use the new function
    connectWebSocket();
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
});

// Placeholder for player avatars/names in roster (replace with actual data from teamMembers)
// You'll need to map the player IDs from liveState.currentTurnInfo to the full member objects
const team1CurrentPlayer = computed(() => {
    if (!liveState.value?.currentTurnInfo) return null;
    return team1Members.value.find(m => m.maimai_id === liveState.value?.currentTurnInfo?.team1PlayerMaimaiId);
});
const team2CurrentPlayer = computed(() => {
    if (!liveState.value?.currentTurnInfo) return null;
    return team2Members.value.find(m => m.maimai_id === liveState.value?.currentTurnInfo?.team2PlayerMaimaiId);
});

// Placeholder for team names (use liveState)
const team1Name = computed(() => liveState.value?.team1Name || '队伍 A');
const team2Name = computed(() => liveState.value?.team2Name || '队伍 B');

// Placeholder for current song info (use liveState)
const currentSongName = computed(() => liveState.value?.currentTurnInfo?.songName || '等待歌曲信息...');
const currentSongDifficulty = computed(() => liveState.value?.currentTurnInfo?.difficulty || '');
// Placeholder for song cover (needs song data lookup or include in liveState)
const currentSongCover = computed(() => 'https://via.placeholder.com/100x100?text=Song'); // Replace with actual logic

// Placeholder for round info
const currentRoundInfo = computed(() => {
    if (!liveState.value) return '加载中...';
    const stageMap = { prelim: '初赛', semi: '半决赛', final: '决赛' };
    const stage = stageMap[liveState.value.stage] || liveState.value.stage;
    return `${stage} - 第${liveState.value.currentSongIndex + 1}轮`; // currentSongIndex is 0-indexed turn number
});

// Placeholder for mirror status
const team1MirrorStatus = computed(() => liveState.value?.team1HasMirror ? '可用' : '已使用');
const team2MirrorStatus = computed(() => liveState.value?.team2HasMirror ? '可用' : '已使用');

// Placeholder for element colors (adapt from PlayerCard)
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
    <!-- Portrait Warning -->
    <div v-if="isPortrait" class="portrait-warning">
        <div class="text-center">
            <img src="https://unpkg.com/lucide-static@latest/icons/smartphone-rotate.svg" class="w-16 h-16 mx-auto mb-4 text-white">
            <h2 class="text-2xl font-bold mb-2">请旋转设备</h2>
            <p class="text-gray-300">为获得最佳观看体验，请将设备横向放置</p>
        </div>
    </div>

    <!-- Control Panel (For Demo Only - Remove or make conditional) -->
    <!-- <div class="control-panel glass">
        <div class="flex items-center space-x-3">
            <span class="text-sm">比赛画面</span>
            <label class="toggle-switch">
                <input type="checkbox" id="view-toggle">
                <span class="toggle-slider"></span>
            </label>
            <span class="text-sm">结算页面</span>
        </div>
    </div> -->

    <!-- Live Content -->
    <div v-if="!isPortrait" id="live-view" class="live-container view-transition w-full h-full absolute inset-0 flex items-center justify-center">
        <div class="obs-capture-area">
            <!-- Top Info Bar -->
            <div class="glass flex items-center justify-between px-4 py-2 flex-shrink-0">
                <div class="flex items-center space-x-3">
                    <img src="/logo.png" alt="NGU3rd Logo" class="h-8 w-8 rounded-full"> <!-- Use your actual logo path -->
                    <span class="font-bold text-lg">NGU3rd</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="live-indicator bg-red-500 text-xs px-2 py-0.5 rounded-full">LIVE</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span id="current-round" class="text-sm font-medium">{{ currentRoundInfo }}</span>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="main-content-flex p-4 space-x-4">
                <!-- Left Panel (Team 1) -->
                <div class="w-1/4 flex flex-col space-y-4 pr-2">
                    <!-- Team Roster (Team 1) -->
                    <div class="glass rounded-lg p-4 flex-shrink-0">
                        <h3 class="text-lg font-bold mb-3 text-blue-400">{{ team1Name }}</h3>
                        <div class="space-y-3">
                            <!-- Player List -->
                            <div v-for="player in team1Members" :key="player.id" class="flex items-center space-x-3">
                                <img :src="player.avatar_url || 'https://via.placeholder.com/150'" :alt="`${player.nickname}头像`" class="w-8 h-8 rounded-full object-cover">
                                <div class="flex items-center justify-between flex-grow">
                                    <p class="font-medium text-sm">{{ player.nickname }}</p>
                                    <div class="flex items-center">
                                        <span :class="['text-xs mr-2', getElementColorClass(player.element)]">{{ player.element === 'fire' ? '火 (R)' : player.element === 'wood' ? '木 (G)' : '水 (B)' }}</span>
                                        <span class="text-xs">{{ player.profession }}</span>
                                        <span v-if="team1CurrentPlayer?.id === player.id" class="current-player-badge bg-blue-500"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Health Display (Team 1) -->
                    <div class="glass rounded-lg p-4 flex-shrink-0">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium">队伍血量</h4>
                            <span id="team1-health-value" class="text-blue-400 font-bold">{{ liveState?.team1Health ?? 'N/A' }}</span>
                        </div>
                        <HealthBar :health="liveState?.team1Health ?? 0" team-color="blue" />
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-xs text-gray-300">复影折镜状态:</span>
                            <span id="team1-shield-status" :class="['text-xs', liveState?.team1HasMirror ? 'text-green-400' : 'text-gray-400']">{{ team1MirrorStatus }}</span>
                        </div>
                    </div>

                    <!-- Machine Info Cam (Team 1) - Placeholder -->
                    <div class="camera-feed-vertical glass overflow-hidden relative flex-grow">
                         <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="机台信息板" class="w-full h-full object-cover">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p class="text-xs font-medium">{{ team1Name }} - 机台信息</p>
                        </div>
                    </div>

                    <!-- Sponsor Logo (Left) - Placeholder -->
                    <div class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0">
                        <img src="https://images.unsplash.com/photo-1563906267088-b029e7101114?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="赞助商Logo" class="h-12 max-w-full object-contain">
                    </div>
                </div>

                <!-- Middle Panel -->
                <div class="flex-1 flex flex-col space-y-4 px-2">
                    <!-- Current Song Info -->
                    <div class="glass rounded-lg p-4 flex items-center justify-between flex-shrink-0">
                        <div class="flex items-center space-x-4">
                            <img :src="currentSongCover" alt="Current Song" class="w-12 h-12 rounded object-cover">
                            <div>
                                <h3 class="font-bold text-base">{{ currentSongName }}</h3>
                                <p class="text-xs text-gray-300">难度: {{ currentSongDifficulty }} | <span class="text-blue-400 font-medium">{{ liveState?.currentTurnInfo?.team1PlayerName || '队伍 A' }} 选曲</span></p>
                            </div>
                        </div>
                    </div>

                    <!-- Player Camera Feeds (Middle) - Placeholder -->
                    <div class="flex space-x-4 flex-grow items-center justify-center">
                        <div class="camera-feed-vertical glass overflow-hidden relative h-full" style="width: calc(50% - 8px);">
                            <img src="https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${team1Name}摄像头`" class="w-full h-full object-cover">
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p class="text-sm font-medium">{{ team1Name }} 视角</p>
                            </div>
                        </div>
                        <div class="camera-feed-vertical glass overflow-hidden relative h-full" style="width: calc(50% - 8px);">
                            <img src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${team2Name}摄像头`" class="w-full h-full object-cover">
                            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                <p class="text-sm font-medium">{{ team2Name }} 视角</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel (Team 2) -->
                <div class="w-1/4 flex flex-col space-y-4 pl-2">
                    <!-- Team Roster (Team 2) -->
                    <div class="glass rounded-lg p-4 flex-shrink-0">
                        <h3 class="text-lg font-bold mb-3 text-red-400">{{ team2Name }}</h3>
                        <div class="space-y-3">
                             <!-- Player List -->
                            <div v-for="player in team2Members" :key="player.id" class="flex items-center space-x-3">
                                <img :src="player.avatar_url || 'https://via.placeholder.com/150'" :alt="`${player.nickname}头像`" class="w-8 h-8 rounded-full object-cover">
                                <div class="flex items-center justify-between flex-grow">
                                    <p class="font-medium text-sm">{{ player.nickname }}</p>
                                    <div class="flex items-center">
                                        <span :class="['text-xs mr-2', getElementColorClass(player.element)]">{{ player.element === 'fire' ? '火 (R)' : player.element === 'wood' ? '木 (G)' : '水 (B)' }}</span>
                                        <span class="text-xs">{{ player.profession }}</span>
                                        <span v-if="team2CurrentPlayer?.id === player.id" class="current-player-badge bg-red-500"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Health Display (Team 2) -->
                    <div class="glass rounded-lg p-4 flex-shrink-0">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium">队伍血量</h4>
                            <span id="team2-health-value" class="text-red-400 font-bold">{{ liveState?.team2Health ?? 'N/A' }}</span>
                        </div>
                        <HealthBar :health="liveState?.team2Health ?? 0" team-color="red" />
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-xs text-gray-300">复影折镜状态:</span>
                            <span id="team2-shield-status" :class="['text-xs', liveState?.team2HasMirror ? 'text-green-400' : 'text-gray-400']">{{ team2MirrorStatus }}</span>
                        </div>
                    </div>

                    <!-- Machine Info Cam (Team 2) - Placeholder -->
                    <div class="camera-feed-vertical glass overflow-hidden relative flex-grow">
                        <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1171&auto=format&fit=fit&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${team2Name}机台信息板`" class="w-full h-full object-cover">
                        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p class="text-xs font-medium">{{ team2Name }} - 机台信息</p>
                        </div>
                    </div>

                    <!-- Sponsor Logo (Right) - Placeholder -->
                    <div class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0">
                         <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="赞助商Logo" class="h-12 max-w-full object-contain">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Results Page (Simplified) -->
    <div v-if="!isPortrait && liveState?.status === 'completed'" id="results-view" class="results-overlay view-transition" :style="{ opacity: liveState?.status === 'completed' ? 1 : 0, display: liveState?.status === 'completed' ? 'flex' : 'none' }">
        <div class="results-content glass rounded-xl p-8">
            <!-- Header -->
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-2">比赛结束</h2>
                <p class="text-gray-300">{{ currentRoundInfo }}</p>
            </div>

            <!-- Winner Animation -->
            <div class="winner-animation flex flex-col items-center mb-8 flex-grow justify-center">
                <div class="text-blue-400 text-xl font-bold mb-2">获胜队伍</div>
                <div class="text-3xl font-bold mb-8">{{ liveState?.winnerTeamCode === liveState?.team1Code ? liveState?.team1Name : liveState?.team2Name }}</div>
                <!-- Display winner team members - requires fetching full team rosters -->
                <!-- <div class="flex space-x-8">
                     <img v-for="player in winnerTeamMembers" :key="player.id" :src="player.avatar_url || 'https://via.placeholder.com/150'" :alt="`${player.nickname}头像`" class="w-24 h-24 rounded-full object-cover">
                </div> -->
                 <p class="text-gray-400">队伍成员头像展示 (待实现)</p>
            </div>

            <!-- Team Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 flex-shrink-0">
                <!-- Team 1 Stats -->
                <div class="glass rounded-lg p-4">
                    <h3 class="text-xl font-bold mb-4 text-blue-400">{{ team1Name }}</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>最终血量</span>
                            <span class="font-bold">{{ liveState?.team1Health ?? 'N/A' }}</span>
                        </div>
                        <!-- Add other stats if available in liveState or fetched separately -->
                        <div class="flex justify-between">
                            <span>最高得分</span>
                            <span class="font-bold text-gray-400">待实现</span>
                        </div>
                         <div class="flex justify-between">
                            <span>总伤害输出</span>
                            <span class="font-bold text-gray-400">待实现</span>
                        </div>
                         <div class="flex justify-between">
                            <span>复影折镜</span>
                            <span class="font-bold">{{ liveState?.team1HasMirror ? '已使用' : '未触发' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Team 2 Stats -->
                <div class="glass rounded-lg p-4">
                    <h3 class="text-xl font-bold mb-4 text-red-400">{{ team2Name }}</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>最终血量</span>
                            <span class="font-bold">{{ liveState?.team2Health ?? 'N/A' }}</span>
                        </div>
                         <!-- Add other stats -->
                         <div class="flex justify-between">
                            <span>最高得分</span>
                            <span class="font-bold text-gray-400">待实现</span>
                        </div>
                         <div class="flex justify-between">
                            <span>总伤害输出</span>
                            <span class="font-bold text-gray-400">待实现</span>
                        </div>
                         <div class="flex justify-between">
                            <span>复影折镜</span>
                            <span class="font-bold">{{ liveState?.team2HasMirror ? '已使用' : '未触发' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Keep the CSS styles from the HTML -->
</template>

<style scoped>
/* Keep all styles from the HTML <style> block */
body {
    font-family: 'Poppins', sans-serif;
    background: linear-gradient(135deg, #0f172a, #1e293b);
    margin: 0;
    padding: 0;
    overflow: hidden; /* Prevent main page scroll */
    color: white;
    display: flex; /* Use flexbox to center the main content */
    justify-content: center;
    align-items: center;
    min-height: 100vh; /* Ensure body takes at least full viewport height */
}
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
.live-indicator {
    animation: pulse 1.5s infinite;
}
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
/* HealthBar styles are now in HealthBar.vue */
/* .health-bar { ... } */
/* .health-fill-team1 { ... } */
/* .health-fill-team2 { ... } */

.camera-feed-vertical {
    aspect-ratio: 9/16; /* Vertical 16:9 */
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
    width: 100%; /* Fill parent width */
}
.portrait-warning {
    display: none; /* Hidden by default, shown by v-if */
}

/* Use v-if instead of display: none !important */
/* @media (orientation: portrait) {
    .live-container, .results-overlay {
        display: none !important;
    }
    .portrait-warning {
        display: flex;
        position: fixed;
        inset: 0;
        align-items: center;
        justify-content: center;
        background-color: #0f172a;
        z-index: 50;
        padding: 1.5rem;
    }
} */

/* Results Page Styles */
.results-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 50;
    /* display: none; */ /* Controlled by v-if */
    /* opacity: 0; */ /* Controlled by v-if and transition */
    justify-content: center; /* Center content */
    align-items: center; /* Center content */
    padding: 20px;
}
.results-content {
    max-width: 1600px; /* Allow wider container */
    width: 90%;
    margin: auto;
    aspect-ratio: 16/9; /* Force 16:9 aspect ratio */
    overflow: hidden; /* Hide overflow content */
    display: flex;
    flex-direction: column;
    justify-content: center; /* Center content vertically within the 16:9 box */
}
.winner-animation {
    animation: scale-in 1s forwards;
}
@keyframes scale-in {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

/* Toggle Switch Styles - Not needed in Vue component unless implementing the toggle */
/* .toggle-switch { ... } */
/* .toggle-switch input { ... } */
/* .toggle-slider { ... } */
/* .toggle-slider:before { ... } */
/* input:checked + .toggle-slider { ... } */
/* input:checked + .toggle-slider:before { ... } */

/* Control Panel - Not needed in Vue component unless implementing the panel */
/* .control-panel { ... } */

.element-fire {
    color: #ef4444;
}
.element-wood {
    color: #10b981;
}
.element-water {
    color: #3b82f6;
}

/* OBS Capture Area - Attempting 16:9 ratio for main content */
.obs-capture-area {
    width: 100%;
    max-height: 100vh; /* Max height is viewport height */
    aspect-ratio: 16/9; /* Target 16:9 ratio */
    margin: auto; /* Center the content block */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Hide potential overflow if screen is not 16:9 */
}

.main-content-flex {
    flex: 1;
    display: flex;
    min-height: 0; /* Allow flex item to shrink below content size */
}

.current-player-badge {
    display: inline-block;
    width: 8px;
    height: 8px;
    /* background-color: #3b82f6; */ /* Example badge color - Use team color */
    border-radius: 50%;
    margin-left: 8px;
    flex-shrink: 0;
}
.current-player-badge.bg-blue-500 { background-color: #3b82f6; }
.current-player-badge.bg-red-500 { background-color: #ef4444; }


/* Fade transition for views */
.view-transition {
    transition: opacity 0.5s ease-in-out;
}
</style>
