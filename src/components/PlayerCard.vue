<!-- src/components/PlayerCard.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { Member } from '../types'; // Adjust path

const props = defineProps<{
  player: Pick<Member, 'id' | 'nickname' | 'avatar_url' | 'element' | 'profession'>;
  isCurrent?: boolean; // Optional prop to highlight the current player
}>();

const elementColorClass = computed(() => {
  switch (props.player.element) {
    case 'fire': return 'text-red-400';
    case 'wood': return 'text-green-400';
    case 'blue': return 'text-blue-400';
    default: return 'text-gray-400';
  }
});

const elementText = computed(() => {
     switch (props.player.element) {
        case 'fire': return '火 (R)';
        case 'wood': return '木 (G)';
        case 'blue': return '水 (B)';
        default: return '';
     }
});

</script>

<template>
    <div :class="['glass rounded-lg p-2 flex flex-col items-center player-card', { 'current': isCurrent }]">
        <img :src="player.avatar_url || 'https://via.placeholder.com/150'" :alt="`${player.nickname}头像`" class="w-12 h-12 rounded-full mb-2 object-cover">
        <p class="text-sm font-medium text-center">{{ player.nickname }}</p>
        <p :class="['text-xs', elementColorClass, 'mb-1']">{{ elementText }}</p>
        <p class="text-xs text-gray-300">{{ player.profession }}</p>
    </div>
</template>

<style scoped>
/* Keep player-card and current styles from HTML */
.player-card.current {
     border: 2px solid #8b5cf6; /* Highlight current player */
     background: rgba(139, 92, 246, 0.1);
}
.glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
</style>
