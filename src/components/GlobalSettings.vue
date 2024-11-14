<script setup lang="ts">
import { theme, themeIconOf } from '@/utils/theme';
</script>
<template>
  <v-container>
    <v-label class="d-block"> 主题 </v-label>
    <v-radio-group v-model="theme">
      <v-radio value="dark">
        <template #label>
          <v-icon :icon="themeIconOf('dark')"></v-icon>
          深色模式
        </template>
      </v-radio>
      <v-radio value="light">
        <template #label>
          <v-icon :icon="themeIconOf('light')"></v-icon>
          浅色模式
        </template>
      </v-radio>
      <v-radio value="system">
        <template #label>
          <v-icon :icon="themeIconOf('system')"></v-icon>
          跟随系统
        </template>
      </v-radio>
    </v-radio-group>
  </v-container>
</template>
