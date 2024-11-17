import { DCreateProjectReq, DModuleInfo, ProjectInfo } from '@/utils/projects';
import { DString, InferType, struct } from '@yyhhenry/type-guard-map';
import { http, HttpResponse, RequestHandler } from 'msw';
import { mockUsers } from './account';

export const mockProjects: ProjectInfo[] = [
  {
    key: 'blog',
    name: '个人博客系统',
    description: '用于个人博客的系统',
    ownerUsername: 'admin',
    ownerFullName: '管理员',
    date: '2016-07-25',
    numDevelopers: 0,
    numFeatures: 0,
    numIssues: 0,
  },
  {
    key: 'user',
    name: '用户管理系统',
    description: '用于用户管理的系统',
    ownerUsername: 'userC1',
    ownerFullName: '白鹭',
    date: '2016-07-25',
    numDevelopers: 0,
    numFeatures: 0,
    numIssues: 0,
  },
];
export const DMockModules = struct({
  projectKey: DString,
  modules: DModuleInfo.arr(),
});
export type MockModules = InferType<typeof DMockModules>;
export const mockModules: MockModules[] = [
  {
    projectKey: 'blog',
    modules: [
      {
        name: '首页',
        features: [
          {
            name: '导航栏',
            devHours: 2,
            devFullName: '白鹭',
            devUsername: 'userC1',
          },
          {
            name: '广告栏',
            devHours: 1,
            devFullName: '白鹭',
            devUsername: 'userC1',
          },
        ],
      },
      {
        name: '登录',
        features: [],
      },
    ],
  },
  {
    projectKey: 'user',
    modules: [
      {
        name: '用户管理',
        features: [
          {
            name: '用户列表',
            devHours: 3,
            devFullName: '白鹭',
            devUsername: 'userC1',
          },
          {
            name: '用户详情',
            devHours: 2,
            devFullName: '白鹭',
            devUsername: 'userC1',
          },
        ],
      },
      {
        name: '角色管理',
        features: [],
      },
    ],
  },
];

export const projectHandlers: RequestHandler[] = [
  http.get('/api/search-project', async (req) => {
    const url = new URL(req.request.url, 'http://localhost');
    const searchName = url.searchParams.get('name');
    const projects = searchName
      ? mockProjects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchName.toLowerCase()) ||
            p.key.toLowerCase().includes(searchName.toLowerCase()),
        )
      : mockProjects;
    return HttpResponse.json({
      projects,
    });
  }),
  http.post('/api/project/:key', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const reqBody = await req.request.json();
    const newProject = DCreateProjectReq.validate(reqBody).unwrap();
    const ownerFullName = mockUsers.find(
      (u) => u.username === newProject.ownerUsername,
    )?.fullName;
    if (!ownerFullName) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到负责人',
      });
    }
    mockProjects.push({
      key,
      ...newProject,
      ownerFullName,
      numDevelopers: 0,
      numFeatures: 0,
      numIssues: 0,
    });
    return HttpResponse.json(mockProjects.find((p) => p.key === key));
  }),
  http.delete('/api/project/:key', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const index = mockProjects.findIndex((p) => p.key === key);
    if (index === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    mockProjects.splice(index, 1);
    return HttpResponse.json({
      type: 'success',
      msg: '删除成功',
    });
  }),
  http.put('/api/project/:key', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const reqBody = await req.request.json();
    const newProject = DCreateProjectReq.validate(reqBody).unwrap();
    const ownerFullName = mockUsers.find(
      (u) => u.username === newProject.ownerUsername,
    )?.fullName;
    if (!ownerFullName) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到负责人',
      });
    }
    const index = mockProjects.findIndex((p) => p.key === key);
    if (index === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    mockProjects[index] = {
      key,
      ...newProject,
      ownerFullName,
      numDevelopers: mockProjects[index].numDevelopers,
      numFeatures: mockProjects[index].numFeatures,
      numIssues: mockProjects[index].numIssues,
    };
    return HttpResponse.json(mockProjects[index]);
  }),
  http.get('/api/project/:key/modules', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const modules = mockModules.find((m) => m.projectKey === key);
    if (!modules) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    return HttpResponse.json(modules);
  }),
];
