<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { switchTheme, theme, themeIcon } from '@/utils/theme';
import GlobalSnackbar from '@/components/GlobalSnackbar.vue';
import { accountStorage, logoutApi, privilegeName } from '@/utils/account';
import { useRouter } from 'vue-router';
import { GSnackbar } from '@/utils/global-snackbar';
import { leafErr, literal } from '@yyhhenry/type-guard-map';
import { fin } from '@yyhhenry/rust-result';
import { useCheckedStorage } from '@/utils/storage';
const navDrawer = ref(true);
const DNavOpened = literal(
  '我的面板Panel',
  '项目管理Panel',
  '任务分配Panel',
  '缺陷管理Panel',
  '用户管理Panel',
)
  .arr()
  .cond((v) => {
    if (v.length !== 1) {
      return leafErr('只能选择一个导航');
    }
    return fin();
  });
const navOpened = useCheckedStorage('neu-bug-nav-opened', DNavOpened, [
  '我的面板Panel',
]);
const DNavSelected = literal(
  '用户信息',
  '修改密码',
  '项目管理',
  '任务分配',
  '缺陷管理',
  '用户管理',
)
  .arr()
  .cond((v) => {
    if (v.length !== 1) {
      return leafErr('只能选择一个导航');
    }
    return fin();
  });
const navSelected = useCheckedStorage('neu-bug-nav-selected', DNavSelected, [
  '用户信息',
]);

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
      <v-list
        v-model:selected="navSelected"
        v-model:opened="navOpened"
        mandatory
        open-strategy="single"
      >
        <v-list-group value="我的面板Panel">
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
        <v-list-group value="项目管理Panel">
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
        <v-list-group value="任务分配Panel">
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
        <v-list-group value="缺陷管理Panel">
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
        <v-list-group value="用户管理Panel">
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
      <ProjectListTab
        v-else-if="navSelected[0] === '项目管理'"
        :breadcrumbs="['项目管理']"
      ></ProjectListTab>
      <ProjectDevTab
        v-else-if="navSelected[0] === '任务分配'"
        :breadcrumbs="['任务分配']"
      ></ProjectDevTab>
      <ProjectIssueTab
        v-else-if="navSelected[0] === '缺陷管理'"
        :breadcrumbs="['缺陷管理']"
      />
      <UserListTab
        v-else-if="navSelected[0] === '用户管理'"
        :breadcrumbs="['用户管理']"
      />
      <v-container v-else>
        <p>{{ navSelected[0] }} 尚未开发</p>
      </v-container>
    </v-main>
  </v-app>
</template>
