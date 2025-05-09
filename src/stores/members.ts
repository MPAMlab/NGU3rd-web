// src/stores/members.ts
import { defineStore } from 'pinia';
import { fetchMembers, createMember, updateMember, deleteMember } from '@/services/api';
import type { Member } from '@/types';

export const useMembersStore = defineStore('members', {
  state: () => ({
    members: [] as Member[],
    isLoading: false,
    error: null as string | null,
  }),
  actions: {
    async loadMembers() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetchMembers();
        if (response.success && response.data) {
          this.members = response.data;
        } else {
          this.error = response.error || 'Failed to fetch members.';
        }
      } catch (e: any) {
        this.error = e.message || 'An error occurred while fetching members.';
      } finally {
        this.isLoading = false;
      }
    },
     async addMember(memberData: Partial<Member>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await createMember(memberData);
            if (response.success && response.data) {
                this.members.push(response.data);
                // Optionally sort members
            } else {
                this.error = response.error || 'Failed to create member.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while creating member.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
     async updateMember(memberId: string, memberData: Partial<Member>) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await updateMember(memberId, memberData);
            if (response.success && response.data) {
                const index = this.members.findIndex(m => m.id === memberId);
                if (index !== -1) {
                    // Update the member in the state
                    this.members[index] = { ...this.members[index], ...response.data };
                }
            } else {
                this.error = response.error || 'Failed to update member.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while updating member.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    async removeMember(memberId: string) {
        this.isLoading = true;
        this.error = null;
        try {
            const response = await deleteMember(memberId);
            if (response.success) {
                this.members = this.members.filter(member => member.id !== memberId);
            } else {
                this.error = response.error || 'Failed to delete member.';
                 throw new Error(this.error);
            }
        } catch (e: any) {
            this.error = e.message || 'An error occurred while deleting member.';
             throw e;
        } finally {
            this.isLoading = false;
        }
    },
    getMemberById(memberId: string) {
        return this.members.find(member => member.id === memberId);
    },
    getMembersByTeamId(teamId: string) {
        return this.members.filter(member => member.teamId === teamId);
    }
  },
});
