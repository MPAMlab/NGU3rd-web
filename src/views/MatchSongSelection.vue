<!-- frontend/src/views/MatchSongSelection.vue -->
<template>
    <div class="match-selection-view">
        <el-card
            v-loading="store.isLoading.userMatchSelection || store.isLoading.allSongsForPicker || store.isLoading.savingMatchSelection || store.isLoading.songFilters"
            :header="matchTitle"
        >
            <div v-if="store.upcomingMatchForSelection">
                <el-alert
                    type="info"
                    :closable="false"
                    style="margin-bottom: 20px;"
                >
                    请为你即将参与的比赛选择 **2 首歌曲** 和你的 **出场顺序**。
                    你可以在比赛开始前修改你的选择。
                </el-alert>

                <!-- 只保留我方队伍的顺序选择和概览 -->
                <el-row :gutter="20">
                    <!-- Adjusted span to take more width -->
                    <el-col :span="24">
                        <el-card :header="`${store.upcomingMatchForSelection.myTeam.name} (我方队伍)`">
                            <p>请选择你的出场顺序：</p>
                            <el-segmented
                                v-model="selectedOrderIndex"
                                :options="orderOptions"
                                size="large"
                                @change="handleOrderChange"
                            />
                            <el-text type="info" size="small" style="margin-top: 10px; display: block;">
                                已选择顺序：{{ selectedOrderIndex !== null ? `第 ${selectedOrderIndex + 1} 位` : '未选择' }}
                            </el-text>
                             <div style="margin-top: 15px;">
                                 <p>队伍出场顺序概览：</p>
                                 <div v-for="index in store.availableOrderSlotsCount" :key="index" style="margin-bottom: 5px;">
                                     <el-tag
                                         :type="getOrderSlotTagType(index - 1)"
                                         size="small"
                                         style="width: 80px; text-align: center; margin-right: 10px;"
                                     >
                                         第 {{ index }} 位
                                     </el-tag>
                                     <el-text v-if="isSlotOccupied(store.upcomingMatchForSelection.myTeam.id, index - 1)">
                                         {{ store.getOccupyingMemberNickname(store.upcomingMatchForSelection.myTeam.id, index - 1) }}
                                     </el-text>
                                      <el-text v-else type="info">
                                          (空闲)
                                      </el-text>
                                 </div>
                             </div>
                        </el-card>
                    </el-col>
                    <!-- Removed the opponent team column -->
                </el-row>

                <el-card header="我的选曲" style="margin-top: 20px;">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <h4>我的第一首歌</h4>
                            <div v-if="selectedSongs[0].song_id" class="selected-song-item">
                                <el-image
                                    v-if="selectedSongs[0].fullCoverUrl"
                                    style="width: 60px; height: 60px; margin-right: 10px; border-radius: 4px;"
                                    :src="selectedSongs[0].fullCoverUrl"
                                    fit="cover"
                                    lazy
                                >
                                    <template #error>
                                        <div class="image-slot" style="width: 60px; height: 60px;"><el-icon><Picture /></el-icon></div>
                                    </template>
                                </el-image>
                                <div v-else class="image-slot" style="width: 60px; height: 60px; margin-right: 10px;"><el-icon><Picture /></el-icon></div>
                                <div class="song-info">
                                    <el-text>{{ selectedSongs[0].song_title }}</el-text><br>
                                    <el-select
                                        v-model="selectedSongs[0].selected_difficulty"
                                        placeholder="选择难度"
                                        size="small"
                                        style="width: 120px; margin-top: 5px;"
                                    >
                                        <el-option
                                            v-for="(level, diff) in selectedSongs[0].parsedLevels"
                                            :key="diff"
                                            :label="`${diff} ${level}`"
                                            :value="diff"
                                            :disabled="!level"
                                        />
                                    </el-select>
                                </div>
                                <el-button type="danger" :icon="Delete" circle size="small" @click="removeSong(0)" style="margin-left: auto;"></el-button>
                            </div>
                            <el-button v-else type="primary" @click="openSongPicker(0)">选择歌曲 1</el-button>
                        </el-col>
                        <el-col :span="12">
                            <h4>我的第二首歌</h4>
                             <div v-if="selectedSongs[1].song_id" class="selected-song-item">
                                <el-image
                                    v-if="selectedSongs[1].fullCoverUrl"
                                    style="width: 60px; height: 60px; margin-right: 10px; border-radius: 4px;"
                                    :src="selectedSongs[1].fullCoverUrl"
                                    fit="cover"
                                    lazy
                                >
                                    <template #error>
                                        <div class="image-slot" style="width: 60px; height: 60px;"><el-icon><Picture /></el-icon></div>
                                    </template>
                                </el-image>
                                <div v-else class="image-slot" style="width: 60px; height: 60px; margin-right: 10px;"><el-icon><Picture /></el-icon></div>
                                <div class="song-info">
                                    <el-text>{{ selectedSongs[1].song_title }}</el-text><br>
                                    <el-select
                                        v-model="selectedSongs[1].selected_difficulty"
                                        placeholder="选择难度"
                                        size="small"
                                        style="width: 120px; margin-top: 5px;"
                                    >
                                        <el-option
                                            v-for="(level, diff) in selectedSongs[1].parsedLevels"
                                            :key="diff"
                                            :label="`${diff} ${level}`"
                                            :value="diff"
                                            :disabled="!level"
                                        />
                                    </el-select>
                                </div>
                                <el-button type="danger" :icon="Delete" circle size="small" @click="removeSong(1)" style="margin-left: auto;"></el-button>
                            </div>
                            <el-button v-else type="primary" @click="openSongPicker(1)">选择歌曲 2</el-button>
                        </el-col>
                    </el-row>
                </el-card>

                <div style="margin-top: 30px; text-align: center;">
                    <el-button
                        type="success"
                        size="large"
                        @click="saveSelection"
                        :disabled="!isSelectionComplete || store.isLoading.savingMatchSelection"
                        :loading="store.isLoading.savingMatchSelection"
                    >
                        保存我的选歌和顺序
                    </el-button>
                    <el-text v-if="!isSelectionComplete" type="warning" style="margin-left: 15px;">
                        请选择 2 首歌曲 (并选择难度) 和你的出场顺序。
                    </el-text>
                     <el-text v-if="store.userMatchSelection" type="success" style="margin-left: 15px;">
                         已保存！
                     </el-text>
                </div>

            </div>
             <div v-else-if="!store.isLoading.userMatchSelection">
                 <el-empty description="未找到待选歌的比赛或您不属于该比赛队伍"></el-empty>
             </div>
        </el-card>

        <!-- Song Picker Dialog -->
        <el-dialog v-model="songPickerDialogVisible" title="选择歌曲" width="800px"> <!-- Increased width -->
             <el-form :inline="true">
                 <!-- Category Dropdown -->
                 <el-form-item label="分类">
                   <el-select
                     v-model="pickerFilters.category"
                     placeholder="选择分类"
                     clearable
                     filterable
                     style="width: 150px;"
                     :loading="store.isLoading.songFilters"
                   >
                     <el-option
                       v-for="item in store.songFilterOptions.categories"
                       :key="item"
                       :label="item"
                       :value="item"
                     />
                   </el-select>
                 </el-form-item>

                 <!-- Type Dropdown -->
                 <el-form-item label="类型">
                    <el-select
                      v-model="pickerFilters.type"
                      placeholder="选择类型"
                      clearable
                      filterable
                      style="width: 120px;"
                      :loading="store.isLoading.songFilters"
                    >
                      <el-option
                        v-for="item in store.songFilterOptions.types"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                 </el-form-item>

                 <!-- Difficulty Dropdown -->
                 <el-form-item label="难度">
                     <el-select
                       v-model="pickerFilters.difficulty"
                       placeholder="选择难度"
                       clearable
                       filterable
                       style="width: 120px;"
                       :loading="store.isLoading.songFilters"
                     >
                       <!-- Corrected: Access difficulties from songFilterOptions -->
                       <el-option
                         v-for="item in store.songFilterOptions.difficulties"
                         :key="item"
                         :label="item"
                         :value="item"
                       />
                     </el-select>
                  </el-form-item>

                 <!-- Level Dropdown -->
                 <el-form-item label="等级">
                    <el-select
                      v-model="pickerFilters.level"
                      placeholder="选择等级"
                      clearable
                      filterable
                      style="width: 120px;"
                      :loading="store.isLoading.songFilters"
                    >
                      <!-- Corrected: Access levels from songFilterOptions -->
                      <el-option
                        v-for="level in store.songFilterOptions.levels"
                        :key="level"
                        :label="level"
                        :value="level"
                      />
                    </el-select>
                 </el-form-item>

                 <!-- Search Input -->
                 <el-form-item label="搜索歌名">
                     <!-- Debounced search is applied to the computed property -->
                     <el-input v-model="pickerFilters.search" placeholder="输入歌名关键字" clearable />
                 </el-form-item>
             </el-form>

             <el-table
                 :data="filteredSongsForPicker"
                 v-loading="store.isLoading.allSongsForPicker"
                 style="width: 100%; max-height: 400px; overflow-y: auto;" <!-- Increased max-height -->
                 highlight-current-row
                 @current-change="handleSongSelectForPicker"
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
                 <el-table-column label="等级" width="150">
                      <template #default="{ row }">
                          <div v-if="row.parsedLevels">
                              <span v-if="row.parsedLevels.B">B: {{ row.parsedLevels.B }}</span><br v-if="row.parsedLevels.B && (row.parsedLevels.A || row.parsedLevels.E || row.parsedLevels.M || row.parsedLevels.R)">
                              <span v-if="row.parsedLevels.A">A: {{ row.parsedLevels.A }}</span><br v-if="row.parsedLevels.A && (row.parsedLevels.E || row.parsedLevels.M || row.parsedLevels.R)">
                              <span v-if="row.parsedLevels.E">E: {{ row.parsedLevels.E }}</span><br v-if="row.parsedLevels.E && (row.parsedLevels.M || row.parsedLevels.R)">
                              <span v-if="row.parsedLevels.M">M: {{ row.parsedLevels.M }}</span><br v-if="row.parsedLevels.M && row.parsedLevels.R">
                              <span v-if="row.parsedLevels.R">R: {{ row.parsedLevels.R }}</span>
                          </div>
                          <span v-else>-</span>
                      </template>
                 </el-table-column>
             </el-table>

             <el-form v-if="selectedSongInPicker" style="margin-top: 20px;" label-width="100px">
                 <el-form-item label="已选歌曲">
                     <el-text>{{ selectedSongInPicker.title }}</el-text>
                 </el-form-item>
                 <el-form-item label="选择难度" prop="selected_difficulty" :rules="[{ required: true, message: '请选择难度', trigger: 'change' }]">
                     <el-select v-model="selectedDifficultyInPicker" placeholder="选择难度">
                         <el-option
                             v-for="(level, diff) in selectedSongInPicker.parsedLevels"
                             :key="diff"
                             :label="`${diff} ${level}`"
                             :value="diff"
                             :disabled="!level"
                         />
                     </el-select>
                 </el-form-item>
             </el-form>

             <template #footer>
                 <el-button @click="songPickerDialogVisible = false">取消</el-button>
                 <el-button type="primary" @click="confirmSongSelection" :disabled="!selectedSongInPicker || !selectedDifficultyInPicker">确定</el-button>
             </template>
         </el-dialog>

    </div>
