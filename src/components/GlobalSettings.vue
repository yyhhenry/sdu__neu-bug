<script setup lang="ts">
import { theme } from '@/utils/theme';
</script>
<template>
  <v-container>
    <v-label class="d-block"> Theme </v-label>
    <v-radio-group v-model="theme">
      <v-radio label="Dark theme" value="dark"></v-radio>
      <v-radio label="Light theme" value="light"></v-radio>
    </v-radio-group>
  </v-container>
</template>
