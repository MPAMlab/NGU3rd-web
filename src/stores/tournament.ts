// src/stores/tournament.ts
import { defineStore } from 'pinia';
import { fetchSchedule, createMatch, updateMatch, deleteMatch, startLiveMatch } from '@/services/api';
import type { TournamentMatch, MatchSong } from '@/types';

export const useTournamentStore = defineStore('tournament', {
  state: () => ({
    schedule: [] as TournamentMatch[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async loadSchedule() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetchSchedule();
        if (response.success && response.data) {
          this.schedule = response.data;
        } else {
          this.error = response.error || 'Failed to fetch schedule.';
        }
      } catch (e: any) {
        this.error = e.message || 'An error occurred while fetching schedule.';
      } finally {
        this.isLoading = false;
      }
    },
     async addMatch(matchData: Partial<TournamentMatch>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await createMatch(matchData);
            if (response.success && response.data) {
                this.schedule.push(response.data);
                // Optionally sort schedule
            } else {
                this.error = response.error || 'Failed to create match.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while creating match.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
     async updateMatch(matchId: string, matchData: Partial<TournamentMatch>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await updateMatch(matchId, matchData);
            if (response.success && response.data) {
                const index = this.schedule.findIndex(m => m.id === matchId);
                if (index !== -1) {
                    // Update the match in the state
                    this.schedule[index] = { ...this.schedule[index], ...response.data };
                }
            } else {
                this.error = response.error || 'Failed to update match.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while updating match.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    async removeMatch(matchId: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await deleteMatch(matchId);
            if (response.success) {
                this.schedule = this.schedule.filter(match => match.id !== matchId);
            } else {
                this.error = response.error || 'Failed to delete match.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while deleting match.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    async startLiveMatch(matchId: string, playerOrderA: string[], playerOrderB: string[], songs: MatchSong[]): Promise<string> {
         this.isLoading = true;
         this.error = null;
         try {
             const response = await startLiveMatch(matchId, playerOrderA, playerOrderB, songs);
             if (response.success && response.data?.match_do_id) {
                 // Update the match status in the schedule state
                 const index = this.schedule.findIndex(m => m.id === matchId);
                 if (index !== -1) {
                     this.schedule[index].status = 'ongoing';
                     this.schedule[index].match_do_id = response.data.match_do_id;
                     this.schedule[index].teamA_player_order = playerOrderA;
                     this.schedule[index].teamB_player_order = playerOrderB;
                     this.schedule[index].songs = songs;
                 }
                 return response.data.match_do_id; // Return the DO ID
             } else {
                 this.error = response.error || 'Failed to start live match.';
                 throw new Error(this.error);
             }
         } catch (e: any) {
             this.error = e.message || 'An error occurred while starting live match.';
             throw e;
         } finally {
             this.isLoading = false;
         }
    },
    getMatchById(matchId: string) {
        return this.schedule.find(match => match.id === matchId);
    }
  },
});
