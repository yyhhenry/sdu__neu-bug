<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import {
  getIssuesApi,
  IssueInfo,
  SearchIssueReq,
  issueLevelLiterals,
  issueStatusLiterals,
  issueTagLiterals,
  createIssueApi,
  getModulesApi,
  deleteIssueApi,
} from '@/utils/projects';
import { useRefreshCounter } from '@/utils/storage';
import { asyncComputed, useDebounceFn } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref, watch, computed } from 'vue';
import { accountStorage } from '@/utils/account';

const props = defineProps<{
  projectKey: string;
  breadcrumbs: string[];
}>();

defineEmits<{
  (event: 'close'): void;
}>();

const issuesRefreshCounter = useRefreshCounter();
const searchReq = ref<SearchIssueReq>({
  title: '',
  moduleName: '',
  featureName: '',
  level: '',
  creatorUsername: '',
  devUsername: '',
  status: '',
  tag: '',
});
const isFiltering = ref(false);
const issueList = ref<IssueInfo[]>();

const fetchIssues = async () => {
  isFiltering.value = Object.values(searchReq.value).some(
    (v) => v !== undefined,
  );

  const res = await wrapAsyncFn(getIssuesApi)(
    props.projectKey,
    searchReq.value,
  );
  res.match(
    (res) => {
      issueList.value = res;
    },
    (e) => GSnackbar.error(e.message),
  );
};
const debouncedFetchIssues = useDebounceFn(fetchIssues, 500);
watch(issuesRefreshCounter.counter, fetchIssues, { immediate: true });
watch(searchReq, debouncedFetchIssues, { deep: true });

const addDialog = ref(false);
const addIssue = ref<IssueInfo>({
  id: '',
  moduleName: '',
  featureName: '',
  title: '',
  description: '',
  level: '一般',
  creatorUsername: accountStorage.value?.username ?? '',
  devUsername: '',
  createTime: new Date().toISOString(),
  solveTime: undefined,
  status: '开放中',
  tag: '未解决',
  feedback: undefined,
});
const addConfirmDialog = ref(false);
const onAddConfirm = () => {
  if (
    addIssue.value.title === '' ||
    addIssue.value.moduleName === '' ||
    addIssue.value.featureName === '' ||
    addIssue.value.creatorUsername === ''
  ) {
    GSnackbar.error('请填写完整信息');
    return;
  }
  addConfirmDialog.value = true;
};
const onAdd = async () => {
  const res = await wrapAsyncFn(createIssueApi)(
    props.projectKey,
    addIssue.value,
  );
  res.match(
    () => {
      GSnackbar.success('添加Issue成功');
      issuesRefreshCounter.refresh();
      addDialog.value = false;
    },
    (e) => GSnackbar.error(e.message),
  );
};

const deleteConfirm = ref(false);
const deleteTarget = ref('');
const onDelete = async () => {
  const res = await wrapAsyncFn(deleteIssueApi)(
    props.projectKey,
    deleteTarget.value,
  );
  res.match(
    () => {
      GSnackbar.success('删除Issue成功');
      issuesRefreshCounter.refresh();
    },
    (e) => GSnackbar.error(e.message),
  );
};

