<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { switchTheme, theme, themeIcon } from '@/utils/theme';
import GlobalSnackbar from '@/components/GlobalSnackbar.vue';
import { accountStorage, logoutApi, privilegeName } from '@/utils/account';
import { useRouter } from 'vue-router';
import { GSnackbar } from '@/utils/global-snackbar';
const navDrawer = ref(true);
const navSelected = ref<string[]>(['用户信息']);

const router = useRouter();
watchEffect(() => {
  if (accountStorage.value === null) {
    GSnackbar.error('请先登录');
    router.push('/login');
  }
});
const onLogout = () => {
  logoutApi();
};
</script>
<template>
  <v-app :theme="theme">
    <GlobalSnackbar />
    <v-app-bar title="软件缺陷管理系统">
      <template #prepend>
        <v-btn icon="mdi-menu" @click="navDrawer = !navDrawer"> </v-btn>
      </template>
      <template #append>
        <p v-if="accountStorage">
          欢迎{{ privilegeName }}
          <span class="pa-1">
            {{ accountStorage.username }}
          </span>
        </p>
        <v-btn :icon="themeIcon" @click="switchTheme" :title="theme"></v-btn>
        <v-btn @click="onLogout" icon="mdi-logout" title="Logout" />
      </template>
    </v-app-bar>
    <v-navigation-drawer v-model="navDrawer">
      <v-list v-model:selected="navSelected" mandatory>
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-dots-square"
              color="primary"
              v-bind="props"
              title="我的面板"
            ></v-list-item>
          </template>
          <v-list-item title="用户信息" value="用户信息"></v-list-item>
          <v-list-item title="修改密码" value="修改密码"></v-list-item>
        </v-list-group>
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-projector-screen-variant-outline"
              color="primary"
              v-bind="props"
              title="项目管理"
            ></v-list-item>
          </template>
          <v-list-item title="项目管理" value="项目管理"></v-list-item>
        </v-list-group>
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-calendar-check-outline"
              color="primary"
              v-bind="props"
              title="任务分配"
            ></v-list-item>
          </template>
          <v-list-item title="任务分配" value="任务分配"></v-list-item>
        </v-list-group>
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-bug-check-outline"
              color="primary"
              v-bind="props"
              title="缺陷管理"
            ></v-list-item>
          </template>
          <v-list-item title="缺陷管理" value="缺陷管理"></v-list-item>
        </v-list-group>
        <v-list-group>
          <template #activator="{ props }">
            <v-list-item
              prepend-icon="mdi-account-box-multiple"
              color="primary"
              v-bind="props"
              title="用户管理"
            ></v-list-item>
          </template>
          <v-list-item title="用户管理" value="用户管理"></v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <UserInfoTab
        v-if="navSelected[0] === '用户信息'"
        :breadcrumbs="['我的面板']"
      />
      <ChangePasswordTab
        v-else-if="navSelected[0] === '修改密码'"
        :breadcrumbs="['我的面板']"
      />
      <v-container v-else>
        <p>{{ navSelected[0] }} 尚未开发</p>
      </v-container>
    </v-main>
  </v-app>
</template>
