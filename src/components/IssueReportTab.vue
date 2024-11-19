<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import {
  getIssuesApi,
  getModulesApi,
  issueLevelLiterals,
  issueStatusLiterals,
  ModuleInfo,
} from '@/utils/projects';
import { asyncComputed, watchDeep } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { computed, ref } from 'vue';

const props = defineProps<{
  breadcrumbs: string[];
  projectKey: string;
}>();
defineEmits<{
  (event: 'close'): void;
}>();
const modules = asyncComputed(async () => {
  const res = await wrapAsyncFn(getModulesApi)(props.projectKey);
  return res.unwrapOrElse((e) => {
    GSnackbar.error(e.message);
    return [];
  });
});
const issues = asyncComputed(async () => {
  const res = await wrapAsyncFn(getIssuesApi)(props.projectKey);
  return res.unwrapOrElse((e) => {
    GSnackbar.error(e.message);
    return [];
  });
});

const openedModules = ref<Set<string>>(new Set());
watchDeep(modules, () => {
  openedModules.value = new Set(modules.value?.map((m) => m.name) ?? []);
});
type ModulesTableRow =
  | { type: 'module'; name: string }
  | {
      type: 'feature';
      name: string;
      moduleName: string;
      numIssues: number;
      feature: ModuleInfo['features'][0];
    };
const modulesTable = computed(() =>
  modules.value?.flatMap<ModulesTableRow>((m) => [
    { type: 'module', name: m.name },
    ...(openedModules.value.has(m.name)
      ? m.features.map<ModulesTableRow>((f) => ({
          type: 'feature',
          moduleName: m.name,
          numIssues:
            issues.value?.filter(
              (i) => i.moduleName === m.name && i.featureName === f.name,
            ).length ?? 0,
          name: f.name,
          feature: f,
        }))
      : []),
  ]),
);
function groupByField<T>(arr: T[], id: (item: T) => string, idList?: string[]) {
  const map = new Map<string, T[]>(idList?.map((id) => [id, []]) ?? []);
  for (const item of arr) {
    const key = id(item);
    if (map.has(key)) {
      map.get(key)?.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return [...map.entries()].map(([key, value]) => ({
    key,
    count: value.length,
  }));
}
const groupByLevel = computed(() =>
  groupByField(issues.value ?? [], (m) => m.level, [...issueLevelLiterals]),
);
const groupByStatus = computed(() =>
  groupByField(issues.value ?? [], (m) => m.status, [...issueStatusLiterals]),
);
const groupByDev = computed(() =>
  groupByField(issues.value ?? [], (m) => m.devUsername ?? '未指定'),
);
const groupByCreator = computed(() =>
  groupByField(issues.value ?? [], (m) => m.creatorUsername),
);
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, 'Issue统计']"></v-breadcrumbs>
  <v-container class="d-flex justify-center">
    <v-card width="min(1000px, 1000%)">
      <v-card-title>
        <div class="d-flex align-center ga-3">
          <v-btn
            size="large"
            variant="plain"
            icon="mdi-arrow-left"
            @click="$emit('close')"
          >
          </v-btn>
          <v-icon>mdi-mdi-chart-arc</v-icon>
          Issue统计
          {{ projectKey }}
        </div>
      </v-card-title>
      <v-card-text>
        <v-card variant="text">
          <v-card-title>按模块统计</v-card-title>
          <v-card-text v-if="modules !== undefined">
            <v-table>
              <thead>
                <tr>
                  <th>模块名/功能名</th>
                  <th>Issue数量</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row of modulesTable"
                  :key="`${row.type}:${row.name}`"
                >
                  <td>
                    <span v-if="row.type === 'module'">
                      <v-btn
                        size="small"
                        variant="plain"
                        :icon="
                          openedModules.has(row.name)
                            ? 'mdi-chevron-down'
                            : 'mdi-chevron-right'
                        "
                        @click="
                          openedModules.has(row.name)
                            ? openedModules.delete(row.name)
                            : openedModules.add(row.name)
                        "
                      ></v-btn>
                    </span>
                    <span style="margin-left: 60px" v-else></span>
                    {{ row.name }}
                  </td>
                  <td>
                    <span v-if="row.type === 'feature'">{{
                      row.numIssues
                    }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card variant="text">
          <v-card-title>按级别统计</v-card-title>
          <v-card-text v-if="issues !== undefined">
            <v-table>
              <thead>
                <tr>
                  <th>级别</th>
                  <th>Issue数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row of groupByLevel" :key="row.key">
                  <td>{{ row.key }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card variant="text">
          <v-card-title>按状态统计</v-card-title>
          <v-card-text v-if="issues !== undefined">
            <v-table>
              <thead>
                <tr>
                  <th>状态</th>
                  <th>Issue数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row of groupByStatus" :key="row.key">
                  <td>{{ row.key }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card variant="text">
          <v-card-title>按负责人统计</v-card-title>
          <v-card-text v-if="issues !== undefined">
            <v-table>
              <thead>
                <tr>
                  <th>负责人</th>
                  <th>Issue数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row of groupByDev" :key="row.key">
                  <td>{{ row.key }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card variant="text">
          <v-card-title>按创建者统计</v-card-title>
          <v-card-text v-if="issues !== undefined">
            <v-table>
              <thead>
                <tr>
                  <th>创建者</th>
                  <th>Issue数量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row of groupByCreator" :key="row.key">
                  <td>{{ row.key }}</td>
                  <td>{{ row.count }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </v-container>
</template>