</template>

<script setup lang="ts">
// Import types directly from store.ts
// Corrected: Import SongLevel type
import { useAppStore, type Song, type MatchPlayerSelectionFrontend, type SaveMatchPlayerSelectionPayloadFrontend, type SongLevel } from '@/store';
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Picture, Delete } from '@element-plus/icons-vue'; // Import Picture and Delete icons
import { debounce } from 'lodash-es'; // Keep debounce for search input

const store = useAppStore();
const route = useRoute();
const matchId = computed(() => parseInt(route.params.matchId as string));

// --- State ---
// State for the segmented button (0-based index)
const selectedOrderIndex = ref<number | null>(null);

// State for the two selected songs
const selectedSongs = reactive([
    { song_id: null as number | null, song_title: '', selected_difficulty: '', fullCoverUrl: undefined as string | undefined, parsedLevels: undefined as any },
    { song_id: null as number | null, song_title: '', selected_difficulty: '', fullCoverUrl: undefined as string | undefined, parsedLevels: undefined as any },
]);

// State for the song picker dialog
const songPickerDialogVisible = ref(false);
const currentSongIndexToSelect = ref(0); // 0 for first song, 1 for second
const selectedSongInPicker = ref<Song | null>(null);
const selectedDifficultyInPicker = ref('');
// Picker filter state (client-side filtering)
const pickerFilters = reactive({
    category: '',
    type: '',
    search: '',
    level: '',
    difficulty: '',
});


