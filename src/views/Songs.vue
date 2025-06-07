<!-- src/views/Songs.vue -->
<template>
  <div class="songs-view">
    <el-card header="歌曲列表">
      <el-form :inline="true" @submit.prevent="handleFilterChange">
        <!-- Category Dropdown -->
        <el-form-item label="分类">
          <el-select
            v-model="filters.category"
            placeholder="选择分类"
            clearable
            filterable
            @change="handleFilterChange"
            :loading="store.isLoading.songFilters"
            style="width: 150px;"
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
             v-model="filters.type"
             placeholder="选择类型"
             clearable
             filterable
             @change="handleFilterChange"
             :loading="store.isLoading.songFilters"
             style="width: 120px;"
           >
             <el-option
               v-for="item in store.songFilterOptions.types"
               :key="item"
               :label="item"
               :value="item"
             />
           </el-select>
        </el-form-item>

        <!-- Level Dropdown -->
        <el-form-item label="等级">
           <el-select
             v-model="filters.level"
             placeholder="选择等级"
             clearable
             filterable
             @change="handleFilterChange"
             :loading="store.isLoading.songFilters"
             style="width: 120px;"
           >
             <!-- Use levels from store.songFilterOptions -->
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
          <el-input v-model="filters.search" placeholder="输入歌名关键字" clearable @input="handleFilterChange" style="width: 200px;" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleFilterChange" :loading="store.isLoading.songs">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- Use store.songs directly for the table data -->
      <el-table :data="store.songs" v-loading="store.isLoading.songs" style="width: 100%" border stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.fullCoverUrl"
              style="width: 60px; height: 60px"
              :src="row.fullCoverUrl"
              :preview-src-list="[row.fullCoverUrl]"
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
        <el-table-column prop="title" label="曲名" sortable />
        <el-table-column prop="category" label="分类" width="120" sortable />
        <el-table-column prop="type" label="类型" width="100" sortable />
        <el-table-column prop="bpm" label="BPM" width="100" sortable />
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

      <!-- Pagination -->
      <el-pagination
        v-if="store.songPagination && store.songPagination.totalItems > 0"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="store.songPagination.totalItems"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="store.songPagination.pageSize"
        :current-page="store.songPagination.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentPageChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref, computed } from 'vue';
import { useAppStore } from '@/store'; // Adjust path
import { ElMessage } from 'element-plus';
import { Picture } from '@element-plus/icons-vue';
// Import types directly from store.ts
import type { Song, SongLevel } from '@/store';

const store = useAppStore();

const filters = reactive({
  category: '',
  type: '',
  search: '',
  level: '', // Add level filter state
  page: 1,
  limit: 20, // Default page size
});

// REMOVED: Hardcoded levelOptions ref
// The level options will come from store.songFilterOptions.levels

// REMOVED: Client-side filteredSongs computed property
// The table now binds directly to store.songs which is the paginated list from the backend


/**
 * Loads songs from the store based on current filters and pagination.
 * Note: All filters (category, type, search, level) are now applied backend-side.
 */
const loadSongs = async () => {
  // Pass ALL filters and pagination params to the store action
  await store.fetchSongs({
    category: filters.category || undefined, // Pass empty string as undefined to remove from params
    type: filters.type || undefined,
    search: filters.search || undefined,
    level: filters.level || undefined, // Pass level filter
    page: filters.page,
    limit: filters.limit,
  });
  // Display error if fetching songs failed
  if (store.error) {
    // Check if the error is specifically from fetching songs (optional, can show any error)
    // For simplicity, let's just show the error if any exists after fetchSongs
    ElMessage.error(`加载歌曲失败: ${store.error}`);
  }
};

/**
 * Handles changes in filter inputs (category, type, search, level).
 * Resets pagination to page 1 and reloads songs.
 */
const handleFilterChange = () => {
    filters.page = 1; // Reset to first page when filters change
    loadSongs();
};

/**
 * Handles changes in the pagination page size.
 * Resets page to 1 and reloads songs.
 */
const handleSizeChange = (newSize: number) => {
    filters.limit = newSize;
    filters.page = 1; // Reset to first page when size changes
    loadSongs();
};

/**
 * Handles changes in the current pagination page.
 * Loads songs for the new page.
 */
const handleCurrentPageChange = (newPage: number) => {
    filters.page = newPage;
    loadSongs();
};

// On component mount, fetch filter options and initial song list
onMounted(() => {
  store.fetchSongFilterOptions(); // Fetch dropdown options
  loadSongs(); // Initial load of songs
});
</script>

<style scoped>
.songs-view {
  max-width: 1200px; /* Adjust as needed */
  margin: 20px auto; /* Add some margin */
  padding: 20px;
}
.el-form-item {
    margin-right: 15px; /* Spacing between filter items */
    margin-bottom: 15px; /* Add bottom margin for better layout */
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 20px;
}
.el-pagination { /* Style pagination */
     margin-top: 20px;
     justify-content: flex-end; /* Align to the right */
}
</style>
