<script lang="ts" setup>
import {
  deleteUserApi,
  DRole,
  editUserApi,
  emailRules,
  getPrivilegeNameOfRole,
  RoleType,
  searchUserApi,
  usernameRules,
} from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { useRefreshCounter } from '@/utils/storage';
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
const roleMap: Record<string, RoleType | undefined> = {
  管理员: 'admin',
  用户: 'user',
  '': undefined,
};
const usersRefreshCounter = useRefreshCounter();
const users = asyncComputed(async () => {
  usersRefreshCounter.require();
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
const actionsTarget = ref('');

const editDialog = ref(false);
interface EditUser {
  username: string;
  fullName: string;
  role: string;
  email: string;
}
const editUser = ref<EditUser>();
const editConfirmDialog = ref(false);
const onEditConfirm = () => {
  if (editUser.value === undefined) {
    return;
  }
  if (
    GSnackbar.accept(editUser.value.username, usernameRules) &&
    GSnackbar.accept(editUser.value.email, emailRules)
  ) {
    editConfirmDialog.value = true;
  }
};
const onEdit = async () => {
  if (editUser.value === undefined) {
    return;
  }
  const res = await wrapAsyncFn(editUserApi)(actionsTarget.value, {
    ...editUser.value,
    role: DRole.validate(roleMap[editUser.value.role]).unwrapOr('user'),
  });
  res.match(
    () => {
      GSnackbar.success('修改用户信息成功');
      usersRefreshCounter.refresh();
      editDialog.value = false;
    },
    (e) => GSnackbar.error(e.message),
  );
};
const deleteConfirm = ref(false);
const onDelete = async () => {
  const res = await wrapAsyncFn(deleteUserApi)(actionsTarget.value);
  res.match(
    () => {
      GSnackbar.success('删除用户成功');
      usersRefreshCounter.refresh();
    },
    (e) => GSnackbar.error(e.message),
  );
};
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
                  @click="
                    actionsTarget = user.username;
                    editDialog = true;
                    editUser = {
                      ...user,
                      role: getPrivilegeNameOfRole(user.role),
                    };
                  "
                >
                </v-btn>
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="
                    actionsTarget = user.username;
                    deleteConfirm = true;
                  "
                ></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
  <v-dialog v-model="editDialog" :max-width="600">
    <v-card>
      <v-card-title>编辑用户 {{ actionsTarget }}</v-card-title>
      <v-card-text v-if="editUser !== undefined">
        <v-text-field
          v-model="editUser.username"
          label="用户名"
          :rules="usernameRules"
          required
        ></v-text-field>
        <v-text-field
          v-model="editUser.fullName"
          label="全名"
          required
        ></v-text-field>
        <v-select
          v-model="editUser.role"
          :items="['管理员', '用户']"
          label="角色"
          required
        ></v-select>
        <v-text-field
          v-model="editUser.email"
          :rules="emailRules"
          label="邮箱"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="editDialog = false">
          取消
        </v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="onEditConfirm"
        >
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="editConfirmDialog" :max-width="450">
    <v-card>
      <v-card-title>修改用户 {{ actionsTarget }}</v-card-title>
      <v-card-text>确定修改用户信息吗？</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" @click="editConfirmDialog = false">取消</v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="
            editConfirmDialog = false;
            onEdit();
          "
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="deleteConfirm" :max-width="450">
    <v-card>
      <v-card-title>删除用户 {{ actionsTarget }}</v-card-title>
      <v-card-text>确定删除用户吗？</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" @click="deleteConfirm = false">取消</v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="
            deleteConfirm = false;
            onDelete();
          "
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