// --- Computed Properties ---

// Options for the segmented button (e.g., [1, 2, 3])
const orderOptions = computed(() => {
    const count = store.availableOrderSlotsCount;
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, i) => ({
        label: `第 ${i + 1} 位`,
        value: i,
        // Disable if occupied by a teammate using the store getter
        disabled: store.isOrderIndexOccupiedByTeammate(i),
    }));
});

// Check if the selection is complete (2 songs with difficulty + order index selected)
const isSelectionComplete = computed(() => {
    return (
        selectedSongs[0].song_id !== null && selectedSongs[0].selected_difficulty !== '' &&
        selectedSongs[1].song_id !== null && selectedSongs[1].selected_difficulty !== '' &&
        selectedOrderIndex.value !== null
    );
});

// Filter songs for the picker based on search query and other filters (client-side filtering)
const filteredSongsForPicker = computed(() => {
    let songs = store.allSongsForPicker;

    // Apply Category filter
    if (pickerFilters.category) {
        songs = songs.filter(song => song.category === pickerFilters.category);
    }
    // Apply Type filter
    if (pickerFilters.type) {
        songs = songs.filter(song => song.type === pickerFilters.type);
    }
    // Apply Difficulty filter
    if (pickerFilters.difficulty) {
        songs = songs.filter(song => song.parsedLevels && song.parsedLevels.hasOwnProperty(pickerFilters.difficulty));
    }
    // Apply Level filter
    if (pickerFilters.level) {
        songs = songs.filter(song => {
            if (!song.parsedLevels) return false;
            // Check if the selected level matches the level for the selected difficulty (if any)
            // OR if it matches any level if no difficulty is selected
            if (pickerFilters.difficulty) {
                 // Corrected: Access level using the difficulty key and compare as strings
                 const levelValue = song.parsedLevels[pickerFilters.difficulty as keyof SongLevel];
                 return levelValue === pickerFilters.level; // Compare strings directly
            } else {
                 // If no difficulty filter, check if the level matches any difficulty's level
                 // Corrected: Iterate over values and compare as strings
                 return Object.values(song.parsedLevels).some(level => level === pickerFilters.level);
            }
        });
    }
    // Apply Search filter (case-insensitive)
    if (pickerFilters.search) {
        const query = pickerFilters.search.toLowerCase();
        songs = songs.filter(song => song.title.toLowerCase().includes(query));
    }

    return songs;
});

