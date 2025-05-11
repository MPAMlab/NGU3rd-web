<template>
    <div class="match-history-view">
      <el-card header="比赛历史" v-loading="store.isLoading.matchHistory">
        <el-table :data="store.matchHistory" style="width: 100%" border stripe>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div style="padding: 20px;">
                <h4>回合详情</h4>
                <el-table :data="row.rounds" border stripe size="small">
                  <el-table-column type="index" label="#" width="50" />
                   <el-table-column label="歌曲" width="200">
                       <template #default="{ row: round }">
                           <div style="display: flex; align-items: center;">
                               <el-image
                                   v-if="round.fullCoverUrl"
                                   style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;"
                                   :src="round.fullCoverUrl"
                                   fit="cover"
                                   lazy
                               >
                                   <template #error>
                                       <div class="image-slot" style="width: 40px; height: 40px;">
                                           <el-icon><Picture /></el-icon>
                                       </div>
                                   </template>
                               </el-image>
                                <div v-else class="image-slot" style="width: 40px; height: 40px; margin-right: 10px;">
                                    <el-icon><Picture /></el-icon>
                                </div>
                               <div>
                                   <el-text>{{ round.song_title }}</el-text><br>
                                   <el-text type="info" size="small">{{ round.selected_difficulty }}</el-text>
                               </div>
                           </div>
                       </template>
                   </el-table-column>
                   <el-table-column label="选手" width="180">
                       <template #default="{ row: round }">
                           {{ round.team1_member_nickname }} vs {{ round.team2_member_nickname }}
                       </template>
                   </el-table-column>
                   <el-table-column label="百分比" width="150">
                       <template #default="{ row: round }">
                           A: {{ round.team1_percentage }}%<br>
                           B: {{ round.team2_percentage }}%
                       </template>
                   </el-table-column>
                   <el-table-column label="伤害" width="150">
                       <template #default="{ row: round }">
                           A: {{ round.team1_damage_dealt }}<br>
                           B: {{ round.team2_damage_dealt }}
                       </template>
                   </el-table-column>
                   <el-table-column label="血量变化" width="150">
                       <template #default="{ row: round }">
                           A: {{ round.team1_health_change }}<br>
                           B: {{ round.team2_health_change }}
                       </template>
                   </el-table-column>
                   <el-table-column label="赛后血量" width="150">
                       <template #default="{ row: round }">
                           A: {{ round.team1_health_after }}<br>
                           B: {{ round.team2_health_after }}
                       </template>
                   </el-table-column>
                   <el-table-column label="复影折镜" width="100">
                       <template #default="{ row: round }">
                           A: <el-tag :type="round.team1_mirror_triggered ? 'success' : 'info'" size="small">{{ round.team1_mirror_triggered ? '是' : '否' }}</el-tag><br>
                           B: <el-tag :type="round.team2_mirror_triggered ? 'success' : 'info'" size="small">{{ round.team2_mirror_triggered ? '是' : '否' }}</el-tag>
                       </template>
                   </el-table-column>
                   <el-table-column label="小分调整" width="100">
                       <template #default="{ row: round }">
                           A: {{ round.team1_effect_value }}<br>
                           B: {{ round.team2_effect_value }}
                       </template>
                   </el-table-column>
                   <el-table-column label="选曲方" width="150">
                       <template #default="{ row: round }">
                           {{ round.picker_member_nickname }} ({{ round.picker_team_name }})
                       </template>
                   </el-table-column>
                   <el-table-column label="加时赛" width="80">
                        <template #default="{ row: round }">
                           <el-tag :type="round.is_tiebreaker_song ? 'warning' : 'info'" size="small">{{ round.is_tiebreaker_song ? '是' : '否' }}</el-tag>
                       </template>
                   </el-table-column>
                   <!-- Optional: Column for viewing full round summary log -->
                   <!-- <el-table-column label="日志" width="80">
                       <template #default="{ row: round }">
                           <el-button v-if="round.round_summary?.log?.length > 0" size="small" @click="viewRoundLog(round.round_summary.log)">查看</el-button>
                           <span v-else>-</span>
                       </template>
                   </el-table-column> -->
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="round_name" label="轮次" />
          <el-table-column label="队伍">
              <template #default="{ row }">
                  {{ row.team1_name }} vs {{ row.team2_name }}
              </template>
          </el-table-column>
          <el-table-column label="获胜方" width="150">
               <template #default="{ row }">
                   {{ row.winner_team_name || '平局/未裁定' }}
               </template>
          </el-table-column>
           <el-table-column label="最终比分" width="120">
               <template #default="{ row }">
                   {{ row.final_score_team1 }} : {{ row.final_score_team2 }}
               </template>
           </el-table-column>
          <el-table-column prop="scheduled_time" label="计划时间" width="180">
              <template #default="{ row }">
                  {{ row.scheduled_time ? new Date(row.scheduled_time).toLocaleString() : '待定' }}
              </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
               <template #default="{ row }">
                   <el-tag :type="row.status === 'completed' ? 'success' : 'info'">
                       {{ row.status === 'completed' ? '已完成' : '已归档' }}
                   </el-tag>
               </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore } from '@/store';
  import { onMounted } from 'vue';
  // import { ElMessageBox } from 'element-plus'; // Uncomment if viewing logs
  
  const store = useAppStore();
  
  onMounted(() => {
    store.fetchMatchHistory();
  });
  
  // Optional: Function to view round log in a message box
  // const viewRoundLog = (log: string[]) => {
  //     ElMessageBox.alert(log.join('<br>'), '回合计算日志', {
  //         dangerouslyUseHTMLString: true,
  //         confirmButtonText: '确定',
  //     });
  // };
  </script>
  
  <style scoped>
  .match-history-view {
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
  