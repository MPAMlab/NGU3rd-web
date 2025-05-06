<template>
    <div class="admin-page">
        <h1>队伍管理</h1>

        <div v-if="store.isLoadingTeams" class="loading">加载队伍列表中...</div>
        <div v-if="store.error" class="error-message">错误: {{ store.error }}</div>
        <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>
        <div v-if="store.bulkImportError" class="error-message">批量导入错误: {{ store.bulkImportError }}</div>
        <div v-if="store.bulkImportMessage" class="submit-message success">{{ store.bulkImportMessage }}</div>


        <!-- Add New Team Form -->
        <div class="section-card">
            <h2>添加新队伍</h2>
            <form @submit.prevent="handleAddTeam">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="newTeamCode">队伍代码 (4位):</label>
                        <input type="text" id="newTeamCode" v-model="newTeam.code" maxlength="4" required />
                    </div>
                    <div class="form-group">
                        <label for="newTeamName">队伍名称:</label>
                        <input type="text" id="newTeamName" v-model="newTeam.name" required />
                    </div>
                </div>
                 <div class="button-group">
                    <button type="submit" :disabled="store.isLoadingAction">
                        {{ store.isLoadingAction && !store.actionMessage ? '添加中...' : '添加队伍' }}
                    </button>
                 </div>
            </form>
        </div>

        <!-- Bulk Import Teams -->
         <div class="section-card">
             <h2>批量导入队伍</h2>
             <p>请上传 CSV 文件，包含 `code` 和 `name` 两列。</p>
             <input type="file" id="bulkTeamFileInput" @change="handleTeamFileChange" accept=".csv" />
             <div class="button-group">
                 <button @click="handleBulkImportTeams" :disabled="!teamFile || store.isLoadingBulkImport">
                     {{ store.isLoadingBulkImport ? '导入中...' : '开始批量导入队伍' }}
                 </button>
             </div>
         </div>


        <!-- Teams List -->
        <div class="section-card">
            <h2>队伍列表 ({{ store.teams.length }})</h2>
            <div v-if="store.teams.length === 0 && !store.isLoadingTeams" class="status-message">暂无队伍。</div>
            <table v-else class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>代码</th>
                        <th>名称</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="team in store.teams" :key="team.id">
                        <td>{{ team.id }}</td>
                        <td>{{ team.code }}</td>
                        <td>{{ team.name }}</td>
                        <td>{{ team.status }}</td>
                        <td>
                            <button @click="startEditingTeam(team)" class="small-button">编辑</button>
                            <button @click="handleDeleteTeam(team.id)" class="small-button delete-button">删除</button>
                            <button @click="showMembersModal(team)" class="small-button">管理队员</button>
                        </td>
                    </tr>
                </tbody>
            </table>
             <button @click="store.fetchTeams()" :disabled="store.isLoadingTeams">刷新队伍列表</button>
        </div>

        <!-- Edit Team Modal -->
        <div v-if="editingTeam" class="modal-overlay">
            <div class="modal-content">
                <h3>编辑队伍: {{ editingTeam.name }} ({{ editingTeam.code }})</h3>
                 <div v-if="store.error" class="error-message">{{ store.error }}</div>
                 <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>

                <form @submit.prevent="handleSaveEditedTeam">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>队伍名称:</label>
                            <input type="text" v-model="editingTeam.name" required />
                        </div>
                         <div class="form-group">
                            <label>当前生命值:</label>
                            <input type="number" v-model.number="editingTeam.current_health" min="0" />
                        </div>
                         <div class="form-group">
                            <label>复活镜:</label>
                             <select v-model.number="editingTeam.has_revive_mirror">
                                 <option :value="1">有</option>
                                 <option :value="0">无</option>
                             </select>
                        </div>
                         <div class="form-group">
                            <label>状态:</label>
                             <select v-model="editingTeam.status">
                                 <option value="active">活跃</option>
                                 <option value="inactive">非活跃</option>
                             </select>
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="submit" :disabled="store.isLoadingAction">
                            {{ store.isLoadingAction && !store.actionMessage ? '保存中...' : '保存修改' }}
                        </button>
                        <button type="button" @click="cancelEditingTeam" :disabled="store.isLoadingAction">
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Manage Members Modal -->
        <div v-if="showingMembersForTeam" class="modal-overlay">
            <div class="modal-content large-modal">
                <h3>管理队员: {{ showingMembersForTeam.name }} ({{ showingMembersForTeam.code }})</h3>
                 <div v-if="store.error" class="error-message">{{ store.error }}</div>
                 <div v-if="store.actionMessage" class="submit-message success">{{ store.actionMessage }}</div>
                 <div v-if="store.bulkImportError" class="error-message">批量导入错误: {{ store.bulkImportError }}</div>
                 <div v-if="store.bulkImportMessage" class="submit-message success">{{ store.bulkImportMessage }}</div>


                <!-- Add New Member Form -->
                <div class="section-card compact-card">
                    <h4>添加新队员</h4>
                    <form @submit.prevent="handleAddMember">
                        <div class="form-grid compact-grid">
                            <div class="form-group">
                                <label for="newMemberNickname">昵称:</label>
                                <input type="text" id="newMemberNickname" v-model="newMember.nickname" required />
                            </div>
                             <div class="form-group">
                                <label for="newMemberColor">颜色:</label>
                                <input type="text" id="newMemberColor" v-model="newMember.color" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberJob">职业:</label>
                                <input type="text" id="newMemberJob" v-model="newMember.job" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberMaimaiId">舞萌ID:</label>
                                <input type="text" id="newMemberMaimaiId" v-model="newMember.maimai_id" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberQQ">QQ:</label>
                                <input type="text" id="newMemberQQ" v-model="newMember.qq_number" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberAvatar">头像URL:</label>
                                <input type="text" id="newMemberAvatar" v-model="newMember.avatar_url" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberKindeId">Kinde ID:</label>
                                <input type="text" id="newMemberKindeId" v-model="newMember.kinde_user_id" />
                            </div>
                             <div class="form-group">
                                <label for="newMemberIsAdmin">管理员:</label>
                                 <select id="newMemberIsAdmin" v-model.number="newMember.is_admin">
                                     <option :value="0">否</option>
                                     <option :value="1">是</option>
                                 </select>
                            </div>
                        </div>
                         <div class="button-group">
                            <button type="submit" :disabled="store.isLoadingAction">
                                {{ store.isLoadingAction && !store.actionMessage ? '添加中...' : '添加队员' }}
                            </button>
                         </div>
                    </form>
                </div>

                 <!-- Bulk Import Members -->
                 <div class="section-card compact-card">
                     <h4>批量导入队员到 {{ showingMembersForTeam.name }}</h4>
                     <p>请上传 CSV 文件，包含 `team_code`, `nickname`, `color`, `job`, `maimai_id`, `qq_number`, `avatar_url`, `kinde_user_id`, `is_admin` 等列。</p>
                     <p>注意: `team_code` 列必须填写当前队伍的代码 (<strong>{{ showingMembersForTeam.code }}</strong>)。</p>
                     <input type="file" id="bulkMemberFileInput" @change="handleMemberFileChange" accept=".csv" />
                     <div class="button-group">
                         <button @click="handleBulkImportMembers" :disabled="!memberFile || store.isLoadingBulkImport">
                             {{ store.isLoadingBulkImport ? '导入中...' : '开始批量导入队员' }}
                         </button>
                     </div>
                 </div>


                <!-- Members List for this Team -->
                <div class="section-card compact-card">
                    <h4>队员列表 ({{ teamMembers.length }})</h4>
                     <div v-if="isLoadingTeamMembers" class="loading">加载队员列表中...</div>
                    <div v-else-if="teamMembers.length === 0 && !isLoadingTeamMembers" class="status-message">暂无队员。</div>
                    <table v-else class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>昵称</th>
                                <th>颜色</th>
                                <th>职业</th>
                                <th>舞萌ID</th>
                                <th>QQ</th>
                                <th>管理员</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="member in teamMembers" :key="member.id">
                                <td>{{ member.id }}</td>
                                <td>{{ member.nickname }}</td>
                                <td>{{ member.color }}</td>
                                <td>{{ member.job }}</td>
                                <td>{{ member.maimai_id }}</td>
                                <td>{{ member.qq_number }}</td>
                                <td>{{ member.is_admin ? '是' : '否' }}</td>
                                <td>
                                    <!-- <button @click="startEditingMember(member)" class="small-button">编辑</button> -->
                                    <button @click="handleDeleteMember(member.id)" class="small-button delete-button">删除</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                     <button @click="refreshTeamMembers()" :disabled="isLoadingTeamMembers">刷新队员列表</button>
                </div>


                <div class="button-group">
                    <button type="button" @click="hideMembersModal">关闭</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useMatchStore } from '@/stores/matchStore';