const matchTitle = computed(() => {
    const match = store.upcomingMatchForSelection?.match;
    if (!match) return '比赛选歌';
    return `${match.round_name} - ${match.team1_name} vs ${match.team2_name}`;
});


// --- Watchers ---
// Watch for changes in userMatchSelection from the store and update local state
watch(() => store.userMatchSelection, (newSelection) => {
    if (newSelection) {
        selectedOrderIndex.value = newSelection.selected_order_index;
        // Populate selectedSongs based on the fetched selection
        // Use the getter from the store to find the song details
        const song1 = store.getSongForPickerById(newSelection.song1_id);
        const song2 = store.getSongForPickerById(newSelection.song2_id);

        selectedSongs[0] = {
            song_id: newSelection.song1_id,
            song_title: song1?.title || '未知歌曲',
            selected_difficulty: newSelection.song1_difficulty,
            fullCoverUrl: song1?.fullCoverUrl,
            parsedLevels: song1?.parsedLevels,
        };
         selectedSongs[1] = {
            song_id: newSelection.song2_id,
            song_title: song2?.title || '未知歌曲',
            selected_difficulty: newSelection.song2_difficulty,
            fullCoverUrl: song2?.fullCoverUrl,
            parsedLevels: song2?.parsedLevels,
        };
    } else {
        // Reset local state if no selection is found
        selectedOrderIndex.value = null;
        selectedSongs[0] = { song_id: null, song_title: '', selected_difficulty: '', fullCoverUrl: undefined, parsedLevels: undefined };
        selectedSongs[1] = { song_id: null, song_title: '', selected_difficulty: '', fullCoverUrl: undefined, parsedLevels: undefined };
    }
}, { immediate: true }); // Run immediately on component mount

// --- Methods ---

// Helper to check if a slot is occupied by ANYONE (including the current user)
// Used for displaying opponent team slots and my team slots overview
const isSlotOccupied = (teamId: number, index: number) => {
    return store.occupiedOrderIndices.some(item => item.team_id === teamId && item.selected_order_index === index);
};

// Helper to determine tag type for order slots in MY team
const getOrderSlotTagType = (index: number) => {
    const myTeamId = store.upcomingMatchForSelection?.myTeam?.id;
    if (!myTeamId) return 'info';

    const occupied = store.occupiedOrderIndices.find(
        item => item.team_id === myTeamId && item.selected_order_index === index
    );

    if (!occupied) {
        return 'info'; // Not occupied
    } else if (occupied.member_id === store.userMember?.id) {
        return 'success'; // Occupied by me
    } else {
        return 'warning'; // Occupied by teammate
    }
};


