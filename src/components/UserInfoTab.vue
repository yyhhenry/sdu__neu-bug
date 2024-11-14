<script lang="ts" setup>
import { getPrivilegeNameOfRole, getUserInfoApi } from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { asyncComputed } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';

const props = defineProps<{
  breadcrumbs: string[];
  // If not provided, show the current user's information
  username?: string;
}>();
const userInfo = asyncComputed(async () => {
  const res = await wrapAsyncFn(getUserInfoApi)(props.username);
  return res.match(
    (res) => res,
    (e) => {
      GSnackbar.error(e.message);
      return undefined;
    },
  );
});
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '用户信息']"></v-breadcrumbs>
  <v-container class="d-flex justify-center">
    <v-card width="min(800px, 100%)" class="ma-5">
      <v-card-title>用户信息</v-card-title>
      <v-card-text v-if="userInfo !== undefined" class="pa-4">
        <v-row class="align-center">
          <v-col class="v-col-2 text-right"><v-label>用户名：</v-label></v-col>
          <v-col>{{ userInfo.username }}</v-col>
        </v-row>
        <v-row class="align-center">
          <v-col class="v-col-2 text-right"><v-label>全名：</v-label></v-col>
          <v-col>{{ userInfo.fullName }}</v-col>
        </v-row>
        <v-row class="align-center">
          <v-col class="v-col-2 text-right"><v-label>角色：</v-label></v-col>
          <v-col>{{ getPrivilegeNameOfRole(userInfo.role) }}</v-col>
        </v-row>
        <v-row class="align-center">
          <v-col class="v-col-2 text-right"><v-label>邮箱：</v-label></v-col>
          <v-col>{{ userInfo.email }}</v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