import type { Team, Member, BulkTeamRow, BulkMemberRow } from '@/types/match';
import { parse } from 'csv-parse/browser/esm/sync'; // Import CSV parser

const store = useMatchStore();

// --- State for Add Team Form ---
const newTeam = reactive<Omit<Team, 'id' | 'created_at' | 'current_health' | 'has_revive_mirror' | 'status'>>({
    code: '',
    name: '',
});

// --- State for Edit Team Modal ---
const editingTeam = ref<Team | null>(null);

// --- State for Manage Members Modal ---
const showingMembersForTeam = ref<Team | null>(null);
const teamMembers = ref<Member[]>([]);
const isLoadingTeamMembers = ref(false);
const newMember = reactive<Omit<Member, 'id' | 'joined_at' | 'updated_at'>>({
    team_code: '', // Will be set when modal opens
    nickname: '',
    color: null,
    job: null,
    maimai_id: null,
    qq_number: null,
    avatar_url: null,
    kinde_user_id: null,
    is_admin: 0,
});

// --- State for Bulk Import ---
const teamFile = ref<File | null>(null);
const memberFile = ref<File | null>(null);


// --- Lifecycle ---
onMounted(() => {
    store.fetchTeams();
    // No need to fetch all members globally if only managing per team
    // store.fetchMembers();
});

