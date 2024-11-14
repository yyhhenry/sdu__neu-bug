<script lang="ts" setup>
import { theme, switchTheme, themeIcon } from '@/utils/theme';
</script>
<template>
  <v-app :theme="theme">
    <GlobalSnackbar />
    <v-app-bar title="">
      <template #title>
        <div class="d-flex align-center">
          <v-icon><v-img src="@/assets/neu-bug-1024x.png"></v-img></v-icon>
          <span class="pa-2">软件缺陷管理系统</span>
        </div>
      </template>
      <template #append>
        <v-btn :icon="themeIcon" @click="switchTheme"></v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-container class="d-flex justify-center">
        <v-card width="450">
          <v-card-title>系统登录</v-card-title>
          <v-card-text>
            <v-text-field label="用户名"></v-text-field>
            <v-text-field type="password" label="密码"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn size="large">登录</v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
