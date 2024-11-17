<script lang="ts" setup>
import { accountStorage } from '@/utils/account';
import { GSnackbar } from '@/utils/global-snackbar';
import {
  createProjectApi,
  CreateProjectReq,
  deleteProjectApi,
  ProjectInfo,
  searchProjectsApi,
  updateProjectApi,
} from '@/utils/projects';
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

const editDialog = ref(false);
const editProject = ref<CreateProjectReq>();
const onEdit = async () => {
  if (editProject.value === undefined) {
    return;
  }
  const res = await wrapAsyncFn(updateProjectApi)(
    actionsTarget.value,
    editProject.value,
  );
  res.match(
    () => {
      GSnackbar.success('修改项目信息成功');
      projectsRefreshCounter.refresh();
      editDialog.value = false;
    },
    (e) => GSnackbar.error(e.message),
  );
};

const deleteConfirm = ref(false);
const onDelete = async () => {
  const res = await wrapAsyncFn(deleteProjectApi)(actionsTarget.value);
  res.match(
    () => {
      GSnackbar.success('删除项目成功');
      projectsRefreshCounter.refresh();
    },
    (e) => GSnackbar.error(e.message),
  );
};

const addDialog = ref(false);
const addProjectKey = ref('');
const addProject = ref<CreateProjectReq>({
  name: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  ownerUsername: accountStorage.value?.username ?? '',
});
const addConfirmDialog = ref(false);
const onAddConfirm = () => {
  if (
    addProject.value.name === '' ||
    addProject.value.description === '' ||
    addProject.value.date === '' ||
    addProject.value.ownerUsername === ''
  ) {
    GSnackbar.error('请填写完整信息');
    return;
  }
  addConfirmDialog.value = true;
};
const onAdd = async () => {
  const res = await wrapAsyncFn(createProjectApi)(
    addProjectKey.value,
    addProject.value,
  );
  res.match(
    () => {
      GSnackbar.success('添加项目成功');
      projectsRefreshCounter.refresh();
      addDialog.value = false;
    },
    (e) => GSnackbar.error(e.message),
  );
};

const modulesTab = ref(false);
</script>
<template>
  <v-breadcrumbs v-if="!modulesTab" :items="[...breadcrumbs, '项目列表']" />
  <ModuleListTab
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
              <th>项目标签</th>
              <th>项目名</th>
              <th>描述</th>
              <th>创建日期</th>
              <th>创建者</th>
              <th>
                <v-btn
                  color="error"
                  prepend-icon="mdi-plus"
                  @click="addDialog = true"
                >
                  添加
                </v-btn>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in projects" :key="project.key">
              <td>{{ project.key }}</td>
              <td>{{ project.name }}</td>
              <td>{{ project.description }}</td>
              <td>{{ project.date }}</td>
              <td>{{ project.ownerUsername }}</td>
              <td>
                <v-btn
                  variant="text"
                  icon="mdi-package-variant"
                  @click="
                    modulesTab = true;
                    actionsTarget = project.key;
                  "
                ></v-btn>
                <v-btn
                  variant="text"
                  icon="mdi-pencil-box-outline"
                  @click="
                    actionsTarget = project.key;
                    editDialog = true;
                    editProject = {
                      name: project.name,
                      description: project.description,
                      date: project.date,
                      ownerUsername: project.ownerUsername,
                    };
                  "
                >
                </v-btn>
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  color="error"
                  @click="
                    actionsTarget = project.key;
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
      <v-card-title>添加项目</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="addProjectKey"
          label="项目标签"
          required
        ></v-text-field>
        <v-text-field
          v-model="addProject.name"
          label="项目名"
          required
        ></v-text-field>
        <v-text-field
          v-model="addProject.description"
          label="描述"
          required
        ></v-text-field>
        <v-text-field
          v-model="addProject.date"
          label="创建日期"
          type="date"
          required
        ></v-text-field>
        <v-text-field
          v-model="addProject.ownerUsername"
          label="创建者用户名"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="addDialog = false">
          取消
        </v-btn>
        <v-btn size="large" variant="tonal" color="error" @click="onAddConfirm">
          添加
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="addConfirmDialog" :max-width="450">
    <v-card>
      <v-card-title
        >添加项目 {{ addProjectKey }}（{{ addProject.name }}）</v-card-title
      >
      <v-card-text>确定添加项目吗？</v-card-text>
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
        >
          确定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDialog" :max-width="600">
    <v-card>
      <v-card-title>编辑项目 {{ actionsTarget }}</v-card-title>
      <v-card-text v-if="editProject !== undefined">
        <v-text-field
          v-model="editProject.name"
          label="项目名"
          required
        ></v-text-field>
        <v-text-field
          v-model="editProject.description"
          label="描述"
          required
        ></v-text-field>
        <v-text-field
          v-model="editProject.date"
          label="创建日期"
          type="date"
          required
        ></v-text-field>
        <v-text-field
          v-model="editProject.ownerUsername"
          label="创建者用户名"
          required
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn size="large" variant="text" @click="editDialog = false">
          取消
        </v-btn>
        <v-btn size="large" variant="tonal" color="error" @click="onEdit">
          保存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="deleteConfirm" :max-width="450">
    <v-card>
      <v-card-title>删除项目 {{ actionsTarget }}</v-card-title>
      <v-card-text>确定删除项目吗？</v-card-text>
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