// --- Team Actions ---
async function handleAddTeam() {
    if (!newTeam.code || newTeam.code.length !== 4 || !newTeam.name) {
        store.error = "队伍代码必须是4位，且队伍名称不能为空。";
        return;
    }
    const success = await store.createTeam({ code: newTeam.code, name: newTeam.name });
    if (success) {
        newTeam.code = '';
        newTeam.name = '';
    }
}

function startEditingTeam(team: Team) {
    editingTeam.value = { ...team }; // Create a copy
    store.error = null; // Clear messages
    store.actionMessage = null;
}

function cancelEditingTeam() {
    editingTeam.value = null;
    store.error = null;
    store.actionMessage = null;
}

async function handleSaveEditedTeam() {
    if (editingTeam.value && editingTeam.value.id !== undefined) {
        const success = await store.updateTeam(editingTeam.value.id, {
            name: editingTeam.value.name,
            current_health: editingTeam.value.current_health,
            has_revive_mirror: editingTeam.value.has_revive_mirror,
            status: editingTeam.value.status,
            // code is omitted in the type, cannot be updated here
        });
        if (success) {
            cancelEditingTeam(); // Close modal on success
        }
    } else {
        store.error = "无效的队伍数据，无法保存。";
    }
}

async function handleDeleteTeam(teamId: number) {
    await store.deleteTeam(teamId);
}

// --- Member Management Modal Actions ---
async function showMembersModal(team: Team) {
    showingMembersForTeam.value = team;
    newMember.team_code = team.code; // Set team_code for new member form
    await refreshTeamMembers(); // Load members for this team
    store.error = null; // Clear messages
    store.actionMessage = null;
    store.bulkImportError = null; // Clear bulk import messages
    store.bulkImportMessage = null;
    memberFile.value = null; // Clear selected file
     // Reset file input element manually if needed
     const fileInput = document.querySelector('#bulkMemberFileInput') as HTMLInputElement;
     if (fileInput) fileInput.value = '';
}

function hideMembersModal() {
    showingMembersForTeam.value = null;
    teamMembers.value = []; // Clear members list when closing
    // Reset new member form
    Object.assign(newMember, {
        team_code: '', nickname: '', color: null, job: null, maimai_id: null,
        qq_number: null, avatar_url: null, kinde_user_id: null, is_admin: 0,
    });
}

