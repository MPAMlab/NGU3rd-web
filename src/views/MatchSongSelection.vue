<!-- frontend/src/views/MatchSongSelection.vue -->
<template>
    <div class="match-selection-view">
        <el-card
            v-loading="store.isLoading.userMatchSelection || store.isLoading.songs || store.isLoading.savingMatchSelection || store.isLoading.songFilters"
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
                                         第 {{ index + 1 }} 位 <!-- Display 1-based index -->
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
             <!-- Filter Form -->
             <el-form :inline="true" v-if="store.songFilterOptions">
                 <!-- Category Dropdown -->
                 <el-form-item label="分类">
                   <el-select
                     v-model="pickerFilters.category"
                     placeholder="选择分类"
                     clearable
                     filterable
                     style="width: 150px;"
                     :loading="store.isLoading.songFilters"
                     @change="handlePickerFilterChange"
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
                      @change="handlePickerFilterChange"
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
                       @change="handlePickerFilterChange"
                     >
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
                      @change="handlePickerFilterChange"
                    >
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
                     <el-input v-model="pickerFilters.search" placeholder="输入歌名关键字" clearable @input="handlePickerSearchChange" />
                 </el-form-item>
             </el-form>
             <!-- Loading/Error state for filters -->
             <div v-else-if="store.isLoading.songFilters" style="text-align: center; padding: 20px;">
                 <el-spinner />
                 <p>加载筛选选项中...</p>
             </div>
             <div v-else style="text-align: center; padding: 20px;">
                 <el-alert type="error" :title="store.error || '加载筛选选项失败'" :closable="false"></el-alert>
             </div>

             <!-- Container for Table and Pagination - Render only when songs are not loading -->
             <div v-if="!store.isLoading.songs">
                 <!-- Song Table - Render only if there are songs after client-side filtering -->
                 <el-table
                     v-if="filteredSongsForPicker.length > 0"
                     :data="filteredSongsForPicker"
                     style="width: 100%; max-height: 400px; overflow-y: auto;"
                     highlight-current-row
                     @current-change="handleSongSelectForPicker"
                     border
                     stripe
                 >
                     <el-table-column type="index" width="50" :index="getPickerTableIndex" />
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

                 <!-- Pagination for Picker - Render only if there are songs after client-side filtering -->
                 <el-pagination
                   v-if="store.songPagination && store.songPagination.totalItems > 0 && filteredSongsForPicker.length > 0"
                   background
                   layout="total, sizes, prev, pager, next, jumper"
                   :total="store.songPagination.totalItems"
                   :page-sizes="[10, 20, 50, 100]"
                   :page-size="pickerFilters.limit"
                   :current-page="pickerFilters.page"
                   @size-change="handlePickerSizeChange"
                   @current-change="handlePickerCurrentPageChange"
                   style="margin-top: 20px; justify-content: flex-end;"
                 />

                 <!-- Empty state for songs -->
                 <el-empty v-else description="未找到符合条件的歌曲"></el-empty>
             </div>
             <!-- Optional: Add loading state for songs if needed, but v-loading on card might be enough -->
             <!-- <div v-else style="text-align: center; padding: 20px;">
                  <el-spinner />
                  <p>加载歌曲列表中...</p>
             </div> -->


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
// Picker filter state (client-side filtering + pagination params)
const pickerFilters = reactive({
    category: '',
    type: '',
    search: '',
    level: '', // Client-side filter
    difficulty: '', // Client-side filter
    page: 1, // Pagination
    limit: 20, // Pagination
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

// Filter songs for the picker based on Level and Difficulty (client-side filtering on the current page)
const filteredSongsForPicker = computed(() => {
    let songs = store.songs; // Use the current page of songs from the store

    // Apply Difficulty filter (client-side)
    if (pickerFilters.difficulty) {
        songs = songs.filter(song => song.parsedLevels && song.parsedLevels.hasOwnProperty(pickerFilters.difficulty));
    }
    // Apply Level filter (client-side)
    if (pickerFilters.level) {
        songs = songs.filter(song => {
            if (!song.parsedLevels) return false;
            // Check if the selected level matches the level for the selected difficulty (if any)
            // OR if it matches any level if no difficulty is selected
            if (pickerFilters.difficulty) {
                 // Access level using the difficulty key and compare as strings
                 const levelValue = song.parsedLevels[pickerFilters.difficulty as keyof SongLevel];
                 return levelValue === pickerFilters.level; // Compare strings directly
            } else {
                 // If no difficulty filter, check if the level matches any difficulty's level
                 // Iterate over values and compare as strings
                 return Object.values(song.parsedLevels).some(level => level === pickerFilters.level);
            }
        });
    }
    // Note: Category, Type, Search, Page, Limit are handled by the backend via store.fetchSongs

    return songs;
});

const matchTitle = computed(() => {
    const match = store.upcomingMatchForSelection?.match;
    // Corrected: Access round_name, team1_name, team2_name from the match object
    if (!match) return '比赛选歌';
    return `${match.round_name || '未知轮次'} - ${match.team1_name || '未知队伍'} vs ${match.team2_name || '未知队伍'}`;
});

// Helper for picker table index calculation
const getPickerTableIndex = (index: number) => {
    return (pickerFilters.page - 1) * pickerFilters.limit + index + 1;
};


// --- Watchers ---
// Watch for changes in userMatchSelection from the store and update local state
watch(() => store.userMatchSelection, (newSelection) => {
    if (newSelection) {
        selectedOrderIndex.value = newSelection.selected_order_index;
        // Populate selectedSongs based on the fetched selection
        // Use the getter from the store to find the song details
        // This relies on store.allSongsForPicker being populated BEFORE this watch runs,
        // which is now handled in onMounted.
        const song1 = store.getSongForPickerById(newSelection.song1_id);
        const song2 = store.getSongForPickerById(newSelection.song2_id);

        selectedSongs[0] = {
            song_id: newSelection.song1_id,
            song_title: song1?.title || '未知歌曲', // Use fetched title or fallback
            selected_difficulty: newSelection.song1_difficulty,
            fullCoverUrl: song1?.fullCoverUrl, // Use fetched URL
            parsedLevels: song1?.parsedLevels, // Use fetched levels
        };
         selectedSongs[1] = {
            song_id: newSelection.song2_id,
            song_title: song2?.title || '未知歌曲', // Use fetched title or fallback
            selected_difficulty: newSelection.song2_difficulty,
            fullCoverUrl: song2?.fullCoverUrl, // Use fetched URL
            parsedLevels: song2?.parsedLevels, // Use fetched levels
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

// Function to load songs for the picker using store.fetchSongs (with pagination and backend filters)
const loadSongsForPicker = async () => {
    await store.fetchSongs({
        category: pickerFilters.category || undefined,
        type: pickerFilters.type || undefined,
        search: pickerFilters.search || undefined,
        // Level and Difficulty are filtered client-side, so don't send them to backend fetch
        // level: pickerFilters.level || undefined,
        // difficulty: pickerFilters.difficulty || undefined,
        page: pickerFilters.page,
        limit: pickerFilters.limit,
    });
     // Display error if fetching songs failed
    if (store.error) {
        // Check if the error is specifically from fetching songs, not filter options
        // This requires checking the error message or having separate error states
        // For simplicity, let's just show the error if any exists after fetchSongs
        ElMessage.error(`加载歌曲列表失败: ${store.error}`);
    }
};


const openSongPicker = (songIndex: number) => {
    currentSongIndexToSelect.value = songIndex;
    selectedSongInPicker.value = null; // Reset picker state
    selectedDifficultyInPicker.value = '';
    // Reset picker filters and pagination
    pickerFilters.category = '';
    pickerFilters.type = '';
    pickerFilters.search = '';
    pickerFilters.level = '';
    pickerFilters.difficulty = '';
    pickerFilters.page = 1; // Reset to first page
    pickerFilters.limit = 20; // Reset to default limit

    songPickerDialogVisible.value = true;

    // Fetch filter options if not already loaded (now also fetched on mount)
    // This is crucial to populate store.songFilterOptions early
    // The v-if on the form handles the rendering delay.
    if (store.songFilterOptions.categories.length === 0 && !store.isLoading.songFilters) {
         store.fetchSongFilterOptions();
    }
    // Load the first page of songs for the picker
    loadSongsForPicker();
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

// Handles changes in picker filter inputs (Category, Type, Difficulty, Level)
const handlePickerFilterChange = () => {
    // Level and Difficulty are filtered client-side, so changing them doesn't reset pagination
    // Only reset pagination if Category, Type, or Search changes (backend filters)
    // However, for simplicity and consistency with the provided Songs.vue, let's reset page on *any* filter change.
    pickerFilters.page = 1; // Reset to first page when filters change
    loadSongsForPicker();
};

// Handles changes in the picker's search input (debounced)
const handlePickerSearchChange = debounce(() => {
    pickerFilters.page = 1; // Reset to first page on search change
    loadSongsForPicker();
}, 300); // Adjust debounce delay as needed


// Handles changes in the picker's pagination page size
const handlePickerSizeChange = (newSize: number) => {
    pickerFilters.limit = newSize;
    pickerFilters.page = 1; // Reset to first page when size changes
    loadSongsForPicker();
};

// Handles changes in the picker's current pagination page
const handlePickerCurrentPageChange = (newPage: number) => {
    pickerFilters.page = newPage;
    loadSongsForPicker();
};


// --- Lifecycle Hooks ---
onMounted(() => {
    if (matchId.value) {
        store.fetchUserMatchSelectionData(matchId.value);
        // Fetch filter options on mount as well, they might be needed for the picker
        // This is crucial to populate store.songFilterOptions early
        // The v-if on the form handles the rendering delay.
        if (store.songFilterOptions.categories.length === 0 && !store.isLoading.songFilters) {
             store.fetchSongFilterOptions();
        }
        // Fetch all songs for the picker on mount
        // This ensures song details are available for displaying saved selections immediately
        // This list is NOT used for the picker table data anymore, only for initial display of saved songs.
        // We still need this because the `watch` for `store.userMatchSelection` uses `store.getSongForPickerById`
        // which looks up songs in `store.allSongsForPicker`.
        if (store.allSongsForPicker.length === 0 && !store.isLoading.allSongsForPicker) {
             store.fetchAllSongsForPicker();
        }
    } else {
        ElMessage.error('无效的比赛ID');
    }
});

// Clean up debounce on component unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  handlePickerSearchChange.cancel();
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