const handleOrderChange = (value: number) => {
    console.log("Selected order index:", value);
    // The segmented button handles disabling based on the computed property
    // No extra check needed here unless you want to prevent changing after saving
};

const openSongPicker = (songIndex: number) => {
    currentSongIndexToSelect.value = songIndex;
    selectedSongInPicker.value = null; // Reset picker state
    selectedDifficultyInPicker.value = '';
    // Reset picker filters
    pickerFilters.category = '';
    pickerFilters.type = '';
    pickerFilters.search = '';
    pickerFilters.level = '';
    pickerFilters.difficulty = '';

    songPickerDialogVisible.value = true;
    // Fetch all songs if not already loaded
    if (store.allSongsForPicker.length === 0 && !store.isLoading.allSongsForPicker) {
        store.fetchAllSongsForPicker();
    }
    // Fetch filter options if not already loaded
    if (store.songFilterOptions.categories.length === 0 && !store.isLoading.songFilters) {
         store.fetchSongFilterOptions();
    }
};

const handleSongSelectForPicker = (row: Song) => {
    selectedSongInPicker.value = row;
    selectedDifficultyInPicker.value = ''; // Reset difficulty when song changes
};

const confirmSongSelection = () => {
    if (selectedSongInPicker.value && selectedDifficultyInPicker.value) {
        const song = selectedSongInPicker.value;
        selectedSongs[currentSongIndexToSelect.value] = {
            song_id: song.id,
            song_title: song.title,
            selected_difficulty: selectedDifficultyInPicker.value,
            fullCoverUrl: song.fullCoverUrl,
            parsedLevels: song.parsedLevels,
        };
        songPickerDialogVisible.value = false;
    } else {
        ElMessage.warning('请选择歌曲并指定难度');
    }
};

const removeSong = (songIndex: number) => {
    selectedSongs[songIndex] = { song_id: null, song_title: '', selected_difficulty: '', fullCoverUrl: undefined, parsedLevels: undefined };
};

const saveSelection = async () => {
    if (!isSelectionComplete.value) {
        ElMessage.warning('请完成所有必填项：选择 2 首歌曲 (并选择难度) 和你的出场顺序。');
        return;
    }
    if (!store.upcomingMatchForSelection || selectedOrderIndex.value === null) {
         ElMessage.error('比赛信息或出场顺序无效，无法保存。');
         return;
    }

    const payload: SaveMatchPlayerSelectionPayloadFrontend = { // Corrected type usage
        song1_id: selectedSongs[0].song_id!, // ! asserts non-null after isSelectionComplete check
        song1_difficulty: selectedSongs[0].selected_difficulty,
        song2_id: selectedSongs[1].song_id!,
        song2_difficulty: selectedSongs[1].selected_difficulty,
        selected_order_index: selectedOrderIndex.value,
    };

    // The store action returns the saved data or null/undefined on error
    const result = await store.saveMatchSelection(matchId.value, payload);

    if (result) { // Check if result is truthy (data was returned)
        ElMessage.success('选歌和顺序保存成功！');
    } else {
        ElMessage.error(`保存失败: ${store.error}`);
    }
};

// Debounced search function for the song picker (applied to the computed property)
// No need to call a store action here, filtering is client-side
const debouncedSearchSongs = debounce(() => {
    // The computed property `filteredSongsForPicker` reacts to `pickerFilters.search`
    // No explicit action needed here other than the debounce itself
    console.log("Picker search query changed:", pickerFilters.search);
}, 300); // Adjust debounce delay as needed

// Watch the search query specifically to apply the debounced function
watch(() => pickerFilters.search, () => {
    debouncedSearchSongs();
});


// --- Lifecycle Hooks ---
onMounted(() => {
    if (matchId.value) {
        store.fetchUserMatchSelectionData(matchId.value);
        // Fetch filter options on mount as well, they might be needed for the picker
        if (store.songFilterOptions.categories.length === 0 && !store.isLoading.songFilters) {
             store.fetchSongFilterOptions();
        }
    } else {
        ElMessage.error('无效的比赛ID');
    }
});

// Clean up debounce on component unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  debouncedSearchSongs.cancel();
});

</script>

<style scoped>
.match-selection-view {
    max-width: 900px;
    margin: 20px auto;
    padding: 20px;
}

.selected-song-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    background-color: #f9fafc;
}

.song-info {
    flex-grow: 1;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 20px;
}
</style>
