<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import {
  getIssuesApi,
  IssueInfo,
  SearchIssueReq,
  issueLevelLiterals,
  issueStatusLiterals,
  issueTagLiterals,
} from '@/utils/projects';
import { useRefreshCounter } from '@/utils/storage';
import { useDebounceFn } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref, watch } from 'vue';

const props = defineProps<{
  projectKey: string;
  breadcrumbs: string[];
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
                <v-btn color="error" prepend-icon="mdi-plus">添加</v-btn>
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
              <td>{{ issue.createTime }}</td>
              <td>{{ issue.solveTime }}</td>
              <td>
                <v-btn variant="text" icon="mdi-pencil-box-outline"></v-btn>
                <v-btn variant="text" icon="mdi-delete" color="error"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
