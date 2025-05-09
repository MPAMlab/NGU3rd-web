<!-- src/views/admin/live/LiveMatchControlPage.vue -->
<template>
    <div class="live-match-control-page">
      <button @click="goBackToList" class="text-gray-400 hover:underline mb-4 flex items-center">
          <img src="https://unpkg.com/lucide-static@latest/icons/arrow-left.svg" class="w-4 h-4 mr-1">
          返回赛程列表
      </button>
  
      <div v-if="liveMatchStore.isLoading || membersStore.isLoading" class="text-center text-gray-400">加载比赛状态...</div>
      <div v-else-if="liveMatchStore.error || membersStore.error" class="alert-danger">
        错误: {{ liveMatchStore.error || membersStore.error }}
      </div>
      <div v-else-if="!liveMatchStore.matchData" class="text-center text-gray-400">
          未找到比赛信息或 WebSocket 连接失败。请检查比赛ID。
          <button @click="retryConnect" class="btn-primary mt-4">重试连接</button>
      </div>
      <div v-else>
          <!-- Match Editing View (Main Content) -->
          <div v-if="liveMatchStore.matchData.status !== 'archived_in_d1'">
               <h2 class="text-2xl font-semibold mb-4">
                   编辑轮次：{{ liveMatchStore.matchData.teamA_name }} vs {{ liveMatchStore.matchData.teamB_name }}
               </h2>
  
               <!-- Status and Connection Info -->
               <div class="glass rounded-xl p-6 mb-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-l-4 border-purple-500">
                   <div class="flex items-center justify-between mb-4">
                       <h3 class="text-xl font-bold flex items-center">
                           <span :class="['inline-block w-3 h-3 rounded-full mr-2', liveMatchStore.websocketStatus === 'connected' ? 'bg-green-500 circle-pulse' : 'bg-red-500']"></span>
                           状态: {{ getMatchStatusText(liveMatchStore.matchData.status) }}
                       </h3>
                       <span class="text-sm bg-purple-600/50 px-3 py-1 rounded-full">
                           回合 {{ liveMatchStore.matchData.round }}
                       </span>
                   </div>
                   <p class="text-sm text-gray-400">WebSocket 连接状态: {{ liveMatchStore.websocketStatus }}</p>
                   <p v-if="liveMatchStore.websocketStatus === 'disconnected' || liveMatchStore.websocketStatus === 'error'" class="text-yellow-400 text-sm mt-2">
                       连接已断开，请检查Worker状态或网络。正在尝试重连...
                   </p>
               </div>
  
  
               <!-- Team Health and Players -->
               <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                   <!-- 队伍A -->
                   <div class="glass rounded-lg p-4">
                       <div class="flex justify-between items-center mb-4">
                           <h4 class="font-bold text-lg text-blue-400">{{ liveMatchStore.matchData.teamA_name }}</h4>
                           <div>
                               <span class="text-sm text-gray-400 mr-2">血量:</span>
                               <span class="text-xl font-bold">{{ liveMatchStore.matchData.teamA_score }}</span>
                           </div>
                       </div>
                       <div class="w-full h-3 health-bar-bg rounded-full mb-4">
                           <div class="h-full bg-blue-500 rounded-full health-bar" :style="{ width: teamAHealthPercentage + '%' }"></div>
                       </div>
                       <div class="grid grid-cols-3 gap-2">
                           <div
                               v-for="playerId in liveMatchStore.matchData.teamA_player_order"
                               :key="playerId"
                               :class="['glass rounded-lg p-2 flex flex-col items-center player-card', { 'current': liveMatchStore.matchData.teamA_current_player_id === playerId }]"
                           >
                               <img :src="getPlayerAvatar(playerId) || 'https://via.placeholder.com/40'" :alt="getPlayerNickname(playerId)" class="w-12 h-12 rounded-full mb-2 object-cover">
                               <p class="text-sm font-medium text-center">{{ getPlayerNickname(playerId) }}</p>
                               <p class="text-xs text-gray-300 text-center">{{ getPlayerProfession(playerId) }}</p>
                           </div>
                       </div>
                        <div class="mt-4 text-sm text-gray-400">复影折镜: <span :class="liveMatchStore.matchData.teamA_mirror_available ? 'text-green-400' : 'text-red-400'">{{ liveMatchStore.matchData.teamA_mirror_available ? '可用' : '已使用' }}</span></div>
                   </div>
  
                   <!-- 队伍B -->
                   <div class="glass rounded-lg p-4">
                       <div class="flex justify-between items-center mb-4">
                           <h4 class="font-bold text-lg text-red-400">{{ liveMatchStore.matchData.teamB_name }}</h4>
                            <div>
                               <span class="text-sm text-gray-400 mr-2">血量:</span>
                               <span class="text-xl font-bold">{{ liveMatchStore.matchData.teamB_score }}</span>
                           </div>
                       </div>
                       <div class="w-full h-3 health-bar-bg rounded-full mb-4">
                           <div class="h-full bg-red-500 rounded-full health-bar" :style="{ width: teamBHealthPercentage + '%' }"></div>
                       </div>
                       <div class="grid grid-cols-3 gap-2">
                           <div
                               v-for="playerId in liveMatchStore.matchData.teamB_player_order"
                               :key="playerId"
                               :class="['glass rounded-lg p-2 flex flex-col items-center player-card', { 'current': liveMatchStore.matchData.teamB_current_player_id === playerId }]"
                           >
                               <img :src="getPlayerAvatar(playerId) || 'https://via.placeholder.com/40'" :alt="getPlayerNickname(playerId)" class="w-12 h-12 rounded-full mb-2 object-cover">
                               <p class="text-sm font-medium text-center">{{ getPlayerNickname(playerId) }}</p>
                               <p class="text-xs text-gray-300 text-center">{{ getPlayerProfession(playerId) }}</p>
                           </div>
                       </div>
                        <div class="mt-4 text-sm text-gray-400">复影折镜: <span :class="liveMatchStore.matchData.teamB_mirror_available ? 'text-green-400' : 'text-red-400'">{{ liveMatchStore.matchData.teamB_mirror_available ? '可用' : '已使用' }}</span></div>
                   </div>
               </div>
  
               <!-- Current Song Info -->
               <div v-if="liveMatchStore.matchData.current_song" class="glass rounded-lg p-4 mb-6">
                   <h3 class="font-bold mb-4">当前歌曲</h3>
                   <div class="flex flex-col md:flex-row md:items-center gap-4">
                       <!-- Use correct properties from MatchSong -->
                       <img :src="liveMatchStore.matchData.current_song.coverUrl || 'https://via.placeholder.com/96x96'" alt="歌曲封面" class="w-24 h-24 rounded-lg object-cover">
                       <div class="flex-1">
                           <!-- Use correct properties from MatchSong -->
                           <h4 class="font-bold text-lg">{{ liveMatchStore.matchData.current_song.song_title }}</h4>
                           <div class="flex flex-wrap gap-2 mt-2">
                               <!-- Use correct properties from MatchSong -->
                               <span class="bg-yellow-500/30 text-yellow-300 text-xs px-2 py-1 rounded">难度: {{ liveMatchStore.matchData.current_song.song_difficulty }}</span>
                               <span :class="['text-xs px-2 py-1 rounded', getElementClass(liveMatchStore.matchData.current_song.song_element), getElementBgClass(liveMatchStore.matchData.current_song.song_element)]">
                                   属性: {{ getElementName(liveMatchStore.matchData.current_song.song_element) }}
                               </span>
                               <!-- Use correct properties from MatchSong -->
                               <span class="bg-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded">{{ getTeamName(liveMatchStore.matchData.current_song.picker_team_id) }} 选择</span>
                           </div>
                       </div>
                        <!-- Add Random Song Button (if applicable based on game rules) -->
                        <!-- <div class="md:flex-shrink-0">
                           <button class="glass px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition flex items-center">
                               <img src="https://unpkg.com/lucide-static@latest/icons/plus.svg" class="w-4 h-4 mr-1">
                               添加随机歌曲
                           </button>
                       </div> -->
                   </div>
               </div>
                <div v-else class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0 h-32">
                   <p class="text-gray-400">等待歌曲信息...</p>
               </div>
  
  
               <!-- Record Score Section -->
               <div v-if="liveMatchStore.matchData.status === 'ongoing'" class="glass rounded-lg p-6 mb-6">
                   <h3 class="font-bold mb-4">记录当前对战选手成绩</h3>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <!-- 队伍A当前选手成绩 -->
                       <div>
                           <h4 class="font-medium mb-3 text-blue-400">{{ liveMatchStore.matchData.teamA_current_player_name || '选手 A' }}</h4>
                           <div class="space-y-3">
                               <div class="flex items-center space-x-3">
                                   <img :src="getPlayerAvatar(liveMatchStore.matchData.teamA_current_player_id) || 'https://via.placeholder.com/40'" alt="队员头像" class="w-10 h-10 rounded-full object-cover">
                                   <div class="flex-1">
                                       <label :for="`score-a-${liveMatchStore.matchData.round}`" class="block text-xs text-gray-400 mb-1">完成率小数点后四位 (0000-9999)</label>
                                       <input
                                           type="number"
                                           :id="`score-a-${liveMatchStore.matchData.round}`"
                                           v-model.number="scoreA"
                                           class="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass"
                                           placeholder="输入 0000-9999"
                                           min="0"
                                           max="9999"
                                           step="1"
                                       >
                                   </div>
                               </div>
                                <div class="flex items-center space-x-3">
                                   <img src="https://unpkg.com/lucide-static@latest/icons/heart.svg" class="w-10 h-10 text-red-400 p-2 glass rounded-full">
                                   <div class="flex-1">
                                       <label :for="`effect-a-${liveMatchStore.matchData.round}`" class="block text-xs text-gray-400 mb-1">特殊效果血量调整 (+/-)</label>
                                       <input
                                           type="number"
                                           :id="`effect-a-${liveMatchStore.matchData.round}`"
                                           v-model.number="effectA"
                                           class="w-full bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass"
                                           placeholder="输入数值 (e.g., -10, +5)"
                                       >
                                   </div>
                               </div>
                           </div>
                       </div>
  
                       <!-- 队伍B当前选手成绩 -->
                       <div>
                           <h4 class="font-medium mb-3 text-red-400">{{ liveMatchStore.matchData.teamB_current_player_name || '选手 B' }}</h4>
                            <div class="space-y-3">
                               <div class="flex items-center space-x-3">
                                   <img :src="getPlayerAvatar(liveMatchStore.matchData.teamB_current_player_id) || 'https://via.placeholder.com/40'" alt="队员头像" class="w-10 h-10 rounded-full object-cover">
                                   <div class="flex-1">
                                        <label :for="`score-b-${liveMatchStore.matchData.round}`" class="block text-xs text-gray-400 mb-1">完成率小数点后四位 (0000-9999)</label>
                                       <input
                                           type="number"
                                           :id="`score-b-${liveMatchStore.matchData.round}`"
                                           v-model.number="scoreB"
                                           class="w-full mt-1 bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass"
                                           placeholder="输入 0000-9999"
                                           min="0"
                                           max="9999"
                                           step="1"
                                       >
                                   </div>
                               </div>
                                <div class="flex items-center space-x-3">
                                    <img src="https://unpkg.com/lucide-static@latest/icons/heart.svg" class="w-10 h-10 text-red-400 p-2 glass rounded-full">
                                   <div class="flex-1">
                                         <label :for="`effect-b-${liveMatchStore.matchData.round}`" class="block text-xs text-gray-400 mb-1">特殊效果血量调整 (+/-)</label>
                                       <input
                                           type="number"
                                           :id="`effect-b-${liveMatchStore.matchData.round}`"
                                           v-model.number="effectB"
                                           class="w-full mt-1 bg-black/20 border border-white/20 rounded px-3 py-2 text-sm input-glass"
                                           placeholder="输入数值 (e.g., -10, +5)"
                                       >
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
                   <div class="flex justify-center mt-6">
                       <button @click="submitScores" class="btn-primary" :disabled="!isScoreInputValid || liveMatchStore.isLoading">
                           {{ liveMatchStore.isLoading ? '计算中...' : '提交成绩并计算伤害' }}
                       </button>
                   </div>
               </div>
  
               <!-- Round Summary / Next Action Section -->
               <div v-if="liveMatchStore.matchData.status === 'round_finished' || liveMatchStore.matchData.status === 'draw_pending_resolution'" class="glass rounded-lg p-6 mb-6">
                   <h3 class="font-bold mb-4">本轮结果</h3>
                   <div v-if="liveMatchStore.lastRoundSummary">
                       <p class="text-gray-300 mb-4">回合 {{ liveMatchStore.lastRoundSummary.round }} 总结:</p>
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                           <div>
                               <p class="font-medium text-blue-400">{{ getPlayerNickname(liveMatchStore.lastRoundSummary.teamA_player_id) }} ({{ liveMatchStore.matchData.teamA_name }})</p>
                               <p>完成率: {{ liveMatchStore.lastRoundSummary.teamA_percentage.toFixed(4) }}%</p>
                               <p>伤害数字: [{{ liveMatchStore.lastRoundSummary.teamA_damage_digits.join(', ') }}]</p>
                               <p>最终伤害: {{ liveMatchStore.lastRoundSummary.teamA_final_damage_dealt }}</p>
                               <p>血量变化: {{ liveMatchStore.lastRoundSummary.teamA_score_change > 0 ? '+' : '' }}{{ liveMatchStore.lastRoundSummary.teamA_score_change }}</p>
                               <p v-if="liveMatchStore.lastRoundSummary.teamA_mirror_triggered" class="text-yellow-400">复影折镜触发！</p>
                           </div>
                            <div>
                               <p class="font-medium text-red-400">{{ getPlayerNickname(liveMatchStore.lastRoundSummary.teamB_player_id) }} ({{ liveMatchStore.matchData.teamB_name }})</p>
                               <p>完成率: {{ liveMatchStore.lastRoundSummary.teamB_percentage.toFixed(4) }}%</p>
                               <p>伤害数字: [{{ liveMatchStore.lastRoundSummary.teamB_damage_digits.join(', ') }}]</p>
                               <p>最终伤害: {{ liveMatchStore.lastRoundSummary.teamB_final_damage_dealt }}</p>
                               <p>血量变化: {{ liveMatchStore.lastRoundSummary.teamB_score_change > 0 ? '+' : '' }}{{ liveMatchStore.lastRoundSummary.teamB_score_change }}</p>
                               <p v-if="liveMatchStore.lastRoundSummary.teamB_mirror_triggered" class="text-yellow-400">复影折镜触发！</p>
                           </div>
                       </div>
                       <div v-if="liveMatchStore.lastRoundSummary.log && liveMatchStore.lastRoundSummary.log.length > 0">
                           <p class="font-medium text-gray-300 mb-2">日志:</p>
                           <ul class="list-disc list-inside text-sm text-gray-400">
                               <li v-for="(log, index) in liveMatchStore.lastRoundSummary.log" :key="index">{{ log }}</li>
                           </ul>
                       </div>
                   </div>
                   <div v-else class="text-center text-gray-400">没有本轮总结数据。</div>
  
                   <div class="flex justify-center mt-6 space-x-4">
                       <button
                           v-if="liveMatchStore.matchData.status === 'round_finished'"
                           @click="nextRound"
                           class="btn-primary flex items-center"
                           :disabled="liveMatchStore.isLoading"
                       >
                           {{ liveMatchStore.isLoading ? '加载中...' : '下一小轮' }}
                           <img src="https://unpkg.com/lucide-static@latest/icons/arrow-right.svg" class="w-5 h-5 ml-2">
                       </button>
                        <template v-if="liveMatchStore.matchData.status === 'draw_pending_resolution'">
                           <button @click="resolveDraw(liveMatchStore.matchData.teamA_id)" class="btn-primary flex items-center" :disabled="liveMatchStore.isLoading">
                               {{ liveMatchStore.isLoading ? '判决中...' : `判 ${liveMatchStore.matchData.teamA_name} 胜` }}
                           </button>
                            <button @click="resolveDraw(liveMatchStore.matchData.teamB_id)" class="btn-primary flex items-center" :disabled="liveMatchStore.isLoading">
                               {{ liveMatchStore.isLoading ? '判决中...' : `判 ${liveMatchStore.matchData.teamB_name} 胜` }}
                           </button>
                        </template>
                   </div>
               </div>
  
               <!-- Match End / Archive Button -->
               <div v-if="liveMatchStore.matchData.status === 'team_A_wins' || liveMatchStore.matchData.status === 'team_B_wins'" class="glass rounded-lg p-6 mb-6 text-center">
                   <h3 class="text-2xl font-bold mb-4">比赛结束！</h3>
                   <p class="text-xl mb-6">获胜队伍：<span class="text-green-400">{{ liveMatchStore.matchData.status === 'team_A_wins' ? liveMatchStore.matchData.teamA_name : liveMatchStore.matchData.teamB_name }}</span></p>
                   <button @click="archiveMatch" class="bg-red-600 hover:bg-red-700 transition px-8 py-3 rounded-lg font-medium flex items-center justify-center mx-auto" :disabled="liveMatchStore.isLoading">
                       {{ liveMatchStore.isLoading ? '归档中...' : '归档比赛' }}
                       <img src="https://unpkg.com/lucide-static@latest/icons/archive.svg" class="w-5 h-5 ml-2">
                   </button>
               </div>
  
          </div>
           <!-- Archived State View -->
           <div v-else class="glass rounded-lg p-6 text-center">
               <h2 class="text-2xl font-bold mb-4">比赛已归档</h2>
               <p class="text-xl text-gray-400">这场比赛已经结束并已归档到历史记录中。</p>
               <!-- Optional: Link to match history page -->
               <!-- <router-link to="/admin/match-history" class="btn-primary mt-6 inline-block">查看比赛历史</router-link> -->
           </div>
  
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useLiveMatchStore } from '@/stores/liveMatch';
  import { useMembersStore } from '@/stores/members'; // To get player details
  import type { CalculateRoundPayload, Member, MatchState } from '@/types';
  
  const route = useRoute();
  const router = useRouter();
  const liveMatchStore = useLiveMatchStore();
  const membersStore = useMembersStore(); // Use members store
  
  const doIdString = route.params.doIdString as string;
  
  // Input states for score and effect
  const scoreA = ref<number | null>(null);
  const effectA = ref<number | null>(null);
  const scoreB = ref<number | null>(null);
  const effectB = ref<number | null>(null);
  
  // Computed properties for health bar width
  const INITIAL_HEALTH = 100; // Must match backend DO constant
  
  const teamAHealthPercentage = computed(() => {
    if (liveMatchStore.matchData) {
      return Math.max(0, Math.min(100, (liveMatchStore.matchData.teamA_score / INITIAL_HEALTH) * 100));
    }
    return 0;
  });
  
  const teamBHealthPercentage = computed(() => {
    if (liveMatchStore.matchData) {
      return Math.max(0, Math.min(100, (liveMatchStore.matchData.teamB_score / INITIAL_HEALTH) * 100));
    }
    return 0;
  });
  
  // Computed property to check if score inputs are valid for submission
  const isScoreInputValid = computed(() => {
      // Check if both scores are numbers and within the 0-9999 range
      const scoreAValid = scoreA.value !== null && !isNaN(scoreA.value) && scoreA.value >= 0 && scoreA.value <= 9999;
      const scoreBValid = scoreB.value !== null && !isNaN(scoreB.value) && scoreB.value >= 0 && scoreB.value <= 9999;
  
      // Effect values can be null or any number
      const effectAValid = effectA.value === null || !isNaN(effectA.value);
      const effectBValid = effectB.value === null || !isNaN(effectB.value);
  
      return scoreAValid && scoreBValid && effectAValid && effectBValid;
  });
  
  
  // Helper to get player details from members store
  const getPlayerNickname = (playerId: string | null) => {
      if (!playerId) return '未知选手';
      const member = membersStore.getMemberById(playerId);
      return member ? member.nickname : '未知选手';
  };
  
  const getPlayerAvatar = (playerId: string | null) => {
       if (!playerId) return 'https://via.placeholder.com/40';
      const member = membersStore.getMemberById(playerId);
      return member?.avatarUrl || 'https://via.placeholder.com/40';
  };
  
  const getPlayerProfession = (playerId: string | null) => {
       if (!playerId) return '未知职业';
      const member = membersStore.getMemberById(playerId);
      return member?.profession || '未知职业';
  };
  
  const getElementName = (element: Member['element']) => {
      switch (element) {
          case 'fire': return '火';
          case 'wood': return '木';
          case 'water': return '水';
          default: return '未知';
      }
  };
  
  const getElementClass = (element: Member['element']) => {
       switch (element) {
          case 'fire': return 'text-red-400';
          case 'wood': return 'text-green-400';
          case 'water': return 'text-blue-400';
          default: return 'text-gray-400';
      }
  };
  
  const getElementBgClass = (element: Member['element']) => {
       switch (element) {
          case 'fire': return 'bg-red-500/30';
          case 'wood': return 'bg-green-500/30';
          case 'water': return 'bg-blue-500/30';
          default: return 'bg-gray-500/30';
      }
  };
  
  // Helper to get team name from matchData (which has denormalized names)
  const getTeamName = (teamId?: string) => {
       if (!teamId || !liveMatchStore.matchData) return '未知队伍';
       if (teamId === liveMatchStore.matchData.teamA_id) return liveMatchStore.matchData.teamA_name;
       if (teamId === liveMatchStore.matchData.teamB_id) return liveMatchStore.matchData.teamB_name;
       return '未知队伍';
  };
  
  
  const getMatchStatusText = (status: MatchState['status']) => {
      switch (status) {
          case 'pending': return '等待选手操作';
          case 'ongoing': return '进行中';
          case 'round_finished': return '本轮结束';
          case 'team_A_wins': return `${liveMatchStore.matchData?.teamA_name || '队伍A'} 胜利`;
          case 'team_B_wins': return `${liveMatchStore.matchData?.teamB_name || '队伍B'} 胜利`;
          case 'draw_pending_resolution': return '平局，等待判决';
          case 'archived_in_d1': return '已归档';
          default: return '未知状态';
      }
  };
  
  
  // --- Actions ---
  const submitScores = async () => {
      if (!isScoreInputValid.value || !liveMatchStore.currentDoId) {
          alert("请检查完成率输入是否正确 (0-9999)。");
          return;
      }
  
      // Use the decimal percentage values from the inputs
      const payload: CalculateRoundPayload = {
          teamA_decimal_percentage: scoreA.value !== null ? scoreA.value : 0,
          teamB_decimal_percentage: scoreB.value !== null ? scoreB.value : 0,
          teamA_effect_value: effectA.value !== null ? effectA.value : undefined,
          teamB_effect_value: effectB.value !== null ? effectB.value : undefined,
      };
  
      try {
          await liveMatchStore.calculateRound(payload);
          // State will update via WebSocket
          // Clear inputs after successful submission
          scoreA.value = null;
          effectA.value = null;
          scoreB.value = null;
          effectB.value = null;
      } catch (e) {
          // Error is handled by the store and displayed via liveMatchStore.error
          console.error("Submit scores failed:", e);
      }
  };
  
  const nextRound = async () => {
       if (!liveMatchStore.currentDoId) return;
       try {
           await liveMatchStore.nextRound();
           // State will update via WebSocket
       } catch (e) {
           console.error("Next round failed:", e);
       }
  };
  
  const resolveDraw = async (winnerTeamId: string) => {
       if (!liveMatchStore.currentDoId) return;
       try {
           await liveMatchStore.resolveDraw(winnerTeamId);
           // State will update via WebSocket
       } catch (e) {
           console.error("Resolve draw failed:", e);
       }
  };
  
  const archiveMatch = async () => {
       if (!liveMatchStore.currentDoId) return;
       if (confirm('确定要归档这场比赛吗？归档后将无法继续编辑。')) {
           try {
               await liveMatchStore.archiveMatch();
               // Store action handles disconnect and potentially navigation
               router.push('/admin/match-history'); // Navigate to history after archiving
           } catch (e) {
               console.error("Archive match failed:", e);
           }
       }
  };
  
  const goBackToList = () => {
      // Disconnect WebSocket before navigating away
      liveMatchStore.disconnect();
      router.push('/admin/schedule');
  };
  
  const retryConnect = () => {
      if (doIdString) {
          liveMatchStore.connect(doIdString);
      }
  };
  
  
  // --- Lifecycle Hooks ---
  onMounted(() => {
    if (doIdString) {
      liveMatchStore.connect(doIdString);
      // Also load members store if not already loaded, needed for player details
      if (membersStore.members.length === 0) {
          membersStore.loadMembers();
      }
    } else {
      liveMatchStore.error = "No match ID provided in the URL.";
    }
  });
  
  onUnmounted(() => {
    // Disconnect WebSocket when leaving the page
    liveMatchStore.disconnect();
  });
  
  // Watch for route changes (e.g., if user manually changes doIdString in URL)
  watch(() => route.params.doIdString, (newDoId) => {
      if (newDoId && typeof newDoId === 'string' && newDoId !== liveMatchStore.currentDoId) {
          console.log("Route DO ID changed, reconnecting...");
          liveMatchStore.disconnect(); // Disconnect old connection
          liveMatchStore.connect(newDoId); // Connect to new DO ID
      } else if (!newDoId) {
           liveMatchStore.disconnect();
           liveMatchStore.error = "No match ID provided in the URL.";
      }
  });
  
  </script>
  
  <style scoped>
  /* Scoped styles for the live match control page */
  /* glass, input-glass, btn-primary, btn-secondary, health-bar-bg, player-card, current, circle-pulse, alert-danger are in main.css */
  </style>
  