async function refreshTeamMembers() {
    if (showingMembersForTeam.value) {
        isLoadingTeamMembers.value = true;
        // Use the store action to fetch members for the specific team code
        teamMembers.value = await store.fetchMembersByTeamCode(showingMembersForTeam.value.code);
        isLoadingTeamMembers.value = false;
    } else {
        teamMembers.value = []; // Clear if no team is selected
    }
}

async function handleAddMember() {
    if (!newMember.nickname) {
        store.error = "队员昵称不能为空。";
        return;
    }
     if (!showingMembersForTeam.value?.code) {
         store.error = "无法确定队伍代码，请重新打开队员管理。";
         return;
     }

    const success = await store.createMember({
        team_code: showingMembersForTeam.value.code,
        nickname: newMember.nickname,
        color: newMember.color,
        job: newMember.job,
        maimai_id: newMember.maimai_id,
        qq_number: newMember.qq_number,
        avatar_url: newMember.avatar_url,
        kinde_user_id: newMember.kinde_user_id,
        is_admin: newMember.is_admin,
    });

    if (success) {
        // Refresh the list in the modal
        refreshTeamMembers();
        // Reset new member form (except team_code)
         Object.assign(newMember, {
            nickname: '', color: null, job: null, maimai_id: null,
            qq_number: null, avatar_url: null, kinde_user_id: null, is_admin: 0,
        });
    }
}

async function handleDeleteMember(memberId: number) {
    const success = await store.deleteMember(memberId);
    if (success) {
        // Refresh the list in the modal
        refreshTeamMembers();
    }
}

// --- Bulk Import Actions ---

function handleTeamFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        teamFile.value = target.files[0];
        store.bulkImportError = null; // Clear previous errors
        store.bulkImportMessage = null; // Clear previous messages
    } else {
        teamFile.value = null;
    }
}

async function handleBulkImportTeams() {
    if (!teamFile.value) {
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
            }) as BulkTeamRow[]; // Assert type

            console.log("Parsed Teams CSV:", records);

            // Basic validation before sending to API
            const validRecords = records.filter(r => r.code && r.code.length === 4 && r.name);
            if (validRecords.length !== records.length) {
                 store.bulkImportError = `CSV 文件中包含无效行。请确保每行都有4位代码和名称。有效行数: ${validRecords.length}/${records.length}`;
                 // Optionally show which rows are invalid
                 return;
            }


            // Call the store action for bulk creation
            await store.bulkCreateTeams(validRecords);

        } catch (error: any) {
            console.error("Error reading or parsing CSV:", error);
            store.bulkImportError = `处理 CSV 文件失败: ${error.message}`;
        } finally {
             teamFile.value = null; // Clear the file input
             const fileInput = document.querySelector('#bulkTeamFileInput') as HTMLInputElement;
             if (fileInput) fileInput.value = ''; // Reset file input element
        }
    };
    reader.onerror = (e) => {
        console.error("FileReader error:", e);
        store.bulkImportError = "读取文件失败。";
         teamFile.value = null; // Clear the file input
         const fileInput = document.querySelector('#bulkTeamFileInput') as HTMLInputElement;
         if (fileInput) fileInput.value = ''; // Reset file input element
    };
    reader.readAsText(teamFile.value); // Read as text for CSV
}


function handleMemberFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        memberFile.value = target.files[0];
        store.bulkImportError = null; // Clear previous errors
        store.bulkImportMessage = null; // Clear previous messages
    } else {
        memberFile.value = null;
    }
}

