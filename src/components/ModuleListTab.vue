<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import { getModulesApi, ModuleInfo, updateModulesApi } from '@/utils/projects';
import { useDebounceFn } from '@vueuse/core';
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

const addModuleDialog = ref(false);
const addModuleName = ref('');
const addModule = () => {
  if (modules.value === undefined) {
    return;
  }
  if (addModuleName.value === '') {
    GSnackbar.error('模块名不能为空');
    return;
  }
  if (modules.value.some((m) => m.name === addModuleName.value)) {
    GSnackbar.error('模块名已存在');
    return;
  }
  modules.value.push({
    name: addModuleName.value,
    features: [],
  });
  dirty.value = true;
  openedModules.value.add(addModuleName.value);
  addModuleName.value = '';
  addModuleDialog.value = false;
};
const deleteModule = (name: string) => {
  if (modules.value === undefined) {
    return;
  }
  modules.value = modules.value.filter((m) => m.name !== name);
  openedModules.value.delete(name);
  dirty.value = true;
};

const addFeatureDialog = ref(false);
const addFeatureModuleName = ref('');
const addFeatureName = ref('');
const addFeatureDevHours = ref('0');
const addFeature = () => {
  if (modules.value === undefined) {
    return;
  }
  const module = modules.value.find(
    (m) => m.name === addFeatureModuleName.value,
  );
  if (module === undefined) {
    return;
  }
  module.features.push({
    name: addFeatureName.value,
    devHours: +addFeatureDevHours.value,
    devUsername: '',
  });
  dirty.value = true;
  addFeatureName.value = '';
  addFeatureDevHours.value = '0';
  addFeatureDialog.value = false;
};
const deleteFeature = (moduleName: string, featureName: string) => {
  if (modules.value === undefined) {
    return;
  }
  const moduleInfo = modules.value.find((m) => m.name === moduleName);
  if (moduleInfo === undefined) {
    return;
  }
  moduleInfo.features = moduleInfo.features.filter(
    (f) => f.name !== featureName,
  );
  dirty.value = true;
};

const editDevHoursDialog = ref(false);
const editDevHoursModuleName = ref('');
const editDevHoursFeatureName = ref('');
const editDevHoursDevHours = ref('0');
const editDevHours = () => {
  if (modules.value === undefined) {
    return;
  }
  const module = modules.value.find(
    (m) => m.name === editDevHoursModuleName.value,
  );
  if (module === undefined) {
    return;
  }
  const feature = module.features.find(
    (f) => f.name === editDevHoursFeatureName.value,
  );
  if (feature === undefined) {
    return;
  }
  feature.devHours = +editDevHoursDevHours.value;
  dirty.value = true;
  editDevHoursDialog.value = false;
};
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
                <v-btn
                  prepend-icon="mdi-package-variant-plus"
                  variant="tonal"
                  @click="addModuleDialog = true"
                >
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
                  <v-tooltip>
                    <template #activator="{ props }">
                      <v-btn
                        variant="plain"
                        v-bind="props"
                        icon="mdi-pencil-outline"
                        @click="
                          editDevHoursModuleName = row.moduleName;
                          editDevHoursFeatureName = row.name;
                          editDevHoursDevHours =
                            row.feature.devHours.toString();
                          editDevHoursDialog = true;
                        "
                      >
                      </v-btn>
                    </template>
                    编辑计划耗时
                  </v-tooltip>
                </span>
              </td>
              <td>
                <v-btn
                  variant="text"
                  color="error"
                  icon="mdi-delete"
                  @click="
                    row.type === 'module'
                      ? deleteModule(row.name)
                      : deleteFeature(row.moduleName, row.name)
                  "
                >
                </v-btn>

                <v-tooltip v-if="row.type === 'module'">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-puzzle-plus-outline"
                      @click="
                        addFeatureModuleName = row.name;
                        addFeatureDialog = true;
                      "
                    >
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

  <v-dialog v-model="addModuleDialog" :max-width="600">
    <v-card>
      <v-card-title>添加模块</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="addModuleName"
          label="模块名"
          outlined
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn size="large" variant="plain" @click="addModuleDialog = false">
          取消
        </v-btn>
        <v-btn size="large" color="primary" @click="addModule">添加</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="addFeatureDialog" :max-width="600">
    <v-card>
      <v-card-title>添加功能到{{ addFeatureModuleName }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="addFeatureName"
          label="功能名"
          outlined
        ></v-text-field>
        <v-text-field
          v-model="addFeatureDevHours"
          label="计划耗时(小时)"
          type="number"
          outlined
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn size="large" variant="plain" @click="addFeatureDialog = false">
          取消
        </v-btn>
        <v-btn size="large" color="primary" @click="addFeature">添加</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDevHoursDialog" :max-width="600">
    <v-card>
      <v-card-title
        >编辑功能{{ editDevHoursFeatureName }}的计划耗时</v-card-title
      >
      <v-card-text>
        <v-text-field
          v-model="editDevHoursDevHours"
          label="计划耗时(小时)"
          type="number"
          outlined
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn size="large" variant="plain" @click="editDevHoursDialog = false">
          取消
        </v-btn>
        <v-btn size="large" color="primary" @click="editDevHours">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