const modules = asyncComputed(async () => {
  const res = await wrapAsyncFn(getModulesApi)(props.projectKey);
  return res.unwrapOrElse((e) => {
    GSnackbar.error(e.message);
    return [];
  });
});
const availableModules = computed(() => [
  '',
  ...(modules.value?.map((m) => m.name) ?? []),
]);
const availableFeatures = computed(() => {
  const selectedModule = addDialog.value ? addIssue.value.moduleName : '';
  return [
    '',
    ...(modules.value
      ?.find((m) => m.name === selectedModule)
      ?.features.map((f) => f.name) ?? []),
  ];
});
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, 'Issue列表']" />
  <v-container>
    <v-card>
      <v-card-title>
        <div class="d-flex align-center ga-3">
          <v-btn
            size="large"
            variant="plain"
            icon="mdi-arrow-left"
            @click="$emit('close')"
          >
          </v-btn>
          <v-icon>mdi-bug-check-outline</v-icon>
          <span>Issue列表 {{ projectKey }}</span>
        </div>
      </v-card-title>
      <v-card-text v-if="issueList !== undefined" class="pa-4">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <span>筛选条件</span>
              <span class="text-grey pa-1">
                {{ isFiltering ? '筛选得到' : '共' }}
                {{ issueList.length }} 个Issue
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text class="py-2">
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="searchReq.title"
                    label="标题"
                    clearable
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="searchReq.moduleName"
                    label="模块名"
                    clearable
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="searchReq.featureName"
                    label="功能名"
                    clearable
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-select
                    v-model="searchReq.level"
                    :items="['', ...issueLevelLiterals]"
                    label="严重程度"
                    clearable
                    hide-details
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="4">
                  <v-select
                    v-model="searchReq.status"
                    :items="['', ...issueStatusLiterals]"
                    label="状态"
                    clearable
                    hide-details
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="4">
                  <v-select
                    v-model="searchReq.tag"
                    :items="['', ...issueTagLiterals]"
                    label="标签"
                    clearable
                    hide-details
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="searchReq.creatorUsername"
                    label="创建者"
                    clearable
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="searchReq.devUsername"
                    label="开发者"
                    clearable
                    hide-details
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-table>
          <thead>
            <tr>
              <th>标题</th>
              <th>模块/功能</th>
              <th>严重程度</th>
              <th>创建者</th>
              <th>开发者</th>
              <th>状态</th>
              <th>标签</th>
              <th>创建时间</th>
              <th>解决时间</th>
              <th>
                <v-btn
                  color="error"
                  prepend-icon="mdi-plus"
                  @click="addDialog = true"
                  >添加</v-btn
                >
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="issue in issueList" :key="issue.id">
              <td>{{ issue.title }}</td>
              <td>{{ issue.moduleName }}/{{ issue.featureName }}</td>
              <td>{{ issue.level }}</td>
              <td>{{ issue.creatorUsername }}</td>
              <td>{{ issue.devUsername }}</td>
              <td>{{ issue.status }}</td>
              <td>{{ issue.tag }}</td>
              <td>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <span v-bind="props">{{ issue.createTime }}</span>
                  </template>
                  {{ issue.description }}
                </v-tooltip>
              </td>
              <td>
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <span v-bind="props">{{ issue.solveTime || '/' }}</span>
                  </template>
                  {{ issue.feedback }}
                </v-tooltip>
              </td>
              <td>
                <v-btn variant="text" icon="mdi-pencil-box-outline"></v-btn>
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="
                    deleteTarget = issue.id;
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
  <v-dialog v-model="addDialog" :max-width="600">
    <v-card>
      <v-card-title>添加Issue</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="addIssue.title"
          label="标题"
          required
        ></v-text-field>
        <v-select
          v-model="addIssue.moduleName"
          :items="availableModules"
          item-title="name"
          label="模块"
          required
        ></v-select>
        <v-select
          v-model="addIssue.featureName"
          :items="availableFeatures"
          label="功能"
          required
        ></v-select>
        <v-text-field
          v-model="addIssue.description"
          label="描述"
          required
        ></v-text-field>
        <v-select
          v-model="addIssue.level"
          :items="issueLevelLiterals"
          label="严重程度"
          required
        ></v-select>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="addDialog = false"
          >取消</v-btn
        >
        <v-btn size="large" variant="tonal" color="error" @click="onAddConfirm"
          >添加</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="addConfirmDialog" :max-width="450">
    <v-card>
      <v-card-title>添加Issue {{ addIssue.title }}</v-card-title>
      <v-card-text>确定添加Issue吗？</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" @click="addConfirmDialog = false">取消</v-btn>
        <v-btn
          size="large"
          variant="tonal"
          color="error"
          @click="
            addConfirmDialog = false;
            onAdd();
          "
          >确定</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="deleteConfirm" :max-width="450">
    <v-card>
      <v-card-title>删除Issue {{ deleteTarget }}</v-card-title>
      <v-card-text>确定删除Issue吗？</v-card-text>
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
