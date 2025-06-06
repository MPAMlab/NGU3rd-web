<!-- frontend/src/views/UserMatches.vue -->
<template>
    <div class="user-matches-view">
        <el-card header="我的比赛" v-loading="store.isLoading.userMatches">
            <div v-if="store.userMatches && store.userMatches.length > 0">
                <el-table :data="store.userMatches" style="width: 100%">
                    <el-table-column prop="round_name" label="轮次" width="120"></el-table-column>
                    <el-table-column label="对阵">
                        <template #default="{ row }">
                            {{ row.team1_name }} vs {{ row.team2_name }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="150">
                        <template #default="{ row }">
                            <el-tag :type="getMatchStatusTagType(row.status)">
                                {{ getMatchStatusText(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="时间" width="180">
                         <template #default="{ row }">
                             {{ row.scheduled_time ? formatDateTime(row.scheduled_time) : '待定' }}
                         </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150">
                        <template #default="{ row }">
                            <el-button
                                v-if="row.status === 'pending_song_confirmation'"
                                type="primary"
                                size="small"
                                @click="goToSongSelection(row.id)"
                            >
                                去选歌
                            </el-button>
                            <!-- 可以根据需要添加查看比赛详情或历史的按钮 -->
                            <!-- <el-button
                                v-else-if="row.status === 'completed'"
                                type="info"
                                size="small"
                                @click="viewMatchHistory(row.id)"
                            >
                                查看结果
                            </el-button> -->
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div v-else-if="!store.isLoading.userMatches">
                <el-empty description="您目前没有参与的比赛记录"></el-empty>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { useAppStore, type TournamentMatch } from '@/store';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const store = useAppStore();
const router = useRouter();

// --- Methods ---

const getMatchStatusTagType = (status: string) => {
    switch (status) {
        case 'pending_song_confirmation': return 'warning';
        case 'ready_to_start': return 'info';
        case 'in_progress': return 'primary';
        case 'completed': return 'success';
        case 'cancelled': return 'danger';
        default: return 'info';
    }
};

const getMatchStatusText = (status: string) => {
    switch (status) {
        case 'pending_song_confirmation': return '待选歌';
        case 'ready_to_start': return '待开始';
        case 'in_progress': return '进行中';
        case 'completed': return '已完成';
        case 'cancelled': return '已取消';
        case 'draw': return '平局'; // Assuming 'draw' is a possible status
        default: return status;
    }
};

const formatDateTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString(); // Format to local date and time string
    } catch (e) {
        console.error("Failed to format date:", isoString, e);
        return '无效日期';
    }
};


const goToSongSelection = (matchId: number) => {
    router.push({ name: 'MatchSongSelection', params: { matchId: matchId.toString() } });
};

// Optional: Method to view completed match history/results
// viewMatchHistory = (matchId: number) => {
//     // You might need a specific route for viewing past match results if the public /match-history isn't suitable
//     // For now, let's just log or show a message
//     ElMessage.info(`查看比赛 ${matchId} 的结果 (功能待实现)`);
// };


// --- Lifecycle Hooks ---
onMounted(() => {
    // Fetch user's matches when the component is mounted
    store.fetchUserMatches();
});
</script>

<style scoped>
.user-matches-view {
    max-width: 1000px;
    margin: 20px auto;
    padding: 20px;
}
</style>
