// src/stores/liveMatch.ts
import { defineStore } from 'pinia';
import { fetchMatchState, calculateRound, nextRound, resolveDraw, archiveMatch } from '@/services/api';
import type { MatchState, CalculateRoundPayload, ResolveDrawPayload, RoundSummary } from '@/types';

const WEBSOCKET_RECONNECT_TIMEOUT = 5000; // 5 seconds

export const useLiveMatchStore = defineStore('liveMatch', {
  state: () => ({
    matchData: null as MatchState | null,
    currentDoId: null as string | null,
    websocket: null as WebSocket | null,
    websocketStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
    reconnectTimeoutId: null as number | null,
    isLoading: false,
    error: null as string | null,
    lastRoundSummary: null as RoundSummary | null, // Store summary of the last calculated round
  }),
  actions: {
    async connect(doId: string) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        console.log(`DO (${doId}): WebSocket already connected.`);
        return;
      }
      if (this.websocketStatus === 'connecting') {
         console.log(`DO (${doId}): WebSocket already connecting.`);
         return;
      }

      this.currentDoId = doId;
      this.websocketStatus = 'connecting';
      this.error = null;
      console.log(`DO (${doId}): Attempting to connect WebSocket...`);

      // Use the Worker's WebSocket endpoint
      // Assuming the Worker exposes /api/live-match/:doIdString/websocket
      const websocketUrl = `${window.location.origin.replace('http', 'ws')}/api/live-match/${doId}/websocket`;

      try {
        this.websocket = new WebSocket(websocketUrl);

        this.websocket.onopen = () => {
          console.log(`DO (${doId}): WebSocket connected.`);
          this.websocketStatus = 'connected';
          if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
          }
           // Fetch initial state via HTTP after connection is open, just in case
           // Or rely solely on the first message from the DO
           this.fetchInitialState(doId);
        };

        this.websocket.onmessage = (event) => {
          console.log(`DO (${doId}): WebSocket message received:`, event.data);
          try {
            const state: MatchState = JSON.parse(event.data);
            this.matchData = state;
            // If the state includes a round summary, store it
            if (state.roundSummary) {
                this.lastRoundSummary = state.roundSummary;
            } else if (state.status !== 'round_finished' && state.status !== 'draw_pending_resolution') {
                 // Clear summary if not in a state where summary is relevant
                 this.lastRoundSummary = null;
            }

          } catch (e) {
            console.error(`DO (${doId}): Failed to parse WebSocket message:`, e);
            this.error = 'Failed to process real-time data.';
          }
        };

        this.websocket.onerror = (event) => {
          console.error(`DO (${doId}): WebSocket error:`, event);
          this.websocketStatus = 'error';
          this.error = 'WebSocket connection error.';
          this.scheduleReconnect();
        };

        this.websocket.onclose = (event) => {
          console.log(`DO (${doId}): WebSocket closed:`, event.code, event.reason);
          this.websocketStatus = 'disconnected';
           // Only attempt reconnect if not explicitly closed by the user/app
           if (!event.wasClean) {
             this.scheduleReconnect();
           }
        };

      } catch (e: any) {
        console.error(`DO (${doId}): Failed to create WebSocket:`, e);
        this.websocketStatus = 'error';
        this.error = e.message || 'Failed to establish WebSocket connection.';
        this.scheduleReconnect();
      }
    },

    disconnect() {
      if (this.websocket) {
        console.log(`DO (${this.currentDoId}): Disconnecting WebSocket.`);
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
      this.lastRoundSummary = null;
    },

    scheduleReconnect() {
        if (this.reconnectTimeoutId) return; // Already scheduled
        console.log(`DO (${this.currentDoId}): Scheduling WebSocket reconnect in ${WEBSOCKET_RECONNECT_TIMEOUT / 1000}s...`);
        this.reconnectTimeoutId = window.setTimeout(() => {
            if (this.currentDoId) {
                 this.connect(this.currentDoId);
            }
        }, WEBSOCKET_RECONNECT_TIMEOUT);
    },

    async fetchInitialState(doId: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await fetchMatchState(doId);
            if (response.success && response.data) {
                this.matchData = response.data;
                 if (response.data.roundSummary) {
                    this.lastRoundSummary = response.data.roundSummary;
                 }
            } else {
                this.error = response.error || 'Failed to fetch initial match state.';
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while fetching initial state.';
        } finally {
            this.isLoading = false;
        }
    },

    async calculateRound(payload: CalculateRoundPayload) {
        if (!this.currentDoId) {
            this.error = "No active match to calculate round for.";
            return;
        }
        this.isLoading = true;
        this.error = null;
        try {
            // The API call will forward the request to the DO,
            // and the DO will send the updated state via WebSocket.
            // We don't necessarily need to update state from the API response here,
            // as the WebSocket message is the source of truth.
            // However, the API response might contain immediate feedback or errors.
            const response = await calculateRound(this.currentDoId, payload);
            if (!response.success) {
                 this.error = response.error || 'Failed to calculate round.';
                 throw new Error(this.error); // Throw to component
            }
             // State update will happen via WebSocket message
        } catch (e: any) {
            this.error = e.message || 'An error occurred during round calculation.';
             throw e; // Re-throw
        } finally {
            this.isLoading = false;
        }
    },

    async nextRound() {
         if (!this.currentDoId) {
            this.error = "No active match to advance round for.";
            return;
        }
        this.isLoading = true;
        this.error = null;
        try {
            const response = await nextRound(this.currentDoId);
             if (!response.success) {
                 this.error = response.error || 'Failed to advance to next round.';
                 throw new Error(this.error);
            }
             // State update will happen via WebSocket message
        } catch (e: any) {
            this.error = e.message || 'An error occurred while advancing round.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },

    async resolveDraw(winnerTeamId: string) {
         if (!this.currentDoId) {
            this.error = "No active match to resolve draw for.";
            return;
        }
        this.isLoading = true;
        this.error = null;
        try {
            const payload: ResolveDrawPayload = { winner_team_id: winnerTeamId };
            const response = await resolveDraw(this.currentDoId, payload);
             if (!response.success) {
                 this.error = response.error || 'Failed to resolve draw.';
                 throw new Error(this.error);
            }
             // State update will happen via WebSocket message
        } catch (e: any) {
            this.error = e.message || 'An error occurred while resolving draw.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },

    async archiveMatch() {
         if (!this.currentDoId) {
            this.error = "No active match to archive.";
            return;
        }
        this.isLoading = true;
        this.error = null;
        try {
            const response = await archiveMatch(this.currentDoId);
             if (response.success) {
                 console.log(`DO (${this.currentDoId}): Match archived successfully.`);
                 this.disconnect(); // Disconnect WebSocket as match is done
                 // Optionally navigate away or update UI to reflect archived state
             } else {
                 this.error = response.error || 'Failed to archive match.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while archiving match.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    }
  },
});
