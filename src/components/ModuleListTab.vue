<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import { getModulesApi, ModuleInfo } from '@/utils/projects';
import { useRefreshCounter } from '@/utils/storage';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  breadcrumbs: string[];
  projectKey: string;
}>();
defineEmits<{
  (event: 'close'): void;
}>();

const modules = ref<ModuleInfo[]>();
const openedModules = ref<Set<string>>(new Set());
type ModulesTableRow =
  | { type: 'module'; name: string }
  | { type: 'feature'; name: string; feature: ModuleInfo['features'][0] };
const modulesTable = computed(() =>
  modules.value?.flatMap<ModulesTableRow>((m) => [
    { type: 'module', name: m.name },
    ...(openedModules.value.has(m.name)
      ? m.features.map<ModulesTableRow>((f) => ({
          type: 'feature',
          name: f.name,
          feature: f,
        }))
      : []),
  ]),
);
const moduleRefreshCounter = useRefreshCounter();

const fetchModules = async () => {
  const res = await wrapAsyncFn(getModulesApi)(props.projectKey);
  res.match(
    (res) => {
      modules.value = res;
      openedModules.value = new Set(res.map((m) => m.name));
    },
    (e) => GSnackbar.error(e.message),
  );
};
watch(moduleRefreshCounter.counter, fetchModules);
watch(() => props.projectKey, fetchModules, { immediate: true });
</script>
<template>
  <v-breadcrumbs :items="[...breadcrumbs, '模块管理']"></v-breadcrumbs>
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
          <v-icon>mdi-package-variant</v-icon>
          模块管理
          {{ projectKey }}
        </div>
      </v-card-title>
      <v-card-text v-if="modules !== undefined">
        <v-table>
          <thead>
            <tr>
              <th>模块名/功能名</th>
              <th>计划耗时</th>
              <th>
                <v-btn prepend-icon="mdi-package-variant-plus" variant="tonal">
                  添加模块
                </v-btn>
              </th>
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
                  <v-btn variant="text" icon="mdi-clock-edit-outline"></v-btn>
                </span>
              </td>
              <td>
                <v-btn variant="text" color="error" icon="mdi-delete"> </v-btn>

                <v-tooltip v-if="row.type === 'module'">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-puzzle-plus-outline">
                    </v-btn>
                  </template>

                  添加功能到{{ row.name }}模块
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
