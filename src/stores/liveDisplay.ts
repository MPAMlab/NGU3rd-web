// src/stores/liveDisplay.ts
import { defineStore } from 'pinia';
import { fetchMatchState } from '@/services/api'; // Optional: to fetch initial state via HTTP
import type { MatchState } from '@/types';

const WEBSOCKET_RECONNECT_TIMEOUT = 5000; // 5 seconds

export const useLiveDisplayStore = defineStore('liveDisplay', {
  state: () => ({
    matchData: null as MatchState | null,
    currentDoId: null as string | null,
    websocket: null as WebSocket | null,
    websocketStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
    reconnectTimeoutId: null as number | null,
    isLoading: false, // For initial HTTP fetch
    error: null as string | null, // For initial HTTP fetch or WS errors
  }),
  actions: {
    async connect(doId: string) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.log(`Live Display DO (${doId}): WebSocket already connected.`);
        return;
      }
       if (this.websocketStatus === 'connecting') {
         console.log(`Live Display DO (${doId}): WebSocket already connecting.`);
         return;
      }

      this.currentDoId = doId;
      this.websocketStatus = 'connecting';
      this.error = null;
      console.log(`Live Display DO (${doId}): Attempting to connect WebSocket...`);

      // Use the Worker's WebSocket endpoint
      const websocketUrl = `${window.location.origin.replace('http', 'ws')}/api/live-match/${doId}/websocket`;

      try {
        this.websocket = new WebSocket(websocketUrl);

        this.websocket.onopen = () => {
          console.log(`Live Display DO (${doId}): WebSocket connected.`);
          this.websocketStatus = 'connected';
           if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
          }
           // Optional: Fetch initial state via HTTP after connection is open
           // this.fetchInitialState(doId);
        };

        this.websocket.onmessage = (event) => {
          console.log(`Live Display DO (${doId}): WebSocket message received.`);
          try {
            const state: MatchState = JSON.parse(event.data);
            this.matchData = state;
          } catch (e) {
            console.error(`Live Display DO (${doId}): Failed to parse WebSocket message:`, e);
            // Don't set error state here unless it's critical, just log
          }
        };

        this.websocket.onerror = (event) => {
          console.error(`Live Display DO (${doId}): WebSocket error:`, event);
          this.websocketStatus = 'error';
          this.error = 'WebSocket connection error.'; // Set error for UI
          this.scheduleReconnect();
        };

        this.websocket.onclose = (event) => {
          console.log(`Live Display DO (${doId}): WebSocket closed:`, event.code, event.reason);
          this.websocketStatus = 'disconnected';
           // Only attempt reconnect if not explicitly closed by the user/app
           if (!event.wasClean) {
             this.scheduleReconnect();
           }
        };

      } catch (e: any) {
        console.error(`Live Display DO (${doId}): Failed to create WebSocket:`, e);
        this.websocketStatus = 'error';
        this.error = e.message || 'Failed to establish WebSocket connection.'; // Set error for UI
        this.scheduleReconnect();
      }
    },

    disconnect() {
      if (this.websocket) {
        console.log(`Live Display DO (${this.currentDoId}): Disconnecting WebSocket.`);
        this.websocket.close(1000, 'Client disconnecting'); // 1000 is normal closure
        this.websocket = null;
        this.websocketStatus = 'disconnected';
         if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }
      }
      this.matchData = null; // Clear state on disconnect
      this.currentDoId = null;
    },

     scheduleReconnect() {
        if (this.reconnectTimeoutId) return; // Already scheduled
        console.log(`Live Display DO (${this.currentDoId}): Scheduling WebSocket reconnect in ${WEBSOCKET_RECONNECT_TIMEOUT / 1000}s...`);
        this.reconnectTimeoutId = window.setTimeout(() => {
            if (this.currentDoId) {
                 this.connect(this.currentDoId);
            }
        }, WEBSOCKET_RECONNECT_TIMEOUT);
    },

    // Optional: Fetch initial state via HTTP before or after WS connection
    async fetchInitialState(doId: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await fetchMatchState(doId);
            if (response.success && response.data) {
                this.matchData = response.data;
            } else {
                this.error = response.error || 'Failed to fetch initial match state.';
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while fetching initial state.';
        } finally {
            this.isLoading = false;
        }
    },
  },
});
