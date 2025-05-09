// src/stores/teams.ts
import { defineStore } from 'pinia';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '@/services/api';
import type { Team } from '@/types';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    teams: [] as Team[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async loadTeams() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetchTeams();
        if (response.success && response.data) {
          this.teams = response.data;
        } else {
          this.error = response.error || 'Failed to fetch teams.';
        }
      } catch (e: any) {
        this.error = e.message || 'An error occurred while fetching teams.';
      } finally {
        this.isLoading = false;
      }
    },
    async addTeam(teamData: Partial<Team>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await createTeam(teamData);
            if (response.success && response.data) {
                this.teams.push(response.data);
                // Optionally sort teams
                // this.teams.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                this.error = response.error || 'Failed to create team.';
                throw new Error(this.error); // Throw to indicate failure to component
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while creating team.';
            throw e; // Re-throw the error
        } finally {
            this.isLoading = false;
        }
    },
     async updateTeam(teamId: string, teamData: Partial<Team>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await updateTeam(teamId, teamData);
            if (response.success && response.data) {
                const index = this.teams.findIndex(t => t.id === teamId);
                if (index !== -1) {
                    // Update the team in the state
                    this.teams[index] = { ...this.teams[index], ...response.data };
                }
            } else {
                this.error = response.error || 'Failed to update team.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while updating team.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    async removeTeam(teamId: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await deleteTeam(teamId);
            if (response.success) {
                this.teams = this.teams.filter(team => team.id !== teamId);
            } else {
                this.error = response.error || 'Failed to delete team.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while deleting team.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    getTeamById(teamId: string) {
        return this.teams.find(team => team.id === teamId);
    }
  },
});
