<!-- src/views/LiveDisplayPage.vue -->
<template>
    <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <!-- Portrait Warning -->
      <div class="portrait-warning">
          <div class="text-center">
              <img src="https://unpkg.com/lucide-static@latest/icons/smartphone-rotate.svg" class="w-16 h-16 mx-auto mb-4 text-white">
              <h2 class="text-2xl font-bold mb-2">请旋转设备</h2>
              <p class="text-gray-300">为获得最佳观看体验，请将设备横向放置</p>
          </div>
      </div>
  
      <!-- Live Content -->
      <div v-if="liveDisplayStore.isLoading || membersStore.isLoading || tournamentStore.isLoading" class="text-2xl">正在加载比赛信息...</div>
      <div v-else-if="liveDisplayStore.error || membersStore.error || tournamentStore.error" class="text-2xl text-red-500">错误: {{ liveDisplayStore.error || membersStore.error || tournamentStore.error }}</div>
      <div v-else-if="!liveDisplayStore.matchData" class="text-2xl text-gray-500">
        暂无比赛信息或指定的比赛ID无效。
        <p class="text-base text-gray-400 mt-2">请确保URL中的比赛ID正确。</p>
      </div>
      <div v-else class="live-container view-transition w-full h-full absolute inset-0 flex items-center justify-center">
          <div class="obs-capture-area">
              <!-- Top Info Bar -->
              <div class="glass flex items-center justify-between px-4 py-2 flex-shrink-0">
                  <div class="flex items-center space-x-3">
                      <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Z2FtZSUyMGxvZ298ZW58MHx8MHx8fDA%3D" alt="NGU3rd Logo" class="h-8 w-8 rounded-full">
                      <span class="font-bold text-lg">NGU3rd</span>
                  </div>
                  <div class="flex items-center space-x-2">
                      <span class="live-indicator bg-red-500 text-xs px-2 py-0.5 rounded-full">LIVE</span>
                  </div>
                  <div class="flex items-center space-x-2">
                      <!-- Use tournamentMatch to get roundName -->
                      <span class="text-sm font-medium">{{ tournamentMatch?.roundName || '比赛轮次' }} - 第{{ liveDisplayStore.matchData.round }}轮</span>
                  </div>
              </div>
  
              <!-- Main Content Area -->
              <div class="main-content-flex p-4 space-x-4">
                  <!-- Left Panel (Team A) -->
                  <div class="w-1/4 flex flex-col space-y-4 pr-2">
                      <!-- Team Roster (Team A) -->
                      <div class="glass rounded-lg p-4 flex-shrink-0">
                          <h3 class="text-lg font-bold mb-3 text-blue-400">{{ liveDisplayStore.matchData.teamA_name }}</h3>
                          <div class="space-y-3">
                              <div
                                  v-for="playerId in liveDisplayStore.matchData.teamA_player_order"
                                  :key="playerId"
                                  class="flex items-center space-x-3"
                              >
                                  <img :src="getPlayerAvatar(playerId) || 'https://via.placeholder.com/40'" :alt="getPlayerNickname(playerId)" class="w-8 h-8 rounded-full object-cover">
                                  <div class="flex items-center justify-between flex-grow">
                                      <p class="font-medium text-sm">{{ getPlayerNickname(playerId) }}</p>
                                      <div class="flex items-center">
                                          <span :class="['text-xs mr-2', getElementClass(getPlayerElement(playerId))]">{{ getPlayerElement(playerId) ? `${getElementName(getPlayerElement(playerId))} (${getElementInitial(getPlayerElement(playerId))})` : '未知元素' }}</span>
                                          <span class="text-xs">{{ getPlayerProfession(playerId) }}</span>
                                          <span v-if="liveDisplayStore.matchData.teamA_current_player_id === playerId" class="current-player-badge bg-blue-500"></span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
  
                      <!-- Health Display (Team A) -->
                      <div class="glass rounded-lg p-4 flex-shrink-0">
                          <div class="flex justify-between items-center mb-2">
                              <h4 class="font-medium">队伍血量</h4>
                              <span class="text-blue-400 font-bold">{{ liveDisplayStore.matchData.teamA_score }}</span>
                          </div>
                          <div class="health-bar">
                              <div class="health-fill-team1" :style="{ width: teamAHealthPercentage + '%' }"></div>
                          </div>
                          <div class="flex justify-between items-center mt-2">
                              <span class="text-xs text-gray-300">复影折镜状态:</span>
                              <span :class="['text-xs', liveDisplayStore.matchData.teamA_mirror_available ? 'text-green-400' : 'text-red-400']">{{ liveDisplayStore.matchData.teamA_mirror_available ? '可用' : '已使用' }}</span>
                          </div>
                      </div>
  
                      <!-- Machine Info Cam (Team A) - Placeholder -->
                      <div class="camera-feed-vertical glass overflow-hidden relative flex-grow">
                           <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="机台信息板" class="w-full h-full object-cover">
                          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p class="text-xs font-medium">{{ liveDisplayStore.matchData.teamA_name }} - 机台信息</p>
                          </div>
                      </div>
  
                      <!-- Sponsor Logo (Left) - Placeholder -->
                      <div class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1563906267088-b029e7101114?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="赞助商Logo" class="h-12 max-w-full object-contain">
                      </div>
                  </div>
  
                  <!-- Middle Panel -->
                  <div class="flex-1 flex flex-col space-y-4 px-2">
                      <!-- Current Song Info -->
                      <div v-if="liveDisplayStore.matchData.current_song" class="glass rounded-lg p-4 flex items-center justify-between flex-shrink-0">
                          <div class="flex items-center space-x-4">
                              <!-- Use correct properties from MatchSong -->
                              <img :src="liveDisplayStore.matchData.current_song.coverUrl || 'https://via.placeholder.com/60x60'" alt="Current Song" class="w-12 h-12 rounded object-cover">
                              <div>
                                  <!-- Use correct properties from MatchSong -->
                                  <h3 class="font-bold text-base">{{ liveDisplayStore.matchData.current_song.song_title }}</h3>
                                  <p class="text-xs text-gray-300">
                                      <!-- Use correct properties from MatchSong -->
                                      难度: {{ liveDisplayStore.matchData.current_song.song_difficulty }} |
                                      BPM: {{ liveDisplayStore.matchData.current_song.bpm || 'N/A' }} |
                                      <!-- Use picker_team_id from MatchSong -->
                                      <span :class="[liveDisplayStore.matchData.current_song.picker_team_id === liveDisplayStore.matchData.teamA_id ? 'text-blue-400' : 'text-red-400', 'font-medium']">
                                          {{ getTeamName(liveDisplayStore.matchData.current_song.picker_team_id) }} 选曲
                                      </span>
                                  </p>
                              </div>
                          </div>
                      </div>
                       <div v-else class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0 h-20">
                           <p class="text-gray-400">等待歌曲信息...</p>
                       </div>
  
  
                      <!-- Player Camera Feeds (Middle) - Placeholder -->
                      <div class="flex space-x-4 flex-grow items-center justify-center">
                          <div class="camera-feed-vertical glass overflow-hidden relative h-full" style="width: calc(50% - 8px);">
                              <img src="https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${liveDisplayStore.matchData.teamA_name} 摄像头`" class="w-full h-full object-cover">
                              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                  <p class="text-sm font-medium">{{ liveDisplayStore.matchData.teamA_name }} 视角</p>
                              </div>
                          </div>
                          <div class="camera-feed-vertical glass overflow-hidden relative h-full" style="width: calc(50% - 8px);">
                              <img src="https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${liveDisplayStore.matchData.teamB_name} 摄像头`" class="w-full h-full object-cover">
                              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                  <p class="text-sm font-medium">{{ liveDisplayStore.matchData.teamB_name }} 视角</p>
                              </div>
                          </div>
                      </div>
                  </div>
  
                  <!-- Right Panel (Team B) -->
                  <div class="w-1/4 flex flex-col space-y-4 pl-2">
                      <!-- Team Roster (Team B) -->
                      <div class="glass rounded-lg p-4 flex-shrink-0">
                          <h3 class="text-lg font-bold mb-3 text-red-400">{{ liveDisplayStore.matchData.teamB_name }}</h3>
                          <div class="space-y-3">
                               <div
                                  v-for="playerId in liveDisplayStore.matchData.teamB_player_order"
                                  :key="playerId"
                                  class="flex items-center space-x-3"
                              >
                                  <img :src="getPlayerAvatar(playerId) || 'https://via.placeholder.com/40'" :alt="getPlayerNickname(playerId)" class="w-8 h-8 rounded-full object-cover">
                                  <div class="flex items-center justify-between flex-grow">
                                      <p class="font-medium text-sm">{{ getPlayerNickname(playerId) }}</p>
                                      <div class="flex items-center">
                                          <span :class="['text-xs mr-2', getElementClass(getPlayerElement(playerId))]">{{ getPlayerElement(playerId) ? `${getElementName(getPlayerElement(playerId))} (${getElementInitial(getPlayerElement(playerId))})` : '未知元素' }}</span>
                                          <span class="text-xs">{{ getPlayerProfession(playerId) }}</span>
                                          <span v-if="liveDisplayStore.matchData.teamB_current_player_id === playerId" class="current-player-badge bg-red-500"></span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
  
                      <!-- Health Display (Team B) -->
                      <div class="glass rounded-lg p-4 flex-shrink-0">
                          <div class="flex justify-between items-center mb-2">
                              <h4 class="font-medium">队伍血量</h4>
                              <span class="text-red-400 font-bold">{{ liveDisplayStore.matchData.teamB_score }}</span>
                          </div>
                          <div class="health-bar">
                              <div class="health-fill-team2" :style="{ width: teamBHealthPercentage + '%' }"></div>
                          </div>
                          <div class="flex justify-between items-center mt-2">
                              <span class="text-xs text-gray-300">复影折镜状态:</span>
                              <span :class="['text-xs', liveDisplayStore.matchData.teamB_mirror_available ? 'text-green-400' : 'text-red-400']">{{ liveDisplayStore.matchData.teamB_mirror_available ? '可用' : '已使用' }}</span>
                          </div>
                      </div>
  
                      <!-- Machine Info Cam (Team B) - Placeholder -->
                      <div class="camera-feed-vertical glass overflow-hidden relative flex-grow">
                          <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" :alt="`${liveDisplayStore.matchData.teamB_name} - 机台信息板`" class="w-full h-full object-cover">
                          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p class="text-xs font-medium">{{ liveDisplayStore.matchData.teamB_name }} - 机台信息</p>
                          </div>
                      </div>
  
                      <!-- Sponsor Logo (Right) - Placeholder -->
                      <div class="glass rounded-lg p-4 flex items-center justify-center flex-shrink-0">
                           <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="赞助商Logo" class="h-12 max-w-full object-contain">
                      </div>
                  </div>
              </div>
          </div>
      </div>
  
      <!-- Results Page Overlay -->
      <div
          v-if="liveDisplayStore.matchData && (liveDisplayStore.matchData.status === 'round_finished' || liveDisplayStore.matchData.status === 'team_A_wins' || liveDisplayStore.matchData.status === 'team_B_wins' || liveDisplayStore.matchData.status === 'draw_pending_resolution')"
          class="results-overlay view-transition"
          :style="{ opacity: showResultsOverlay ? 1 : 0, display: showResultsOverlay ? 'flex' : 'none' }"
      >
          <div class="results-content glass rounded-xl p-8">
              <!-- Header -->
              <div class="text-center mb-8">
                  <h2 class="text-3xl font-bold mb-2">
                      {{ liveDisplayStore.matchData.status === 'round_finished' ? '轮次结束' : liveDisplayStore.matchData.status === 'draw_pending_resolution' ? '平局' : '比赛结束' }}
                  </h2>
                   <!-- Use tournamentMatch to get roundName -->
                  <p class="text-gray-300">{{ tournamentMatch?.roundName || '比赛轮次' }} - 第{{ liveDisplayStore.matchData.round }}轮</p>
              </div>
  
              <!-- Winner/Status Animation -->
              <div class="winner-animation flex flex-col items-center mb-8 flex-grow justify-center">
                   <template v-if="liveDisplayStore.matchData.status === 'team_A_wins' || liveDisplayStore.matchData.status === 'team_B_wins'">
                       <div :class="['text-xl font-bold mb-2', liveDisplayStore.matchData.status === 'team_A_wins' ? 'text-blue-400' : 'text-red-400']">获胜队伍</div>
                       <div class="text-3xl font-bold mb-8">{{ liveDisplayStore.matchData.status === 'team_A_wins' ? liveDisplayStore.matchData.teamA_name : liveDisplayStore.matchData.teamB_name }}</div>
                       <!-- Display winning team players (if available in state) -->
                       <div class="flex space-x-8">
                           <img
                               v-for="playerId in (liveDisplayStore.matchData.status === 'team_A_wins' ? liveDisplayStore.matchData.teamA_player_order : liveDisplayStore.matchData.teamB_player_order)"
                               :key="playerId"
                               :src="getPlayerAvatar(playerId) || 'https://via.placeholder.com/96'"
                               :alt="getPlayerNickname(playerId)"
                               class="w-24 h-24 rounded-full object-cover"
                           >
                       </div>
                   </template>
                   <template v-else-if="liveDisplayStore.matchData.status === 'draw_pending_resolution'">
                       <div class="text-xl font-bold mb-2 text-yellow-400">平局</div>
                       <div class="text-3xl font-bold mb-8">等待裁判判决</div>
                       <!-- Display both teams' players or a relevant graphic -->
                   </template>
                   <template v-else-if="liveDisplayStore.matchData.status === 'round_finished'">
                       <div class="text-xl font-bold mb-2 text-gray-400">本轮结束</div>
                       <div class="text-3xl font-bold mb-8">等待下一轮</div>
                       <!-- Display current players or a relevant graphic -->
                   </template>
              </div>
  
              <!-- Team Stats -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 flex-shrink-0">
                  <div class="glass rounded-lg p-4">
                      <h3 class="text-xl font-bold text-blue-400 mb-4">{{ liveDisplayStore.matchData.teamA_name }}</h3>
                      <div class="space-y-2">
                          <div class="flex justify-between">
                              <span>最终血量</span>
                              <span class="font-bold">{{ liveDisplayStore.matchData.teamA_score }}</span>
                          </div>
                          <!-- Add more stats from roundSummary if available and relevant for display -->
                           <div v-if="liveDisplayStore.matchData.roundSummary">
                               <div class="flex justify-between">
                                   <span>本轮伤害输出</span>
                                   <span class="font-bold">{{ liveDisplayStore.matchData.roundSummary.teamA_final_damage_dealt }}</span>
                               </div>
                                <div class="flex justify-between">
                                   <span>复影折镜</span>
                                   <span class="font-bold">{{ liveDisplayStore.matchData.roundSummary.teamA_mirror_triggered ? '触发' : '未触发' }}</span>
                               </div>
                           </div>
                      </div>
                  </div>
  
                  <div class="glass rounded-lg p-4">
                      <h3 class="text-xl font-bold text-red-400 mb-4">{{ liveDisplayStore.matchData.teamB_name }}</h3>
                      <div class="space-y-2">
                          <div class="flex justify-between">
                              <span>最终血量</span>
                              <span class="font-bold">{{ liveDisplayStore.matchData.teamB_score }}</span>
                          </div>
                           <div v-if="liveDisplayStore.matchData.roundSummary">
                               <div class="flex justify-between">
                                   <span>本轮伤害输出</span>
                                   <span class="font-bold">{{ liveDisplayStore.matchData.roundSummary.teamB_final_damage_dealt }}</span>
                               </div>
                                <div class="flex justify-between">
                                   <span>复影折镜</span>
                                   <span class="font-bold">{{ liveDisplayStore.matchData.roundSummary.teamB_mirror_triggered ? '触发' : '未触发' }}</span>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useLiveDisplayStore } from '@/stores/liveDisplay';
  import { useMembersStore } from '@/stores/members'; // To get player details
  import { useTournamentStore } from '@/stores/tournament'; // To get match details like roundName
  import type { Member, TournamentMatch } from '@/types';
  
  const route = useRoute();
  const liveDisplayStore = useLiveDisplayStore();
  const membersStore = useMembersStore(); // Use members store
  const tournamentStore = useTournamentStore(); // Use tournament store
  
  // Get DO ID from route params or query
  const doIdFromUrl = computed(() => {
      return (route.params.doIdString as string) || (route.query.matchId as string) || null;
  });
  
  // Find the corresponding TournamentMatch from the schedule
  const tournamentMatch = computed(() => {
      if (!liveDisplayStore.matchData?.tournament_match_id) return null;
      // Ensure tournamentStore schedule is loaded before trying to find
      if (tournamentStore.schedule.length === 0) return null;
      return tournamentStore.schedule.find(match => match.id === liveDisplayStore.matchData?.tournament_match_id);
  });
  
  
  // State to control the results overlay visibility
  const showResultsOverlay = ref(false);
  
  // Computed properties for health bar width
  const INITIAL_HEALTH = 100; // Must match backend DO constant
  
  const teamAHealthPercentage = computed(() => {
    if (liveDisplayStore.matchData) {
      return Math.max(0, Math.min(100, (liveDisplayStore.matchData.teamA_score / INITIAL_HEALTH) * 100));
    }
    return 0;
  });
  
  const teamBHealthPercentage = computed(() => {
    if (liveDisplayStore.matchData) {
      return Math.max(0, Math.min(100, (liveDisplayStore.matchData.teamB_score / INITIAL_HEALTH) * 100));
    }
    return 0;
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
  
  const getPlayerElement = (playerId: string | null) => {
       if (!playerId) return undefined;
      const member = membersStore.getMemberById(playerId);
      return member?.element;
  };
  
  const getElementName = (element: Member['element']) => {
      switch (element) {
          case 'fire': return '火';
          case 'wood': return '木';
          case 'water': return '水';
          default: return '未知';
      }
  };
  
  const getElementInitial = (element: Member['element']) => {
       switch (element) {
          case 'fire': return 'R';
          case 'wood': return 'G';
          case 'water': return 'B';
          default: return '?';
      }
  };
  
  const getElementClass = (element: Member['element']) => {
       switch (element) {
          case 'fire': return 'element-fire';
          case 'wood': return 'element-wood';
          case 'water': return 'element-water';
          default: return 'text-gray-400';
      }
  };
  
  // Helper to get team name from matchData (which has denormalized names)
  const getTeamName = (teamId?: string) => {
       if (!teamId || !liveDisplayStore.matchData) return '未知队伍';
       if (teamId === liveDisplayStore.matchData.teamA_id) return liveDisplayStore.matchData.teamA_name;
       if (teamId === liveDisplayStore.matchData.teamB_id) return liveDisplayStore.matchData.teamB_name;
       return '未知队伍';
  };
  
  
  // --- Lifecycle Hooks ---
  onMounted(() => {
    // Load members and schedule (needed for player/team details and roundName)
    if (membersStore.members.length === 0) membersStore.loadMembers();
    if (tournamentStore.schedule.length === 0) tournamentStore.loadSchedule(); // Needed for roundName
  
    if (doIdFromUrl.value) {
      liveDisplayStore.connect(doIdFromUrl.value);
    } else {
      liveDisplayStore.error = "未指定比赛ID。请在URL中提供 /live/YOUR_MATCH_ID 或 /live?matchId=YOUR_MATCH_ID";
    }
  
     // Check initial orientation
     checkOrientation();
     window.addEventListener('resize', checkOrientation);
  });
  
  onUnmounted(() => {
    // Disconnect WebSocket when leaving the page
    liveDisplayStore.disconnect();
    window.removeEventListener('resize', checkOrientation);
  });
  
  // Watch for DO ID changes in the URL
  watch(doIdFromUrl, (newDoId) => {
      if (newDoId && typeof newDoId === 'string' && newDoId !== liveDisplayStore.currentDoId) {
          console.log("Live Display: DO ID changed, reconnecting...");
          liveDisplayStore.disconnect(); // Disconnect old connection
          liveDisplayStore.connect(newDoId); // Connect to new DO ID
      } else if (!newDoId) {
           liveDisplayStore.disconnect();
           liveDisplayStore.error = "未指定比赛ID。";
      }
  });
  
  // Watch for match status changes to show/hide results overlay
  watch(() => liveDisplayStore.matchData?.status, (newStatus) => {
      if (newStatus === 'round_finished' || newStatus === 'team_A_wins' || newStatus === 'team_B_wins' || newStatus === 'draw_pending_resolution') {
          // Delay showing the overlay slightly to allow final state update
          setTimeout(() => {
               showResultsOverlay.value = true;
          }, 100); // Adjust delay as needed
      } else {
          showResultsOverlay.value = false;
      }
  }, { immediate: true }); // Check immediately on mount
  
  // Orientation check logic (from prototype JS)
  function checkOrientation() {
      const portraitWarning = document.querySelector('.portrait-warning') as HTMLElement;
      // Use refs or querySelector for elements managed by Vue template
      // const liveContainer = document.querySelector('.live-container') as HTMLElement; // Not needed if using v-if
      // const resultsOverlay = document.querySelector('.results-overlay') as HTMLElement; // Not needed if using v-if
  
      if (window.matchMedia("(orientation: portrait)").matches) {
           if (portraitWarning) portraitWarning.style.display = 'flex';
           // Let Vue handle display of live/results containers via v-if
      } else {
           if (portraitWarning) portraitWarning.style.display = 'none';
           // Let Vue handle display of live/results containers via v-if
      }
  }
  
  // Watch for matchData changes to re-evaluate orientation display
  // This is less critical now that v-if handles display, but good practice
  watch(() => liveDisplayStore.matchData, () => {
      checkOrientation();
  });
  
  
  </script>
  
  <style scoped>
  /* Scoped styles for the live display page */
  /* All custom styles from prototype 1 are moved to main.css */
  /* Tailwind classes are used directly in the template */
  /* current-player-badge color is set inline based on team */
  </style>
  