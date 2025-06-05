<!-- src/views/MemberSongPrefs.vue -->
<template>
    <div class="member-song-prefs-view">
      <el-card header="选手选曲偏好">
        <el-form :inline="true">
          <!-- TODO: Replace with actual logged-in member selection/display -->
          <el-form-item label="选择选手">
             <el-select v-model="selectedMemberId" placeholder="选择选手" filterable @change="loadPreferences">
                 <el-option
                     v-for="member in store.members"
                     :key="member.id"
                     :label="`${member.nickname} (${member.team_code})`"
                     :value="member.id"
                 />
             </el-select>
          </el-form-item>
          <el-form-item label="选择赛段">
            <el-select v-model="selectedStage" placeholder="选择赛段" @change="loadPreferences">
              <!-- TODO: Make stages dynamic if needed -->
              <el-option label="初赛" value="初赛" />
              <el-option label="复赛" value="复赛" />
              <!-- Add other stages -->
            </el-select>
          </el-form-item>
           <el-form-item>
               <el-button type="primary" @click="openAddPreferenceDialog" :disabled="!selectedMemberId || !selectedStage">添加选曲</el-button>
           </el-form-item>
        </el-form>
  
        <el-table :data="store.memberSongPreferences" v-loading="store.isLoading.memberSongPreferences" style="width: 100%; margin-top: 20px;" border stripe>
          <el-table-column type="index" width="50" />
           <el-table-column label="封面" width="80">
               <template #default="{ row }">
                   <el-image
                     v-if="row.fullCoverUrl"
                     style="width: 50px; height: 50px"
                     :src="row.fullCoverUrl"
                     fit="cover"
                     lazy
                   >
                     <template #error>
                       <div class="image-slot">
                         <el-icon><Picture /></el-icon>
                       </div>
                     </template>
                   </el-image>
                    <div v-else class="image-slot">
                         <el-icon><Picture /></el-icon>
                    </div>
               </template>
           </el-table-column>
          <el-table-column prop="song_title" label="曲名" />
          <el-table-column prop="selected_difficulty" label="选择难度" width="120" />
          <el-table-column prop="tournament_stage" label="赛段" width="120" />
          <el-table-column prop="created_at" label="选择时间" width="180">
               <template #default="{ row }">
                   {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
               </template>
          </el-table-column>
          <!-- TODO: Add Delete button if backend supports -->
          <!-- <el-table-column label="操作" width="100">
              <template #default="{ row }">
                  <el-button size="small" type="danger" @click="handleDeletePreference(row)">删除</el-button>
              </template>
          </el-table-column> -->
        </el-table>
  
         <!-- Add Preference Dialog -->
         <el-dialog v-model="addPreferenceDialogVisible" title="添加选曲偏好" width="600px">
             <el-form :inline="true">
                 <el-form-item label="搜索歌名">
                     <el-input v-model="songSearchQuery" placeholder="输入歌名关键字" clearable @input="debouncedSearchSongs" />
                 </el-form-item>
             </el-form>
             <el-table
                 :data="store.songs"
                 v-loading="store.isLoading.songs"
                 style="width: 100%; max-height: 300px; overflow-y: auto;"
                 highlight-current-row
                 @current-change="handleSongSelectForPreference"
                 border
                 stripe
             >
                 <el-table-column type="index" width="50" />
                 <el-table-column label="封面" width="80">
                     <template #default="{ row }">
                         <el-image
                           v-if="row.fullCoverUrl"
                           style="width: 50px; height: 50px"
                           :src="row.fullCoverUrl"
                           fit="cover"
                           lazy
                         >
                           <template #error>
                             <div class="image-slot">
                               <el-icon><Picture /></el-icon>
                             </div>
                           </template>
                         </el-image>
                          <div v-else class="image-slot">
                               <el-icon><Picture /></el-icon>
                          </div>
                     </template>
                 </el-table-column>
                 <el-table-column prop="title" label="曲名" />
                 <el-table-column label="等级 (M)" width="100">
                     <template #default="{ row }">
                         {{ row.parsedLevels?.M || '-' }}
                     </template>
                 </el-table-column>
                 <!-- Add other difficulty columns if needed -->
             </el-table>
  
             <el-form v-if="selectedSongForPreference" :model="newPreferenceForm" style="margin-top: 20px;" label-width="100px">
                 <el-form-item label="已选歌曲">
                     <el-text>{{ selectedSongForPreference.title }}</el-text>
                 </el-form-item>
                 <el-form-item label="选择难度" prop="selected_difficulty" :rules="[{ required: true, message: '请选择难度', trigger: 'change' }]">
                     <el-select v-model="newPreferenceForm.selected_difficulty" placeholder="选择难度">
                         <el-option
                             v-for="(level, diff) in selectedSongForPreference.parsedLevels"
                             :key="diff"
                             :label="`${diff} ${level}`"
                             :value="diff"
                             :disabled="!level"
                         />
                     </el-select>
                 </el-form-item>
             </el-form>
  
             <template #footer>
                 <el-button @click="addPreferenceDialogVisible = false">取消</el-button>
                 <el-button type="primary" @click="submitAddPreference" :disabled="!selectedSongForPreference || !newPreferenceForm.selected_difficulty">确认添加</el-button>
             </template>
         </el-dialog>
  
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore, type Song, type SaveMemberSongPreferencePayload } from '@/store';
  import { onMounted, ref, reactive } from 'vue';
  import { ElMessage } from 'element-plus';
  import { debounce } from 'lodash-es';
  
  const store = useAppStore();
  
  // TODO: Replace with actual logged-in member ID
  const selectedMemberId = ref<number | null>(null); // Placeholder
  const selectedStage = ref<string | null>(null);
  
  // --- Data Fetching ---
  onMounted(() => {
    store.fetchMembers(); // Needed for member selection dropdown
    store.fetchSongs(); // Needed for song selection dialog
  });
  
  const loadPreferences = () => {
      if (selectedMemberId.value !== null && selectedStage.value !== null) {
          store.fetchMemberSongPreferences(selectedMemberId.value, selectedStage.value);
      } else {
          store.memberSongPreferences = []; // Clear list if member/stage not selected
      }
  };
  
  // --- Add Preference Dialog ---
  const addPreferenceDialogVisible = ref(false);
  const songSearchQuery = ref(''); // Re-use search query
  const selectedSongForPreference = ref<Song | null>(null);
  const newPreferenceForm = reactive<{
      selected_difficulty: string | null;
  }>({
      selected_difficulty: null,
  });
  
  const openAddPreferenceDialog = () => {
      if (selectedMemberId.value === null || selectedStage.value === null) {
          ElMessage.warning('请先选择选手和赛段');
          return;
      }
      songSearchQuery.value = '';
      selectedSongForPreference.value = null;
      newPreferenceForm.selected_difficulty = null;
      store.fetchSongs(); // Ensure song list is fresh
      addPreferenceDialogVisible.value = true;
  };
  
  const debouncedSearchSongs = debounce(() => {
      store.fetchSongs({ search: songSearchQuery.value });
  }, 300);
  
  const handleSongSelectForPreference = (song: Song) => {
      selectedSongForPreference.value = song;
      newPreferenceForm.selected_difficulty = null; // Reset difficulty
  };
  
  const submitAddPreference = async () => {
      if (!selectedSongForPreference.value || !newPreferenceForm.selected_difficulty || selectedMemberId.value === null || selectedStage.value === null) {
          ElMessage.warning('请选择歌曲和难度');
          return;
      }
  
      const payload: SaveMemberSongPreferencePayload = {
          member_id: selectedMemberId.value,
          tournament_stage: selectedStage.value,
          song_id: selectedSongForPreference.value.id,
          selected_difficulty: newPreferenceForm.selected_difficulty,
      };
  
      const result = await store.saveMemberSongPreference(payload);
  
      if (result) {
          ElMessage.success('选曲偏好保存成功');
          addPreferenceDialogVisible.value = false;
          selectedSongForPreference.value = null; // Clear selection
          // loadPreferences(); // Re-fetch or rely on store update
      } else {
          ElMessage.error(`保存失败: ${store.error}`);
      }
  };
  
  // TODO: Implement Delete Preference if needed
  // const handleDeletePreference = async (preference: MemberSongPreference) => {
  //     ElMessageBox.confirm('确定删除此选曲偏好吗？', '警告', {
  //         confirmButtonText: '确定',
  //         cancelButtonText: '取消',
  //         type: 'warning',
  //     }).then(async () => {
  //         // Assuming you add a delete API and store action
  //         // await store.deleteMemberSongPreference(preference.id);
  //         // ElMessage.success('删除成功');
  //         // loadPreferences(); // Refresh list
  //     }).catch(() => {
  //         // User cancelled
  //     });
  // };
  
  </script>
  
  <style scoped>
  .member-song-prefs-view {
    max-width: 1200px;
    margin: 0 auto;
  }
  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
  </style>
  