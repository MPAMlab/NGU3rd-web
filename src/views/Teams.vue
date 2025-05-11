<template>
    <div class="teams-view">
      <el-card header="队伍列表" v-loading="store.isLoading.teams">
        <!-- TODO: Add "Add Team" button and dialog if backend supports -->
        <!-- <el-button type="primary" @click="openAddTeamDialog">添加队伍</el-button> -->
  
        <el-table :data="store.teams" style="width: 100%" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="code" label="队伍代码" width="120" />
          <el-table-column prop="name" label="队伍名称" />
          <el-table-column prop="current_health" label="当前血量" width="100" />
          <el-table-column label="拥有复影折镜" width="120">
              <template #default="{ row }">
                  <el-tag :type="row.has_revive_mirror ? 'success' : 'info'">
                      {{ row.has_revive_mirror ? '是' : '否' }}
                  </el-tag>
              </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/members?team_code=${row.code}`)">查看成员</el-button>
              <!-- TODO: Add Edit/Delete buttons if backend supports -->
              <!-- <el-button size="small" @click="handleEdit(row)">编辑</el-button> -->
              <!-- <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button> -->
            </template>
          </el-table-column>
        </el-table>
  
        <!-- TODO: Add Add/Edit Team Dialog -->
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore } from '@/store';
  import { onMounted } from 'vue';
  // import { ElMessage } from 'element-plus'; // Uncomment if using messages
  
  const store = useAppStore();
  
  onMounted(() => {
    store.fetchTeams();
  });
  
  // TODO: Implement dialog logic for add/edit if needed
  // const openAddTeamDialog = () => { /* ... */ };
  // const handleEdit = (team) => { /* ... */ };
  // const handleDelete = async (team) => {
  //   try {
  //     await store.deleteTeam(team.id);
  //     ElMessage.success('队伍删除成功');
  //   } catch (error) {
  //     ElMessage.error(`删除失败: ${error.message}`);
  //   }
  // };
  </script>
  
  <style scoped>
  .teams-view {
    max-width: 1200px;
    margin: 0 auto;
  }
  </style>
  