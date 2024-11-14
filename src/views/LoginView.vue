<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
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
      <v-container class="mt-10 d-flex justify-center ga-5">
        <v-img src="@/assets/cover.png"></v-img>
        <v-card width="min(450px, 100%)">
          <v-card-title> 系统登录 </v-card-title>
          <v-card-text>
            <div class="pt-5">
              <v-text-field
                prepend-inner-icon="mdi-account"
                label="用户名"
              ></v-text-field>
              <v-text-field
                prepend-inner-icon="mdi-lock"
                type="password"
                label="密码"
              ></v-text-field>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="tonal"
              size="large"
              @click="GSnackbar.error('登录（尚未开发）')"
            >
              登录
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>
