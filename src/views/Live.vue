<template>
    <div class="live-page-container">
      <div class="scoreboard">
        <h1>比赛直播</h1>
        <div v-if="store.isLoading && !store.currentMatch" class="status-message">正在加载初始数据...</div>
        <div v-if="store.error && !store.currentMatch" class="status-message error">
          加载数据失败: {{ store.error }}
        </div>
        <div v-if="!store.isConnected && store.currentMatch" class="status-message warning">
          ⚠️ WebSocket 未连接，数据可能不是最新的。
        </div>
         <div v-if="store.isConnected && !store.currentMatch" class="status-message">
          等待数据...
        </div>
  
  
        <template v-if="store.currentMatch">
          <h2 id="roundInfo">第 {{ store.currentMatch.round }} 轮</h2>
          <div id="matchStatus" :class="['status-tag', store.currentMatch.status]">
            {{ getStatusText(store.currentMatch.status) }}
          </div>
          
          <div class="teams-container">
            <div class="team" id="teamA">
              <h3 id="teamA_name">{{ store.currentMatch.teamA_name }}</h3>
              <p class="player" id="teamA_player">{{ store.currentMatch.teamA_player }}</p>
              <p class="score" id="teamA_score">{{ store.currentMatch.teamA_score }}</p>
            </div>
            <div class="vs-separator">VS</div>
            <div class="team" id="teamB">
              <h3 id="teamB_name">{{ store.currentMatch.teamB_name }}</h3>
              <p class="player" id="teamB_player">{{ store.currentMatch.teamB_player }}</p>
              <p class="score" id="teamB_score">{{ store.currentMatch.teamB_score }}</p>
            </div>
          </div>
        </template>
        <div v-else-if="!store.isLoading && !store.error" class="status-message">
          暂无比赛数据。
        </div>
        <div id="connectionStatus" :class="{ 'connected': store.isConnected, 'disconnected': !store.isConnected }">
          {{ store.isConnected ? '● 已连接到服务器' : '○ 连接已断开' }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue';
  import { useMatchStore } from '@/stores/matchStore';
  import type { MatchState } from '@/types/match';
  
  const store = useMatchStore();
  
  onMounted(() => {
    // Fetch initial state in case WebSocket connects after some data is already set
    // or if WebSocket fails, we at least have a snapshot.
    if (!store.currentMatch) {
      store.fetchCurrentMatchState();
    }
    store.connectWebSocket();
  });
  
  onUnmounted(() => {
    store.disconnectWebSocket();
  });
  
  function getStatusText(status: MatchState['status'] | undefined) {
    if (!status) return '未知';
    switch(status) {
      case 'live': return '进行中';
      case 'pending': return '准备中';
      case 'finished': return '已结束';
      case 'paused': return '已暂停';
      default: return '未知状态';
    }
  }
  </script>
  
  <style scoped>
  .live-page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 160px); /* Adjust based on header/footer height */
    padding: 20px;
    background-color: #2c3e50; /* Dark background for contrast */
  }
  
  .scoreboard {
    background-color: #34495e;
    padding: 30px 40px;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    text-align: center;
    width: 100%;
    max-width: 900px;
    color: #ecf0f1;
  }
  
  h1 {
    color: #e74c3c; /* Striking color for main title */
    margin-bottom: 15px;
    font-size: 2.8em;
    font-weight: bold;
  }
  
  h2#roundInfo {
    color: #f1c40f; /* Yellow for round info */
    margin-bottom: 20px;
    font-size: 2em;
  }
  
  .status-tag {
    font-size: 1.3em;
    margin-bottom: 25px;
    padding: 8px 15px;
    border-radius: 20px; /* Pill shape */
    display: inline-block;
    font-weight: bold;
    color: #fff;
  }
  .status-tag.live { background-color: #2ecc71; } /* Green */
  .status-tag.pending { background-color: #f39c12; } /* Orange */
  .status-tag.finished { background-color: #95a5a6; } /* Grey */
  .status-tag.paused { background-color: #3498db; } /* Blue */
  
  .teams-container {
    display: flex;
    justify-content: space-around;
    align-items: center; /* Align items vertically */
    margin-bottom: 25px;
    gap: 20px;
  }
  
  .team {
    background-color: #4a6278; /* Slightly lighter than scoreboard bg */
    padding: 25px;
    border-radius: 10px;
    width: 40%; /* Adjust width as needed */
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  
  .team h3 { /* Team Name */
    font-size: 2.2em;
    margin-top: 0;
    margin-bottom: 10px;
    color: #fff;
    font-weight: bold;
  }
  
  .team .player { /* Player Name */
    font-size: 1.4em;
    color: #bdc3c7; /* Light grey for secondary info */
    margin-bottom: 15px;
  }
  
  .team .score { /* Score */
    font-size: 4em;
    font-weight: bold;
    color: #1abc9c; /* Teal for score */
    line-height: 1;
  }
  
  .vs-separator {
    font-size: 2.5em;
    color: #e74c3c;
    font-weight: bold;
  }
  
  #connectionStatus {
    margin-top: 30px;
    font-style: italic;
    font-size: 0.9em;
  }
  #connectionStatus.connected { color: #2ecc71; }
  #connectionStatus.disconnected { color: #e74c3c; }
  
  
  .status-message {
    padding: 15px;
    margin: 20px auto;
    border-radius: 5px;
    max-width: 600px;
  }
  .status-message.error { background-color: #e74c3c; color: white; }
  .status-message.warning { background-color: #f39c12; color: white; }
  </style>
  