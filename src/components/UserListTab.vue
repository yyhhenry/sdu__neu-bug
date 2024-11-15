<script lang="ts" setup>
import {
  getPrivilegeNameOfRole,
  RoleType,
  searchUserApi,
} from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { asyncComputed } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref } from 'vue';

defineProps<{
  breadcrumbs: string[];
}>();
const searchUserParams = ref({
  username: '',
  fullName: '',
  role: '',
  email: '',
});
const users = asyncComputed(async () => {
  const roleMap: Record<string, RoleType | undefined> = {
    管理员: 'admin',
    用户: 'user',
    普通用户: 'user',
    '': undefined,
  };
  const req = {
    ...searchUserParams.value,
    role: roleMap[searchUserParams.value.role],
  };
  const users = await wrapAsyncFn(searchUserApi)(req);
  return users.match(
    (users) => users,
    (e) => {
      GSnackbar.error(e.message);
      return undefined;
    },
  );
});
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '用户列表']"></v-breadcrumbs>
  <v-container class="d-flex justify-center">
    <v-card width="min(800px, 100%)" class="ma-5">
      <v-card-title>
        <div class="d-flex align-center ga-3">
          <v-icon>mdi-account-box-multiple</v-icon>
          <span> 用户列表 </span>
        </div>
      </v-card-title>
      <v-card-text
        v-if="users !== undefined"
        class="pa-4"
        style="font-size: 1.1em"
      >
        <v-table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>全名</th>
              <th>角色</th>
              <th>邮箱</th>
              <th class="text-grey">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user of users.users" :key="user.username">
              <td>{{ user.username }}</td>
              <td>{{ user.fullName }}</td>
              <td>{{ getPrivilegeNameOfRole(user.role) }}</td>
              <td>{{ user.email }}</td>
              <td>
                <v-btn
                  variant="text"
                  icon="mdi-square-edit-outline"
                  @click="GSnackbar.info('暂未实现')"
                >
                </v-btn>
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="GSnackbar.info('暂未实现')"
                ></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
