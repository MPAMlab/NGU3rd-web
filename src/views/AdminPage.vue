<!-- views/AdminPage.vue (Example Structure) -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useKindeAuth } from '../composables/useKindeAuth';
import { useRouter } from 'vue-router';

const { isAuthenticated, isAdminUser, authenticatedFetch, userMember } = useKindeAuth();
const router = useRouter();

const matches = ref([]);
const selectedMatch = ref(null);
const loading = ref(true);
const error = ref(null);

// Redirect if not authenticated or not admin (frontend check, backend enforces)
onMounted(async () => {
    // The router guard should handle the initial redirect if not authenticated/admin
    // But a fallback check here is good practice
    if (!isAuthenticated.value || !isAdminUser.value) {
        // Maybe redirect to home or a forbidden page
        router.push('/'); // Or '/forbidden'
        return;
    }
    await fetchMatches();
});

async function fetchMatches() {
    loading.value = true;
    error.value = null;
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches`);
        if (!response.ok) {
            throw new Error(`Failed to fetch matches: ${response.statusText}`);
        }
        const data = await response.json();
        matches.value = data.matches || [];
        console.log("Fetched matches:", matches.value);
    } catch (e) {
        console.error("Error fetching matches:", e);
        error.value = e.message || 'Failed to load matches.';
    } finally {
        loading.value = false;
    }
}

async function selectMatch(matchId) {
    loading.value = true;
    error.value = null;
    selectedMatch.value = null; // Clear previous selection
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch match ${matchId} details: ${response.statusText}`);
        }
        const data = await response.json();
        selectedMatch.value = data.match;
        console.log("Fetched match details:", selectedMatch.value);
    } catch (e) {
        console.error(`Error fetching match ${matchId} details:`, e);
        error.value = e.message || 'Failed to load match details.';
    } finally {
        loading.value = false;
    }
}

async function startMatch(matchId) {
    if (!confirm(`确定要开始比赛 ${matchId} 吗？`)) return;
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}/start`, {
            method: 'POST',
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed to start match: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Match started:", result);
        // Refresh match list or selected match details
        await fetchMatches();
        if (selectedMatch.value && selectedMatch.value.id === matchId) {
             await selectMatch(matchId);
        }
        alert("比赛已开始！");
    } catch (e) {
        console.error("Error starting match:", e);
        alert(`启动比赛失败: ${e.message}`);
    }
}

async function recordTurn(matchId, turnData) {
    // turnData should include team1MemberId, team2MemberId, scorePercent1, scorePercent2, difficultyLevelPlayed, songName, songId (optional)
    if (!confirm(`确定要记录本轮成绩吗？`)) return;
     loading.value = true; // Show loading while recording
    try {
        const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}/record-turn`, {
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

        // Check if match ended based on the response
        if (result.matchStatus === 'completed') {
             alert(`比赛结束！胜者是 ${result.winnerTeamCode || '未知队伍'}！`);
             // Maybe automatically end the match formally if not already
             if (selectedMatch.value && selectedMatch.value.id === matchId && selectedMatch.value.status !== 'completed') {
                  await endMatch(matchId); // Call endMatch to update status formally
             } else {
                  // Just refresh the view if already completed or not the selected match
                  await fetchMatches();
                  if (selectedMatch.value && selectedMatch.value.id === matchId) {
                       await selectMatch(matchId);
                  }
             }
        } else {
             alert("轮次成绩已记录。");
             // Refresh selected match details to show updated health, turns, etc.
             if (selectedMatch.value && selectedMatch.value.id === matchId) {
                  await selectMatch(matchId);
             }
        }


    } catch (e) {
        console.error("Error recording turn:", e);
        alert(`记录成绩失败: ${e.message}`);
    } finally {
         loading.value = false;
    }
}

