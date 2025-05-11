<template>
  <el-container style="min-height: 100vh;">
    <el-header style="padding: 0;">
      <el-menu mode="horizontal" :router="true" :default-active="$route.path">
        <el-menu-item index="/">NGU3rd比赛系统</el-menu-item>
        <el-menu-item index="/teams">队伍管理</el-menu-item>
        <el-menu-item index="/members">选手管理</el-menu-item>
        <el-menu-item index="/songs">歌曲列表</el-menu-item>
        <el-menu-item index="/schedule">赛程管理</el-menu-item>
        <el-menu-item index="/match-history">比赛历史</el-menu-item>
        <el-menu-item index="/member-song-prefs">选手选曲</el-menu-item>
        <!-- Add more navigation items -->
      </el-menu>
    </el-header>
    <el-main style="padding: 20px;">
      <!-- Global Error Display -->
      <el-alert
        v-if="store.error"
        :title="store.error"
        type="error"
        show-icon
        closable
        @close="store.clearError()"
        style="margin-bottom: 20px;"
      />

      <router-view v-slot="{ Component }">
        <template v-if="Component">
          <suspense>
            <component :is="Component"></component>
            <template #fallback>
              <el-skeleton :rows="5" animated />
            </template>
          </suspense>
        </template>
      </router-view>
    </el-main>
    <el-footer style="text-align: center; padding: 10px; color: #909399; font-size: 0.9em;">
      NGU3rd &copy; {{ new Date().getFullYear() }}
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store';
import { useRoute } from 'vue-router'; // Import useRoute if needed for default-active

const store = useAppStore();
const route = useRoute(); // Use route to set default active menu item
</script>

<style>
/* Basic global styles */
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa; /* Light background */
}

/* Adjust Element Plus table header background */
.el-table th {
  background-color: #f5f7fa !important;
}

/* Basic image slot for Element Plus Image component */
.el-image__error, .el-image__placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  color: #bfbfbf;
  vertical-align: middle;
  background: #f5f7fa;
}
</style>
