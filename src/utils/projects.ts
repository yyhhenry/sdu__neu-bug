import {
  DNumber,
  DString,
  InferType,
  literal,
  struct,
} from '@yyhhenry/type-guard-map';
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
export const issueLevelLiterals = [
  '轻微',
  '次要',
  '一般',
  '紧急',
  '严重',
] as const;
export const DIssueLevel = literal(...issueLevelLiterals);
export const issueStatusLiterals = ['开放中', '已关闭', '已解决'] as const;
export const DIssueStatus = literal(...issueStatusLiterals);
export type IssueStatus = (typeof issueStatusLiterals)[number];
export const issueTagLiterals = [
  '未解决',
  '已解决',
  '不是错误',
  '无法重现',
  '重复',
] as const;
export const DIssueTag = literal(...issueTagLiterals);
export const DIssueInfo = struct({
  id: DString,
  moduleName: DString,
  featureName: DString,
  title: DString,
  description: DString,
  level: DIssueLevel,
  creatorUsername: DString,
  devUsername: DString.opt(),
  createTime: DString,
  solveTime: DString.opt(),
  status: DIssueStatus,
  tag: DIssueTag.opt(),
  feedback: DString.opt(),
});
export type IssueInfo = InferType<typeof DIssueInfo>;
export const DIssueList = struct({
  issues: DIssueInfo.arr(),
});
export const DSearchIssueReq = struct({
  title: DString.opt(),
  moduleName: DString.opt(),
  featureName: DString.opt(),
  level: DIssueLevel.opt().or(literal('')),
  creatorUsername: DString.opt(),
  devUsername: DString.opt(),
  status: DIssueStatus.opt().or(literal('')),
  tag: DIssueTag.opt().or(literal('')),
});
export type SearchIssueReq = InferType<typeof DSearchIssueReq>;
export async function getIssuesApi(
  projectKey: string,
  searchReq?: SearchIssueReq,
) {
  const url = new URL(
    `/api/project/${projectKey}/issue`,
    window.location.origin,
  );
  if (searchReq) {
    for (const [key, value] of Object.entries(searchReq)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }
  const res: unknown = await fetch(url, {
    headers: {
      ...(await getAuthHeader()),
    },
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DIssueList.validate(res).unwrap().issues;
}
export async function createIssueApi(projectKey: string, issue: IssueInfo) {
  const url = new URL(
    `/api/project/${projectKey}/issue`,
    window.location.origin,
  );
  const res: unknown = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(issue),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}
export async function deleteIssueApi(projectKey: string, issueId: string) {
  const url = new URL(
    `/api/project/${projectKey}/issue/${issueId}`,
    window.location.origin,
  );
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
export async function updateIssueApi(
  projectKey: string,
  issueId: string,
  issue: IssueInfo,
) {
  const url = new URL(
    `/api/project/${projectKey}/issue/${issueId}`,
    window.location.origin,
  );
  const res: unknown = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(issue),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}
