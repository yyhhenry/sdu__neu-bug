<script lang="ts" setup>
import {
  deleteUserApi,
  DRole,
  editUserApi,
  emailRules,
  getPrivilegeNameOfRole,
  passwordRules,
  registerApi,
  searchUserApi,
  UserInfo,
  usernameRules,
} from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { useRefreshCounter } from '@/utils/storage';
import { useDebounceFn, watchDeep } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref, watch } from 'vue';

defineProps<{
  breadcrumbs: string[];
}>();
const usersRefreshCounter = useRefreshCounter();
const roleMap = {
  管理员: 'admin',
  用户: 'user',
  全部: '',
} as const;
type SearchUser = {
  username: string;
  fullName: string;
  role: keyof typeof roleMap;
  email: string;
};
const searchUser = ref<SearchUser>({
  username: '',
  fullName: '',
  role: '全部',
  email: '',
});

const isFiltering = ref(false);
const users = ref<UserInfo[]>();
const fetchUsers = async () => {
  const req = {
    username: searchUser.value.username,
    fullName: searchUser.value.fullName,
    role: roleMap[searchUser.value.role],
    email: searchUser.value.email,
  };
  isFiltering.value = Object.values(req).some((v) => v !== '');
  const res = await wrapAsyncFn(searchUserApi)(req);
  res.match(
    (res) => {
      users.value = res;
    },
    (e) => GSnackbar.error(e.message),
  );
};
const debouncedFetchUsers = useDebounceFn(fetchUsers, 500);
watch(usersRefreshCounter.counter, fetchUsers, { immediate: true });
watchDeep(searchUser, debouncedFetchUsers);

const actionsTarget = ref('');

const editDialog = ref(false);
const editUser = ref<SearchUser>();
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

const addUserDialog = ref(false);
const addUser = ref<SearchUser>({
  username: '',
  fullName: '',
  role: '用户',
  email: '',
});
const addUserPassword = ref('');
const addUserConfirmDialog = ref(false);
const onAddUserConfirm = () => {
  if (
    GSnackbar.accept(addUser.value.username, usernameRules) &&
    GSnackbar.accept(addUserPassword.value, passwordRules) &&
    GSnackbar.accept(addUser.value.email, emailRules)
  ) {
    addUserConfirmDialog.value = true;
  }
};
const onAddUser = async () => {
  const res = await wrapAsyncFn(registerApi)({
    password: addUserPassword.value,
    info: {
      ...addUser.value,
      role: DRole.validate(roleMap[addUser.value.role]).unwrapOr('user'),
    },
  });
  res.match(
    () => {
      GSnackbar.success('添加用户成功');
      usersRefreshCounter.refresh();
      addUserDialog.value = false;
    },
    (e) => GSnackbar.error(e.message),
  );
};
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '用户列表']"></v-breadcrumbs>
  <v-container class="d-flex justify-center">
    <v-card width="min(1000px, 100%)" class="ma-5">
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
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <span>筛选条件</span>
              <span class="text-grey pa-1">
                {{ isFiltering ? '筛选得到' : '共' }} {{ users.length }} 个用户
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-text-field
                v-model="searchUser.username"
                label="用户名"
                clearable
              ></v-text-field>
              <v-text-field
                v-model="searchUser.fullName"
                label="全名"
                clearable
              ></v-text-field>
              <v-select
                v-model="searchUser.role"
                :items="['全部', '管理员', '用户']"
                label="角色"
              ></v-select>
              <v-text-field
                v-model="searchUser.email"
                label="邮箱"
                clearable
              ></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>全名</th>
              <th>角色</th>
              <th>邮箱</th>
              <th>
                <v-btn
                  color="error"
                  prepend-icon="mdi-account-plus"
                  @click="addUserDialog = true"
                >
                  添加
                </v-btn>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user of users" :key="user.username">
              <td>{{ user.username }}</td>
              <td>{{ user.fullName }}</td>
              <td>{{ getPrivilegeNameOfRole(user.role) }}</td>
              <td>{{ user.email }}</td>
              <td>
                <v-btn
                  variant="text"
                  icon="mdi-account-edit"
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
  <v-dialog v-model="addUserDialog" :max-width="600">
    <v-card>
      <v-card-title>添加用户</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="addUser.username"
          label="用户名"
          :rules="usernameRules"
          required
        ></v-text-field>
        <v-text-field
          v-model="addUserPassword"
          :rules="passwordRules"
          label="密码"
          type="password"
          required
        ></v-text-field>
        <v-text-field
          v-model="addUser.fullName"
          label="全名"
          required
        ></v-text-field>
        <v-select
          v-model="addUser.role"
          :items="['管理员', '用户']"
          label="角色"
          required
        ></v-select>
        <v-text-field
          v-model="addUser.email"
          :rules="emailRules"
          label="邮箱"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="addUserDialog = false">
          取消
        </v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="onAddUserConfirm"
        >
          添加
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="addUserConfirmDialog" :max-width="450">
    <v-card>
      <v-card-title>添加用户 {{ addUser.username }}</v-card-title>
      <v-card-text>确定添加用户吗？</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" @click="addUserConfirmDialog = false">取消</v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="
            addUserConfirmDialog = false;
            onAddUser();
          "
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
