import { DNumber, DString, InferType, struct } from '@yyhhenry/type-guard-map';
import { DMsgRes, getAuthHeader } from './account';

export const DProjectInfo = struct({
  key: DString,
  name: DString,
  description: DString,
  date: DString, // YYYY-MM-DD
  ownerUsername: DString,
  ownerFullName: DString,
  numIssues: DNumber,
  numFeatures: DNumber,
  numDevelopers: DNumber,
});
export type ProjectInfo = InferType<typeof DProjectInfo>;

export const DProjectList = struct({
  projects: DProjectInfo.arr(),
});
export async function getProjectListApi(searchName?: string) {
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

export const DFeatureInfo = struct({
  name: DString,
  devHours: DNumber,
  devUsername: DString,
  devFullName: DString,
});
export const DModuleInfo = struct({
  name: DString,
  features: DFeatureInfo.arr(),
});
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
