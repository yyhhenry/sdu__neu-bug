import { DNumber, DString, InferType, struct } from '@yyhhenry/type-guard-map';
import { DMsgRes, getAuthHeader } from './account';

export const DProjectInfo = struct({
  key: DString,
  name: DString,
  description: DString,
  date: DString, // YYYY-MM-DD
  ownerUsername: DString,
  numIssues: DNumber,
  numFeatures: DNumber,
  numDevelopers: DNumber,
});
export type ProjectInfo = InferType<typeof DProjectInfo>;

export const DProjectList = struct({
  projects: DProjectInfo.arr(),
});
export async function searchProjectsApi(searchName?: string) {
  const url = new URL('/api/search-project', window.location.origin);
  if (searchName) {
    url.searchParams.set('name', searchName);
  }
  const res: unknown = await fetch(url, {
    headers: {
      ...(await getAuthHeader()),
    },
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DProjectList.validate(res).unwrap().projects;
}
export const DCreateProjectReq = struct({
  name: DString,
  description: DString,
  date: DString,
  ownerUsername: DString,
});
export type CreateProjectReq = InferType<typeof DCreateProjectReq>;
export async function createProjectApi(key: string, req: CreateProjectReq) {
  const url = new URL(`/api/project/${key}`, window.location.origin);
  const res: unknown = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DProjectInfo.validate(res).unwrap();
}
export async function deleteProjectApi(key: string) {
  const url = new URL(`/api/project/${key}`, window.location.origin);
  const res: unknown = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...(await getAuthHeader()),
    },
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}
export async function updateProjectApi(key: string, req: CreateProjectReq) {
  const url = new URL(`/api/project/${key}`, window.location.origin);
  const res: unknown = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DProjectInfo.validate(res).unwrap();
}

export const DFeatureInfo = struct({
  name: DString,
  devHours: DNumber,
  devUsername: DString,
});
export const DModuleInfo = struct({
  name: DString,
  features: DFeatureInfo.arr(),
});
export type ModuleInfo = InferType<typeof DModuleInfo>;
export const DModuleList = struct({
  modules: DModuleInfo.arr(),
});
export async function getModulesApi(projectKey: string) {
  const res: unknown = await fetch(`/api/project/${projectKey}/modules`, {
    headers: {
      ...(await getAuthHeader()),
    },
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DModuleList.validate(res).unwrap().modules;
}

export async function updateModulesApi(
  projectKey: string,
  modules: ModuleInfo[],
) {
  const url = new URL(
    `/api/project/${projectKey}/modules`,
    window.location.origin,
  );
  const res: unknown = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify({ modules }),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}
