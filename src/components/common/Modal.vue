<!-- src/components/common/Modal.vue -->
<template>
    <transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" @click.self="close">
        <div class="glass rounded-lg shadow-xl w-full max-w-lg p-6" @click.stop>
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
            <slot name="header">
              <h3 class="text-lg font-bold">Modal Title</h3>
            </slot>
            <button @click="close" class="text-gray-400 hover:text-white">
              <img src="https://unpkg.com/lucide-static@latest/icons/x.svg" class="w-5 h-5">
            </button>
          </div>
          <div class="modal-body mb-4 max-h-96 overflow-y-auto">
            <slot name="body"></slot>
          </div>
          <div class="modal-footer flex justify-end space-x-2">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue';
  
  const props = defineProps<{
    show: boolean;
  }>();
  
  const emit = defineEmits(['close']);
  
  const close = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  /* Modal transition styles */
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }
  
  /* Optional: Scale effect for the modal content */
  .modal-fade-enter-active .glass,
  .modal-fade-leave-active .glass {
    transition: transform 0.3s ease;
  }
  
  .modal-fade-enter-from .glass,
  .modal-fade-leave-to .glass {
    transform: scale(0.95);
  }
  </style>
  