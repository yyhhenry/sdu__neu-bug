import {
  DCreateProjectReq,
  DIssueInfo,
  DModuleInfo,
  DModuleList,
  ProjectInfo,
} from '@/utils/projects';
import { DString, InferType, struct } from '@yyhhenry/type-guard-map';
import { http, HttpResponse, RequestHandler } from 'msw';

export const mockProjects: ProjectInfo[] = [
  {
    key: 'blog',
    name: '个人博客系统',
    description: '用于个人博客的系统',
    ownerUsername: 'admin',
    date: '2016-07-25',
    numDevelopers: 2,
    numFeatures: 2,
    numIssues: 2,
  },
  {
    key: 'user',
    name: '用户管理系统',
    description: '用于用户管理的系统',
    ownerUsername: 'userC1',
    date: '2016-07-25',
    numDevelopers: 1,
    numFeatures: 2,
    numIssues: 1,
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
            devUsername: 'student',
          },
          {
            name: '广告栏',
            devHours: 1,
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
            devUsername: 'userC1',
          },
          {
            name: '用户详情',
            devHours: 2,
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
export const DMockIssues = struct({
  projectKey: DString,
  issues: DIssueInfo.arr(),
});
export type MockIssues = InferType<typeof DMockIssues>;
export const mockIssues: MockIssues[] = [
  {
    projectKey: 'blog',
    issues: [
      {
        id: '1',
        title: '广告栏显示不正常',
        description: '广告栏显示不正常，需要调整',
        moduleName: '首页',
        featureName: '广告栏',
        level: '轻微',
        status: '已解决',
        createTime: '2021-07-25 12:20:01',
        creatorUsername: 'userC1',
        solveTime: '2021-07-25 12:24:33',
        devUsername: 'student',
        tag: '已解决',
        feedback: '已调整',
      },
      {
        id: '2',
        title: '导航栏链接错误',
        description: '导航栏链接错误，需要修复',
        moduleName: '首页',
        featureName: '导航栏',
        level: '次要',
        status: '开放中',
        createTime: '2024-07-25 12:20:01',
        creatorUsername: 'userC1',
        tag: '无法重现',
        devUsername: undefined,
        solveTime: undefined,
        feedback: '无法重现，等待测试给出详细的重现步骤',
      },
    ],
  },
  {
    projectKey: 'user',
    issues: [
      {
        id: '1',
        title: '用户列表无法显示',
        description: '用户列表无法显示，原因不明',
        moduleName: '用户管理',
        featureName: '用户列表',
        level: '一般',
        status: '已关闭',
        createTime: '2021-07-25 21:00:30',
        creatorUsername: 'student',
        tag: '不是错误',
        devUsername: undefined,
        solveTime: undefined,
        feedback: '测试人员未使用正确的账号',
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
    mockProjects.push({
      key,
      ...newProject,
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
    const index = mockProjects.findIndex((p) => p.key === key);
    if (index === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    const { numDevelopers, numFeatures, numIssues } = mockProjects[index];
    mockProjects[index] = {
      key,
      ...newProject,
      numDevelopers,
      numFeatures,
      numIssues,
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
  http.put('/api/project/:key/modules', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const reqBody = await req.request.json();
    const newModules = DModuleList.validate(reqBody).unwrap();
    const index = mockModules.findIndex((m) => m.projectKey === key);
    if (index === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    mockModules[index] = {
      projectKey: key,
      modules: newModules.modules,
    };
    const setDevelopers = new Set<string>();
    let numFeatures = 0;
    for (const module of newModules.modules) {
      for (const feature of module.features) {
        setDevelopers.add(feature.devUsername);
        numFeatures++;
      }
    }
    setDevelopers.delete('');
    const projectIndex = mockProjects.findIndex((p) => p.key === key);
    if (projectIndex !== -1) {
      mockProjects[projectIndex].numDevelopers = setDevelopers.size;
      mockProjects[projectIndex].numFeatures = numFeatures;
    }
    return HttpResponse.json({
      type: 'success',
      msg: '更新成功',
    });
  }),
  http.get('/api/project/:key/issue', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const url = new URL(req.request.url, 'http://localhost');
    const issueList = mockIssues.find((i) => i.projectKey === key);
    if (!issueList) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }
    let issues = issueList.issues;

    // Define fields that require exact matching
    const exactMatchFields = ['level', 'status', 'tag'];

    url.searchParams.forEach((value, key) => {
      issues = issues.filter((issue) => {
        const issueValue = issue[key as keyof typeof issue];
        if (exactMatchFields.includes(key)) {
          // Exact match for level, status, and tag
          return issueValue === value;
        } else {
          // Contains match for other string fields
          return (
            typeof issueValue === 'string' &&
            issueValue.toLowerCase().includes(value.toLowerCase())
          );
        }
      });
    });

    return HttpResponse.json({ issues });
  }),
  http.post('/api/project/:key/issue', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const reqBody = await req.request.json();
    const newIssue = DIssueInfo.validate(reqBody).unwrap();

    const index = mockIssues.findIndex((i) => i.projectKey === key);

    // Generate new ID
    const projectIssues = index === -1 ? [] : mockIssues[index].issues;
    const maxId = Math.max(0, ...projectIssues.map((i) => parseInt(i.id) || 0));
    newIssue.id = (maxId + 1).toString();

    if (index === -1) {
      mockIssues.push({
        projectKey: key,
        issues: [newIssue],
      });
    } else {
      mockIssues[index].issues.push(newIssue);
    }

    const projectIndex = mockProjects.findIndex((p) => p.key === key);
    if (projectIndex !== -1) {
      mockProjects[projectIndex].numIssues++;
    }

    return HttpResponse.json({
      type: 'success',
      msg: '创建成功',
    });
  }),
  http.delete('/api/project/:key/issue/:id', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const id = DString.validate(req.params.id).unwrap();

    const projectIssues = mockIssues.find((i) => i.projectKey === key);
    if (!projectIssues) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }

    const issueIndex = projectIssues.issues.findIndex((i) => i.id === id);
    if (issueIndex === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到问题',
      });
    }

    projectIssues.issues.splice(issueIndex, 1);
    const projectIndex = mockProjects.findIndex((p) => p.key === key);
    if (projectIndex !== -1) {
      mockProjects[projectIndex].numIssues--;
    }

    return HttpResponse.json({
      type: 'success',
      msg: '删除成功',
    });
  }),
  http.put('/api/project/:key/issue/:id', async (req) => {
    const key = DString.validate(req.params.key).unwrap();
    const id = DString.validate(req.params.id).unwrap();
    const reqBody = await req.request.json();
    const updatedIssue = DIssueInfo.validate(reqBody).unwrap();

    const projectIssues = mockIssues.find((i) => i.projectKey === key);
    if (!projectIssues) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到项目',
      });
    }

    const issueIndex = projectIssues.issues.findIndex((i) => i.id === id);
    if (issueIndex === -1) {
      return HttpResponse.json({
        type: 'error',
        msg: '找不到问题',
      });
    }

    projectIssues.issues[issueIndex] = updatedIssue;
    return HttpResponse.json({
      type: 'success',
      msg: '更新成功',
    });
  }),
];