async function endMatch(matchId) {
     if (!confirm(`确定要手动结束比赛 ${matchId} 吗？`)) return;
     loading.value = true;
     try {
         const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}/end`, {
             method: 'POST',
         });
         if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || `Failed to end match: ${response.statusText}`);
         }
         const result = await response.json();
         console.log("Match ended:", result);
         alert(`比赛已结束！胜者是 ${result.winnerTeamCode || '未知队伍'}。`);
         // Refresh match list and selected match
         await fetchMatches();
         if (selectedMatch.value && selectedMatch.value.id === matchId) {
              await selectMatch(matchId);
         }
     } catch (e) {
         console.error("Error ending match:", e);
         alert(`结束比赛失败: ${e.message}`);
     } finally {
         loading.value = false;
     }
}

async function getRandomSongForMatch(matchId) {
     loading.value = true;
     error.value = null;
     try {
         const response = await authenticatedFetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/matches/${matchId}/random-song`);
         if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || `Failed to get random song: ${response.statusText}`);
         }
         const data = await response.json();
         console.log("Random song:", data.song);
         alert(`随机歌曲：${data.song.name} (${data.song.difficulties?.MST || data.song.difficulties?.EXP || '未知难度'})`);
         // You would typically populate a form field with this song data
         return data.song; // Return the song object
     } catch (e) {
         console.error("Error getting random song:", e);
         error.value = e.message || 'Failed to get random song.';
         alert(`获取随机歌曲失败: ${e.message}`);
         return null;
     } finally {
         loading.value = false;
     }
}

// TODO: Add functions for creating match, setting final songs, etc.
// TODO: Implement UI forms for recording turn data, creating matches, etc.
// TODO: Display match list, selected match details, turns, team health, etc.

</script>

