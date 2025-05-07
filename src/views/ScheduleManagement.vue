<template>
    <div class="admin-page">
        <h1>赛程管理</h1>

        <div v-if="store.isLoadingTournamentMatches || store.isLoadingTeams" class="loading">加载赛程和队伍列表中...</div>
        <div v-if="store.error" class="error-message">错误: {{ store.error }}</div>
        <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>
         <div v-if="store.bulkImportError" class="error-message">批量导入错误: {{ store.bulkImportError }}</div>
        <div v-if="store.bulkImportMessage" class="submit-message success">{{ store.bulkImportMessage }}</div>


        <!-- Add New Tournament Match Form -->
        <div class="section-card">
            <h2>添加新赛程比赛</h2>
            <form @submit.prevent="handleAddTournamentMatch">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="newMatchRound">轮次名称:</label>
                        <input type="text" id="newMatchRound" v-model="newMatch.tournament_round" required />
                    </div>
                    <div class="form-group">
                        <label for="newMatchNumber">比赛编号:</label>
                        <input type="number" id="newMatchNumber" v-model.number="newMatch.match_number_in_round" min="1" required />
                    </div>
                    <div class="form-group">
                        <label for="newTeam1">队伍A:</label>
                        <select id="newTeam1" v-model.number="newMatch.team1_id" required>
                            <option :value="null" disabled>请选择队伍</option>
                            <option v-for="team in store.teams" :key="team.id" :value="team.id">{{ team.name }} ({{ team.code }})</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label for="newTeam2">队伍B:</label>
                        <select id="newTeam2" v-model.number="newMatch.team2_id" required>
                            <option :value="null" disabled>请选择队伍</option>
                            <option v-for="team in store.teams" :key="team.id" :value="team.id">{{ team.name }} ({{ team.code }})</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label for="newTeam1Order">队伍A出场顺序 (1,2,3):</label>
                        <input type="text" id="newTeam1Order" v-model="newMatch.team1_player_order" placeholder="例如: 1,2,3" />
                    </div>
                     <div class="form-group">
                        <label for="newTeam2Order">队伍B出场顺序 (1,2,3):</label>
                        <input type="text" id="newTeam2Order" v-model="newMatch.team2_player_order" placeholder="例如: 1,2,3" />
                    </div>
                     <div class="form-group">
                        <label for="newScheduledTime">预定时间 (可选):</label>
                        <input type="text" id="newScheduledTime" v-model="newMatch.scheduled_time" placeholder="例如: 2023-10-27T10:00:00Z" />
                    </div>
                </div>
                 <div class="button-group">
                    <button type="submit" :disabled="store.isLoadingAction">
                        {{ store.isLoadingAction && !store.actionMessage ? '添加中...' : '添加赛程' }}
                    </button>
                 </div>
            </form>
        </div>

         <!-- Bulk Import Schedule -->
         <div class="section-card">
             <h2>批量导入赛程</h2>
             <p>请上传 CSV 文件，包含 `tournament_round`, `match_number_in_round`, `team1_id`, `team2_id`, `team1_player_order`, `team2_player_order`, `scheduled_time` 等列。</p>
             <p>注意: `team1_id` 和 `team2_id` 必须是队伍的数据库 ID。</p>
             <input type="file" id="bulkScheduleFileInput" @change="handleScheduleFileChange" accept=".csv" />
             <div class="button-group">
                 <button @click="handleBulkImportSchedule" :disabled="!scheduleFile || store.isLoadingBulkImport">
                     {{ store.isLoadingBulkImport ? '导入中...' : '开始批量导入赛程' }}
                 </button>
             </div>
         </div>


        <!-- Tournament Matches List -->
        <div class="section-card">
            <h2>赛程列表 ({{ store.tournamentMatches.length }})</h2>
            <div v-if="store.tournamentMatches.length === 0 && !store.isLoadingTournamentMatches" class="status-message">暂无赛程。</div>
            <table v-else class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>轮次</th>
                        <th>编号</th>
                        <th>队伍A</th>
                        <th>队伍B</th>
                        <th>出场顺序A</th>
                        <th>出场顺序B</th>
                        <th>状态</th>
                        <th>赢家</th>
                        <th>DO ID</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="match in store.tournamentMatches" :key="match.id">
                        <td>{{ match.id }}</td>
                        <td>{{ match.tournament_round }}</td>
                        <td>{{ match.match_number_in_round }}</td>
                        <td>{{ match.team1_name }} ({{ match.team1_code }})</td>
                        <td>{{ match.team2_name }} ({{ match.team2_code }})</td>
                        <td>{{ match.team1_player_order || '-' }}</td>
                        <td>{{ match.team2_player_order || '-' }}</td>
                        <td>{{ getMatchStatusText(match.status) }}</td>
                        <td>{{ match.winner_team_name || '-' }}</td>
                        <td>{{ match.match_do_id || '-' }}</td>
                        <td>
                            <!-- <button @click="startEditingTournamentMatch(match)" class="small-button">编辑</button> -->
                            <button @click="handleDeleteTournamentMatch(match.id)" class="small-button delete-button" :disabled="match.match_do_id !== null">删除</button>
                            <button @click="handleStartScheduledMatch(match.id)" class="small-button" :disabled="match.status !== 'scheduled' || (store.currentMatch !== null && !store.isCurrentMatchArchived)">开始比赛</button>
                        </td>
                    </tr>
                </tbody>
            </table>
             <button @click="store.fetchTournamentMatches()" :disabled="store.isLoadingTournamentMatches">刷新赛程列表</button>
        </div>

        <!-- Edit Tournament Match Modal (Optional - implement if needed) -->
        <!-- <div v-if="editingMatch" class="modal-overlay">...</div> -->

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useMatchStore } from '@/stores/matchStore';
import type { TournamentMatch, BulkTeamRow } from '@/types/match'; // Import BulkTeamRow for CSV parsing example
import { parse } from 'csv-parse/browser/esm/sync'; // Import CSV parser

