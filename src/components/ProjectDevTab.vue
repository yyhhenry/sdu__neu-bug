<script lang="ts" setup>
import { GSnackbar } from '@/utils/global-snackbar';
import { ProjectInfo, searchProjectsApi } from '@/utils/projects';
import { useRefreshCounter } from '@/utils/storage';
import { useDebounceFn } from '@vueuse/core';
import { wrapAsyncFn } from '@yyhhenry/rust-result';
import { ref, watch } from 'vue';

defineProps<{
  breadcrumbs: string[];
}>();
const projectsRefreshCounter = useRefreshCounter();
const searchProjectKey = ref('');

const isFiltering = ref(false);
const projects = ref<ProjectInfo[]>();
const fetchProjects = async () => {
  isFiltering.value = searchProjectKey.value !== '';
  console.log(searchProjectKey.value);
  const res = await wrapAsyncFn(searchProjectsApi)(searchProjectKey.value);
  res.match(
    (res) => {
      projects.value = res;
    },
    (e) => GSnackbar.error(e.message),
  );
};
const debouncedFetchProjects = useDebounceFn(fetchProjects, 500);
watch(projectsRefreshCounter.counter, fetchProjects, { immediate: true });
watch(searchProjectKey, debouncedFetchProjects);

const actionsTarget = ref('');

const modulesTab = ref(false);
</script>
<template>
  <v-breadcrumbs v-if="!modulesTab" :items="[...breadcrumbs, '项目列表']" />
  <ModuleDevTab
    v-if="modulesTab"
    :breadcrumbs="[...breadcrumbs, '项目列表']"
    :project-key="actionsTarget"
    @close="modulesTab = false"
  />
  <v-container class="d-flex justify-center" v-if="!modulesTab">
    <v-card width="min(1000px, 100%)" class="ma-5">
      <v-card-title>
        <div class="d-flex align-center ga-3">
          <v-icon>mdi-account-box-multiple</v-icon>
          <span> 项目列表 </span>
        </div>
      </v-card-title>
      <v-card-text
        v-if="projects !== undefined"
        class="pa-4"
        style="font-size: 1.1em"
      >
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <span>筛选条件</span>
              <span class="text-grey pa-1">
                {{ isFiltering ? '筛选得到' : '共' }}
                {{ projects.length }} 个项目
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-text-field
                v-model="searchProjectKey"
                label="项目名"
                clearable
              ></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-table>
          <thead>
            <tr>
              <th>项目名</th>
              <th>创建者</th>
              <th>功能数</th>
              <th>开发人数</th>
              <th class="text-grey">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.key">
              <td>{{ project.name }}</td>
              <td>{{ project.ownerUsername }}</td>
              <td>{{ project.numFeatures }}</td>
              <td>{{ project.numDevelopers }}</td>
              <td>
                <v-btn
                  variant="text"
                  icon="mdi-package-variant"
                  @click="
                    modulesTab = true;
                    actionsTarget = project.key;
                  "
                ></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
