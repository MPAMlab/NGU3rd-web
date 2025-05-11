<template>
    <div class="home-view">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>欢迎来到 NGU3rd 比赛系统</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="总队伍数" :value="store.teams.length" />
          </el-col>
          <el-col :span="8">
             <el-statistic title="总选手数" :value="store.members.length" />
          </el-col>
           <el-col :span="8">
             <el-statistic title="总歌曲数" :value="store.songs.length" />
          </el-col>
        </el-row>
      </el-card>
  
      <el-card class="box-card" style="margin-top: 20px;">
         <template #header>
          <div class="card-header">
            <span>近期赛程</span>
             <el-button class="button" text @click="$router.push('/schedule')">查看全部</el-button>
          </div>
        </template>
        <el-table :data="upcomingMatches" v-loading="store.isLoading.tournamentMatches" style="width: 100%">
           <el-table-column prop="round_name" label="轮次" />
           <el-table-column label="队伍">
               <template #default="{ row }">
                   {{ row.team1_name }} vs {{ row.team2_name }}
               </template>
           </el-table-column>
           <el-table-column prop="scheduled_time" label="计划时间" width="180">
               <template #default="{ row }">
                   {{ row.scheduled_time ? new Date(row.scheduled_time).toLocaleString() : '待定' }}
               </template>
           </el-table-column>
           <el-table-column prop="status" label="状态" width="100">
               <template #default="{ row }">
                   <el-tag :type="matchStatusTagType(row.status)">{{ matchStatusText(row.status) }}</el-tag>
               </template>
           </el-table-column>
            <el-table-column label="操作" width="120">
                <template #default="{ row }">
                    <el-button
                        v-if="row.status === 'live' && row.match_do_id"
                        type="primary"
                        size="small"
                        @click="$router.push(`/live-match/${row.match_do_id}`)"
                    >
                        进入直播
                    </el-button>
                     <el-button
                         v-else-if="row.status !== 'completed' && row.status !== 'archived'"
                         type="info"
                         size="small"
                         disabled
                     >
                         待开始
                     </el-button>
                      <el-button
                         v-else
                         type="info"
                         size="small"
                         disabled
                     >
                         已结束
                     </el-button>
                </template>
            </el-table-column>
        </el-table>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useAppStore, type TournamentMatch } from '@/store';
  import { computed, onMounted } from 'vue';
  
  const store = useAppStore();
  
  // Fetch initial data on mount
  onMounted(() => {
    store.fetchTeams();
    store.fetchMembers();
    store.fetchSongs();
    store.fetchTournamentMatches();
  });
  
  // Computed property for upcoming matches (simple filter/sort)
  const upcomingMatches = computed(() => {
      return store.tournamentMatches
          .filter(match => match.status !== 'completed' && match.status !== 'archived')
          .sort((a, b) => {
              const timeA = a.scheduled_time ? new Date(a.scheduled_time).getTime() : Infinity;
              const timeB = b.scheduled_time ? new Date(b.scheduled_time).getTime() : Infinity;
              return timeA - timeB;
          })
          .slice(0, 5); // Show top 5 upcoming
  });
  
  // Helper for status tag type
  const matchStatusTagType = (status: TournamentMatch['status']) => {
      switch (status) {
          case 'live': return 'success';
          case 'ready_to_start': return 'warning';
          case 'scheduled':
          case 'pending_song_confirmation': return 'info';
          case 'completed':
          case 'archived': return 'info'; // Or 'success'/'danger' based on outcome if added
          default: return 'info';
      }
  };
  
  // Helper for status text
  const matchStatusText = (status: TournamentMatch['status']) => {
       switch (status) {
          case 'scheduled': return '已排程';
          case 'pending_song_confirmation': return '待确认歌单';
          case 'ready_to_start': return '准备就绪';
          case 'live': return '进行中';
          case 'completed': return '已完成';
          case 'archived': return '已归档';
          default: return '未知状态';
      }
  };
  
  </script>
  
  <style scoped>
  .home-view {
    max-width: 1200px;
    margin: 0 auto;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  </style>
  