const store = useMatchStore();

// --- State for Add Tournament Match Form ---
const newMatch = reactive<Omit<TournamentMatch, 'id' | 'match_do_id' | 'status' | 'winner_team_id' | 'created_at' | 'team1_code' | 'team1_name' | 'team2_code' | 'team2_name' | 'winner_team_code' | 'winner_team_name'>>({
    tournament_round: '',
    match_number_in_round: 1,
    team1_id: null as any, // Use null as initial value for select
    team2_id: null as any, // Use null as initial value for select
    team1_player_order: '1,2,3',
    team2_player_order: '1,2,3',
    scheduled_time: null,
});

// --- State for Edit Tournament Match Modal (Optional) ---
// const editingMatch = ref<TournamentMatch | null>(null);

// --- State for Bulk Import ---
const scheduleFile = ref<File | null>(null);


// --- Lifecycle ---
onMounted(() => {
    store.fetchTournamentMatches();
    store.fetchTeams(); // Need teams for the dropdowns
    store.fetchCurrentMatchState(); // Need current match state to disable 'Start Match' button
});

// --- Tournament Match Actions ---
async function handleAddTournamentMatch() {
    // Clear previous messages
    store.error = null;
    store.actionMessage = null;

    // Corrected validation order
    if (!newMatch.tournament_round || newMatch.match_number_in_round === undefined || newMatch.team1_id === null || newMatch.team2_id === null) {
        store.error = "请填写所有必填项 (轮次名称, 比赛编号, 队伍A, 队伍B)。";
        return;
    }
     if (newMatch.team1_id === newMatch.team2_id) {
         store.error = "队伍A和队伍B不能是同一支队伍。";
         return;
     }

    const success = await store.createTournamentMatch({
        tournament_round: newMatch.tournament_round,
        match_number_in_round: newMatch.match_number_in_round,
        team1_id: newMatch.team1_id,
        team2_id: newMatch.team2_id,
        team1_player_order: newMatch.team1_player_order || '1,2,3', // Default if empty
        team2_player_order: newMatch.team2_player_order || '1,2,3', // Default if empty
        scheduled_time: newMatch.scheduled_time || null,
    });

    if (success) {
        // Reset form
        Object.assign(newMatch, {
            tournament_round: '',
            match_number_in_round: 1,
            team1_id: null,
            team2_id: null,
            team1_player_order: '1,2,3',
            team2_player_order: '1,2,3',
            scheduled_time: null,
        });
    }
}

