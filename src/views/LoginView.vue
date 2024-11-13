<script lang="ts" setup>
import { theme } from '@/utils/theme';
</script>
<template>
  <v-app :theme="theme">
    <GlobalSnackbar />
    <v-app-bar title="软件缺陷管理系统"></v-app-bar>
    <v-main>
      <v-container> 登录界面尚在开发中 </v-container>
    </v-main>
  </v-app>
</template>