<template>
    <div class="admin-page">
        <h1>管理员面板</h1>

        <div v-if="loading">加载中...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else>
            <h2>比赛列表</h2>
            <ul>
                <li v-for="match in matches" :key="match.id">
                    比赛 {{ match.id }}: {{ match.stage }} {{ match.round_number }}轮 - {{ match.team1_name }} vs {{ match.team2_name }} (状态: {{ match.status }})
                    <button @click="selectMatch(match.id)">查看详情</button>
                    <button v-if="match.status === 'scheduled'" @click="startMatch(match.id)">开始比赛</button>
                    <button v-if="match.status === 'active'" @click="endMatch(match.id)">结束比赛</button>
                </li>
            </ul>

            <div v-if="selectedMatch">
                <h2>比赛详情 - {{ selectedMatch.id }}</h2>
                <p>阶段: {{ selectedMatch.stage }} {{ selectedMatch.round_number }}轮</p>
                <p>队伍: {{ selectedMatch.team1.name }} ({{ selectedMatch.team1.code }}) vs {{ selectedMatch.team2.name }} ({{ selectedMatch.team2.code }})</p>
                <p>状态: {{ selectedMatch.status }}</p>
                <p>当前轮次: {{ selectedMatch.current_song_index + 1 }}</p>
                <p>血量: {{ selectedMatch.team1.name }}: {{ selectedMatch.team1.current_health }} | {{ selectedMatch.team2.name }}: {{ selectedMatch.team2.current_health }}</p>
                <p>复活镜: {{ selectedMatch.team1.name }}: {{ selectedMatch.team1.has_revive_mirror ? '有' : '无' }} | {{ selectedMatch.team2.name }}: {{ selectedMatch.team2.has_revive_mirror ? '有' : '无' }}</p>
                <p v-if="selectedMatch.status === 'completed'">胜者: {{ selectedMatch.winner_team_code }}</p>

                <h3>队伍成员</h3>
                <p>{{ selectedMatch.team1.name }}: {{ selectedMatch.team1.members.map(m => `${m.nickname} (${m.profession})`).join(', ') }}</p>
                <p>{{ selectedMatch.team2.name }}: {{ selectedMatch.team2.members.map(m => `${m.nickname} (${m.profession})`).join(', ') }}</p>

                <h3>已完成轮次 ({{ selectedMatch.turns.length }})</h3>
                <ul>
                    <li v-for="turn in selectedMatch.turns" :key="turn.id">
                        轮次 {{ turn.song_index + 1 }}: {{ turn.song_name_override }} ({{ turn.difficulty_level_played }})
                        - {{ selectedMatch.team1.members.find(m => m.id === turn.playing_member_id_team1)?.nickname }} ({{ turn.score_percent_team1 }}) vs {{ selectedMatch.team2.members.find(m => m.id === turn.playing_member_id_team2)?.nickname }} ({{ turn.score_percent_team2 }})
                        - 血量变化: T1: {{ turn.health_change_team1 }}, T2: {{ turn.health_change_team2 }}
                        - 最终血量: T1: {{ turn.team1_health_after }}, T2: {{ turn.team2_health_after }}
                        - 折镜使用: T1: {{ turn.team1_revive_used_this_turn ? '是' : '否' }}, T2: {{ turn.team2_revive_used_this_turn ? '是' : '否' }}
                        <!-- Optional: Button to view calculation log -->
                    </li>
                </ul>

                <div v-if="selectedMatch.status === 'active'">
                    <h3>记录下一轮成绩 (轮次 {{ selectedMatch.current_song_index + 1 }})</h3>
                    <!-- TODO: Add a form here -->
                    <form @submit.prevent="recordTurn(selectedMatch.id, { /* form data */ })">
                        <!-- Select players for this turn -->
                        <label>Team 1 Player:</label>
                        <select v-model="turnFormData.team1MemberId">
                            <option v-for="member in selectedMatch.team1.members" :key="member.id" :value="member.id">{{ member.nickname }} ({{ member.profession }})</option>
                        </select><br>
                         <label>Team 2 Player:</label>
                        <select v-model="turnFormData.team2MemberId">
                            <option v-for="member in selectedMatch.team2.members" :key="member.id" :value="member.id">{{ member.nickname }} ({{ member.profession }})</option>
                        </select><br>

                        <!-- Song Info -->
                        <label>Song Name:</label>
                        <input type="text" v-model="turnFormData.songName" required>
                        <button type="button" @click="getRandomSongForMatch(selectedMatch.id).then(song => { if(song) { turnFormData.songName = song.name; /* maybe difficulty too */ } })">随机歌曲</button><br>
                        <label>Difficulty:</label>
                        <input type="text" v-model="turnFormData.difficultyLevelPlayed" required><br>
                         <!-- Optional: Song ID if from library -->
                         <!-- <label>Song ID (Optional):</label> <input type="number" v-model="turnFormData.songId"><br> -->


                        <!-- Scores -->
                        <label>{{ selectedMatch.team1.name }} Score (%):</label>
                        <input type="text" v-model="turnFormData.scorePercent1" required pattern="\d+\.\d{4}"><br>
                        <label>{{ selectedMatch.team2.name }} Score (%):</label>
                        <input type="text" v-model="turnFormData.scorePercent2" required pattern="\d+\.\d{4}"><br>

                        <button type="submit">记录成绩</button>
                    </form>
                </div>

                 <div v-if="selectedMatch.stage === 'final' && selectedMatch.turns.length < 3">
                     <h3>设置决赛歌曲 (需要设置3首)</h3>
                     <!-- TODO: Add form to set 3 songs -->
                     <p>当前已设置 {{ selectedMatch.turns.length }} 首。</p>
                     <!-- Form with 3 song inputs -->
                     <!-- Button to call handleAdminSetFinalSongs -->
                 </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add some basic styling */
.admin-page {
    padding: 20px;
}
ul {
    list-style: none;
    padding: 0;
}
li {
    margin-bottom: 10px;
    border: 1px solid #ccc;
    padding: 10px;
}
button {
    margin-left: 10px;
    padding: 5px 10px;
    cursor: pointer;
}
form {
    margin-top: 20px;
    border: 1px solid #eee;
    padding: 15px;
}
label {
    display: inline-block;
    width: 150px;
    margin-bottom: 5px;
}
input, select {
    margin-bottom: 5px;
    padding: 5px;
}
.error {
    color: red;
    margin-bottom: 15px;
}
</style>