// Implement startEditingTournamentMatch, handleSaveEditedTournamentMatch, cancelEditingTournamentMatch if needed

async function handleDeleteTournamentMatch(matchId: number) {
    await store.deleteTournamentMatch(matchId);
}

async function handleStartScheduledMatch(matchId: number) {
    await store.startScheduledMatch(matchId);
}

function getMatchStatusText(status: TournamentMatch['status']) {
    switch (status) {
        case 'scheduled': return '已安排';
        case 'live': return '进行中';
        case 'completed': return '已完成';
        case 'archived': return '已归档 (旧)'; // Handle old status if necessary
        default: return '未知';
    }
}

// --- Bulk Import Actions ---

function handleScheduleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        scheduleFile.value = target.files[0];
        store.bulkImportError = null; // Clear previous errors
        store.bulkImportMessage = null; // Clear previous messages
    } else {
        scheduleFile.value = null;
    }
}

async function handleBulkImportSchedule() {
    if (!scheduleFile.value) {
        store.bulkImportError = "请选择一个 CSV 文件。";
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const csvString = e.target?.result as string;
            // Parse CSV string into an array of objects
            const records = parse(csvString, {
                columns: true, // Use the first row as headers
                skip_empty_lines: true,
                trim: true,
            }) as Omit<TournamentMatch, 'id' | 'match_do_id' | 'status' | 'winner_team_id' | 'created_at' | 'team1_code' | 'team1_name' | 'team2_code' | 'team2_name' | 'winner_team_code' | 'winner_team_name'>[]; // Assert type

            console.log("Parsed Schedule CSV:", records);

            // Basic validation and type conversion before sending to API
            const processedRecords = records.map(r => ({
                 ...r,
                 match_number_in_round: Number(r.match_number_in_round), // Ensure number type
                 team1_id: Number(r.team1_id), // Ensure number type
                 team2_id: Number(r.team2_id), // Ensure number type
                 // Ensure player order is string or null
                 team1_player_order: r.team1_player_order === '' ? null : r.team1_player_order,
                 team2_player_order: r.team2_player_order === '' ? null : r.team2_player_order,
                 // Ensure scheduled_time is string or null
                 scheduled_time: r.scheduled_time === '' ? null : r.scheduled_time,
            }));

             // Perform validation checks that the backend also does
             const validationErrors: string[] = [];
             const roundMatchNumbers = new Set<string>();
             const teamIds = new Set<number>();

             processedRecords.forEach((match, index) => {
                 if (!match.tournament_round || isNaN(match.match_number_in_round) || match.match_number_in_round < 1 || isNaN(match.team1_id) || match.team1_id === null || isNaN(match.team2_id) || match.team2_id === null) {
                      validationErrors.push(`Row ${index + 2}: Missing or invalid required fields (round, number, team1_id, team2_id).`);
                 } else {
                     if (match.team1_id === match.team2_id) {
                         validationErrors.push(`Row ${index + 2}: Teams A and B cannot be the same.`);
                     }
                     const key = `${match.tournament_round}-${match.match_number_in_round}`;
                     if (roundMatchNumbers.has(key)) {
                         validationErrors.push(`Row ${index + 2}: Duplicate match (Round '${match.tournament_round}', Number ${match.match_number_in_round}) found in input.`);
                     }
                     roundMatchNumbers.add(key);
                     teamIds.add(match.team1_id);
                     teamIds.add(match.team2_id);
                 }
             });

             if (validationErrors.length > 0) {
                 store.bulkImportError = `CSV 文件验证失败: ${validationErrors.join('; ')}`;
                 return;
             }


            // Call the store action for bulk creation
            const success = await store.bulkCreateTournamentMatches(processedRecords);

            // Refresh the list regardless of full success to show partial imports
            store.fetchTournamentMatches();


        } catch (error: any) {
            console.error("Error reading or parsing CSV:", error);
            store.bulkImportError = `处理 CSV 文件失败: ${error.message}`;
        } finally {
             scheduleFile.value = null; // Clear the file input
             const fileInput = document.querySelector('#bulkScheduleFileInput') as HTMLInputElement;
             if (fileInput) fileInput.value = ''; // Reset file input element
        }
    };
    reader.onerror = (e) => {
        console.error("FileReader error:", e);
        store.bulkImportError = "读取文件失败。";
         scheduleFile.value = null; // Clear the file input
         const fileInput = document.querySelector('#bulkScheduleFileInput') as HTMLInputElement;
         if (fileInput) fileInput.value = ''; // Reset file input element
    };
    reader.readAsText(scheduleFile.value); // Read as text for CSV
}