async function handleBulkImportMembers() {
    if (!memberFile.value) {
        store.bulkImportError = "请选择一个 CSV 文件。";
        return;
    }
     // Check if the modal is still open and team is selected
     if (!showingMembersForTeam.value) {
         store.bulkImportError = "无法确定队伍，请重新打开队员管理。";
         return;
     }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const csvString = e.target?.result as string;
            const records = parse(csvString, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }) as BulkMemberRow[]; // Assert type

            console.log("Parsed Members CSV:", records);

            // Re-check if the team is still being shown inside the async callback
            if (!showingMembersForTeam.value) {
                 store.bulkImportError = "队伍信息已丢失，请重新打开队员管理并重试。";
                 return; // Stop processing if modal was closed
            }

            // Basic validation and ensure team_code matches the current team
            const currentTeamCode = showingMembersForTeam.value.code; // Access code *after* the check
            const validRecords = records.filter(r =>
                 r.team_code === currentTeamCode && // Must match current team code
                 r.nickname // Nickname is required
            );

             if (validRecords.length !== records.length) {
                  store.bulkImportError = `CSV 文件中包含无效行或队伍代码不匹配当前队伍 (${currentTeamCode})。请确保每行都有正确的队伍代码和昵称。有效行数: ${validRecords.length}/${records.length}`;
                  return;
             }


            // Call the store action for bulk creation
            const success = await store.bulkCreateMembers(validRecords);

            if (success) {
                 // Refresh the list in the modal after successful import
                 refreshTeamMembers();
            }


        } catch (error: any) {
            console.error("Error reading or parsing Members CSV:", error);
            store.bulkImportError = `处理队员 CSV 文件失败: ${error.message}`;
        } finally {
             memberFile.value = null; // Clear the file input
             const fileInput = document.querySelector('#bulkMemberFileInput') as HTMLInputElement;
             if (fileInput) fileInput.value = ''; // Reset file input element
        }
    };
    reader.onerror = (e) => {
        console.error("FileReader error:", e);
        store.bulkImportError = "读取文件失败。";
         memberFile.value = null; // Clear the file input
         const fileInput = document.querySelector('#bulkMemberFileInput') as HTMLInputElement;
         if (fileInput) fileInput.value = ''; // Reset file input element
    };
    reader.readAsText(memberFile.value); // Read as text for CSV
}


</script>

<style scoped>
/* Reuse styles from Index.vue and add new ones */
.admin-page {
  max-width: 1000px; /* Increased max-width */
  margin: 20px auto; /* Added margin top/bottom */
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Adjusted min-width */
  gap: 20px;
  margin-bottom: 20px;
}
.form-grid.compact-grid {
    gap: 15px;
}


.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 0; /* Removed margin-bottom from form-group when used in grid */
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
    gap: 10px; /* Reduced gap */
    justify-content: center;
    margin-top: 20px;
    flex-wrap: wrap;
}

.button-group button {
    padding: 10px 15px; /* Adjusted padding */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem; /* Adjusted font size */
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
}

.data-table th, .data-table td {
    border: 1px solid #ddd;
    padding: 10px;
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
    padding: 5px 10px;
    font-size: 0.9em;
}
.data-table td button:last-child {
    margin-right: 0;
}

.small-button {
    padding: 5px 10px;
    font-size: 0.9em;
    border-radius: 3px;
}
.small-button.delete-button {
     background-color: #dc3545;
     color: white;
}
.small-button.delete-button:hover:not(:disabled) {
     background-color: #c82333;
}


/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6); /* Darker overlay */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    overflow-y: auto; /* Allow scrolling if modal content is tall */
}

.modal-content {
    background-color: #fff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}
.modal-content.large-modal {
    max-width: 900px; /* Wider for member list */
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #333;
    text-align: center;
}

.modal-content .form-grid {
    grid-template-columns: 1fr 1fr; /* Two columns for modal form */
    gap: 15px;
    margin-bottom: 20px;
}
.modal-content .form-grid.compact-grid {
     grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* More columns for member details */
}


.modal-content .form-group label {
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.modal-content .form-group input[type="text"],
.modal-content .form-group input[type="number"],
.modal-content .form-group select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}


.modal-content .button-group {
    margin-top: 20px;
}

.modal-content .button-group button {
    max-width: 150px; /* Smaller buttons in modal */
}

.modal-content .button-group button[type="submit"] {
    background-color: #28a745; /* Green for save */
}
.modal-content .button-group button[type="submit"]:hover:not(:disabled) {
    background-color: #218838;
}

.modal-content .button-group button:nth-of-type(2) {
    background-color: #6c757d; /* Grey for cancel/close */
}
.modal-content .button-group button:nth-of-type(2):hover:not(:disabled) {
    background-color: #5a6268;
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
