<template>
    <div class="songs-view">
      <el-card header="歌曲列表">
        <el-form :inline="true" @submit.prevent="loadSongs">
          <el-form-item label="分类">
            <el-input v-model="filters.category" placeholder="例如: original" clearable />
          </el-form-item>
          <el-form-item label="类型">
            <el-input v-model="filters.type" placeholder="例如: DX" clearable />
          </el-form-item>
          <el-form-item label="搜索歌名">
            <el-input v-model="filters.search" placeholder="输入歌名关键字" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadSongs" :loading="store.isLoading.songs">查询</el-button>
          </el-form-item>
        </el-form>
  
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
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, onMounted } from 'vue';
  import { useAppStore } from '@/store';
  import { ElMessage } from 'element-plus';
  
  const store = useAppStore();
  
  const filters = reactive({
    category: '',
    type: '',
    search: '',
  });
  
  const loadSongs = async () => {
    await store.fetchSongs({
      category: filters.category || undefined,
      type: filters.type || undefined,
      search: filters.search || undefined,
    });
    if (store.error) {
      ElMessage.error(`加载歌曲失败: ${store.error}`);
    }
  };
  
  onMounted(() => {
    loadSongs();
  });
  </script>
  
  <style scoped>
  .songs-view {
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
    font-size: 20px;
  }
  </style>
  