</script>

<style scoped>
/* Reuse styles from TeamsManagement.vue */
.admin-page {
  max-width: 1200px; /* Wider for schedule */
  margin: 20px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1, h2, h3, h4 {
  color: #333;
  margin-bottom: 15px;
}

h1 { text-align: center; margin-bottom: 25px; }
h2 { margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
h3 { margin-top: 20px; margin-bottom: 15px; }
h4 { margin-top: 15px; margin-bottom: 10px; color: #555; }


.section-card {
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 25px;
}

.section-card.compact-card {
    padding: 15px;
    margin-bottom: 15px;
}


.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}
.form-grid.compact-grid {
    gap: 15px;
}


.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.button-group {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
    flex-wrap: wrap;
}

.button-group button {
    padding: 10px 15px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
}

/* Specific button styles */
.button-group button[type="submit"] { background-color: #007bff; }
.button-group button[type="submit"]:hover:not(:disabled) { background-color: #0056b3; }
.button-group button:not([type="submit"]):not(.delete-button) { background-color: #6c757d; } /* Default grey */
.button-group button:not([type="submit"]):not(.delete-button):hover:not(:disabled) { background-color: #5a6268; }
.button-group .delete-button { background-color: #dc3545; }
.button-group .delete-button:hover:not(:disabled) { background-color: #c82333; }


button:disabled {
  background-color: #ccc !important;
  cursor: not-allowed;
  opacity: 0.7;
}

.loading, .error-message, .submit-message, .status-message {
  text-align: center;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.loading { color: #007bff; }
.error-message { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.submit-message.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.status-message { background-color: #e9ecef; color: #495057; border: 1px solid #dee2e6; }


/* Data Table Styles */
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    font-size: 0.9em; /* Smaller font for more columns */
}

.data-table th, .data-table td {
    border: 1px solid #ddd;
    padding: 8px; /* Reduced padding */
    text-align: left;
}

.data-table th {
    background-color: #f2f2f2;
    font-weight: bold;
}

.data-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}

.data-table td button {
    margin-right: 5px;
    padding: 5px 8px; /* Adjusted padding */
    font-size: 0.8em; /* Adjusted font size */
}
.data-table td button:last-child {
    margin-right: 0;
}

.small-button {
    padding: 5px 8px;
    font-size: 0.8em;
    border-radius: 3px;
}
.small-button.delete-button {
     background-color: #dc3545;
     color: white;
}
.small-button.delete-button:hover:not(:disabled) {
     background-color: #c82333;
}


/* Style for file input */
input[type="file"] {
    display: block;
    margin: 10px auto;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
}

</style>
