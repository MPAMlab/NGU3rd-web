<!-- src/components/HealthBar.vue -->
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  health: number;
  maxHealth?: number; // Optional, default 100
  teamColor: 'blue' | 'red'; // Or 'team1' | 'team2'
}>();

const healthPercentage = computed(() => {
  const max = props.maxHealth || 100;
  return Math.max(0, Math.min(100, (props.health / max) * 100)); // Clamp between 0 and 100
});

const healthFillClass = computed(() => {
  return props.teamColor === 'blue' ? 'health-fill-team1' : 'health-fill-team2';
});

</script>

<template>
    <div class="health-bar">
        <div :class="['health-fill', healthFillClass]" :style="{ width: healthPercentage + '%' }"></div>
    </div>
</template>

<style scoped>
/* Keep health-bar and health-fill styles from HTML */
.health-bar {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
}
.health-fill {
    height: 100%;
    transition: width 0.5s ease-in-out;
}
.health-fill-team1 {
    background: linear-gradient(90deg, #3b82f6, #60a5fa); /* Blue */
}
.health-fill-team2 {
    background: linear-gradient(90deg, #ef4444, #f87171); /* Red */
}
</style>
