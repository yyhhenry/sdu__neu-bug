<script lang="ts" setup>
import { searchUserApi } from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import { getModulesApi, ModuleInfo, updateModulesApi } from '@/utils/projects';
import { asyncComputed, useDebounceFn } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  breadcrumbs: string[];
  projectKey: string;
}>();
defineEmits<{
  (event: 'close'): void;
}>();

const userList = asyncComputed(async () => {
  const res = await wrapAsyncFn(searchUserApi)({});
  return res.match(
    (res) => ['', ...res.map((u) => u.username)],
    () => [],
  );
});
const modules = ref<ModuleInfo[]>();
const dirty = ref(false);
const openedModules = ref<Set<string>>(new Set());
type ModulesTableRow =
  | { type: 'module'; name: string }
  | {
      type: 'feature';
      name: string;
      moduleName: string;
      feature: ModuleInfo['features'][0];
    };
const modulesTable = computed(() =>
  modules.value?.flatMap<ModulesTableRow>((m) => [
    { type: 'module', name: m.name },
    ...(openedModules.value.has(m.name)
      ? m.features.map<ModulesTableRow>((f) => ({
          type: 'feature',
          moduleName: m.name,
          name: f.name,
          feature: f,
        }))
      : []),
  ]),
);

const fetchModules = async () => {
  dirty.value = false; // Reset dirty flag
  const res = await wrapAsyncFn(getModulesApi)(props.projectKey);
  res.match(
    (res) => {
      modules.value = res;
      openedModules.value = new Set(res.map((m) => m.name));
    },
    (e) => GSnackbar.error(e.message),
  );
};
watch(() => props.projectKey, fetchModules, { immediate: true });

const uploadModules = async () => {
  if (modules.value === undefined) {
    return;
  }
  dirty.value = false; // Reset dirty flag
  const res = await wrapAsyncFn(updateModulesApi)(
    props.projectKey,
    modules.value,
  );
  res.match(
    () => {
      GSnackbar.success('更新模块信息成功');
    },
    (e) => GSnackbar.error(e.message),
  );
};
const debouncedUploadModules = useDebounceFn(uploadModules, 500);
watch(dirty, () => {
  if (dirty.value) {
    debouncedUploadModules();
  }
});
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '任务分配']"></v-breadcrumbs>
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
          <v-icon>mdi-calendar-check</v-icon>
          任务分配
          {{ projectKey }}
        </div>
      </v-card-title>
      <v-card-text v-if="modules !== undefined">
        <v-table>
          <thead>
            <tr>
              <th>模块名/功能名</th>
              <th>计划耗时</th>
              <th>开发者</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row of modulesTable" :key="`${row.type}:${row.name}`">
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
                <span v-if="row.type === 'module'">-</span>
                <span v-else-if="row.type === 'feature'">
                  {{ row.feature.devHours }} 小时
                </span>
              </td>
              <td>
                <span v-if="row.type === 'feature'">
                  <v-select
                    variant="underlined"
                    size="small"
                    v-model="row.feature.devUsername"
                    :items="userList"
                    @update:model-value="() => (dirty = true)"
                  ></v-select>
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
