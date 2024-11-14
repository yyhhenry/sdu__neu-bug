<script lang="ts" setup>
import { changePasswordApi, passwordRules } from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref } from 'vue';

defineProps<{
  breadcrumbs: string[];
}>();
const oldPassword = ref('');
const newPassword = ref('');
const newPasswordRules = [
  ...passwordRules,
  (v: string) => v !== oldPassword.value || '新密码不能与旧密码相同',
];
const confirmDialog = ref(false);

const onConfirm = () => {
  if (
    GSnackbar.accept(oldPassword.value, passwordRules) &&
    GSnackbar.accept(newPassword.value, newPasswordRules)
  ) {
    confirmDialog.value = true;
  }
};
const onSubmit = async () => {
  const res = await wrapAsyncFn(changePasswordApi)({
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
  });
  res.match(
    () => {
      GSnackbar.success('修改密码成功');
      oldPassword.value = '';
      newPassword.value = '';
    },
    (e) => GSnackbar.error(e.message),
  );
};
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '修改密码']"></v-breadcrumbs>
  <v-container class="d-flex justify-center">
    <v-card width="min(800px, 100%)" class="ma-5">
      <v-card-title>修改密码</v-card-title>
      <v-card-text class="pa-4">
        <v-text-field
          v-model="oldPassword"
          :rules="passwordRules"
          type="password"
          label="旧密码"
          required
        ></v-text-field>
        <v-text-field
          v-model="newPassword"
          :rules="newPasswordRules"
          type="password"
          label="新密码"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="onConfirm" size="large" color="error" variant="tonal">
          修改密码
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="confirmDialog" :max-width="450">
      <v-card>
        <v-card-title>确认修改密码</v-card-title>
        <v-card-text>确定修改密码吗？</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn size="large" @click="confirmDialog = false">取消</v-btn>
          <v-btn
            size="large"
            variant="tonal"
            color="error"
            @click="
              confirmDialog = false;
              onSubmit();
            "
          >
            确定
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
