import { DRole, DUserInfo, SearchUserReq, UserInfo } from '@/utils/account';
import { DString, struct, TypeHelper } from '@yyhhenry/type-guard-map';
import { http, HttpResponse, RequestHandler } from 'msw';

const expireTime = 1000 * 60 * 5;

let mockUsers: UserInfo[] = [
  {
    username: 'admin',
    fullName: '管理员',
    role: 'admin',
    email: 'admin@example.com',
  },
  {
    username: 'user',
    fullName: 'Json',
    role: 'user',
    email: 'user@example.com',
  },
  {
    username: 'student',
    fullName: 'LiLei',
    role: 'user',
    email: 'student@example.com',
  },
  {
    username: 'adminC',
    fullName: '管理员C',
    role: 'admin',
    email: 'adminc@example.com',
  },
  {
    username: 'cUser3',
    fullName: '普通用户3',
    role: 'user',
    email: 'cuser3@example.com',
  },
  {
    username: 'userC1',
    fullName: '白鹭',
    role: 'user',
    email: 'userc1@example.com',
  },
];

export const loginHandlers: RequestHandler[] = [
  http.post('/api/login', async (req) => {
    const reqBody = await req.request.json();
    const DLoginReq = struct({
      username: DString,
      password: DString,
    });
    const { username, password } = DLoginReq.validate(reqBody).unwrap();
    const info = mockUsers.find((u) => u.username === username);
    if (!info) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户不存在',
      });
    }
    if (!password.startsWith('123456')) {
      return HttpResponse.json({
        type: 'error',
        msg: '密码错误',
      });
    }
    return HttpResponse.json({
      token: {
        accessToken: info.role,
        refreshToken: info.role,
        expireAt: Date.now() + expireTime,
      },
      role: info.role,
    });
  }),
  http.post('/api/refresh', async (req) => {
    const reqBody = await req.request.json();
    const DRefreshReq = struct({
      refreshToken: DString,
    });
    const { refreshToken: token } = DRefreshReq.validate(reqBody).unwrap();
    // 作为模拟，直接返回原 token
    return HttpResponse.json({
      accessToken: token,
      refreshToken: token,
      expireAt: Date.now() + expireTime,
    });
  }),
  http.get('/api/user/:id', async (req) => {
    const DGetUserInfoParams = struct({
      id: DString,
    });
    const { id } = DGetUserInfoParams.validate(req.params).unwrap();
    const info = mockUsers.find((u) => u.username === id);
    if (!info) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户不存在',
      });
    }
    return HttpResponse.json(info);
  }),
  http.post('/api/change-password', () =>
    // Do nothing
    HttpResponse.json({
      type: 'success',
      msg: '密码修改成功',
    }),
  ),
  http.post('/api/user/:id', async (req) => {
    // 作为模拟，不检查权限
    const DEditUserParams = struct({
      id: DString,
    });
    const { id } = DEditUserParams.validate(req.params).unwrap();
    const info = mockUsers.find((u) => u.username === id);
    if (!info) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户不存在',
      });
    }
    const reqBody = await req.request.json();
    const newInfo = DUserInfo.validate(reqBody).unwrap();
    if (
      newInfo.username !== id &&
      mockUsers.find((u) => u.username === newInfo.username)
    ) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户名已存在',
      });
    }
    // This may change the id of the user
    mockUsers = [...mockUsers.filter((u) => u.username !== id), newInfo];
    return HttpResponse.json({
      type: 'success',
      msg: '用户信息修改成功',
    });
  }),
  http.get('/api/search-user', async (req) => {
    const DSearchUserParams: TypeHelper<SearchUserReq> = struct({
      username: DString.opt(),
      fullName: DString.opt(),
      email: DString.opt(),
      role: DRole.opt(),
    });
    const params = DSearchUserParams.validate(req.params).unwrap();
    let results = mockUsers;
    for (const key of ['username', 'fullName', 'email', 'role'] as const) {
      if (params[key]) {
        results = results.filter((u) => u[key].indexOf(params[key]!) !== -1);
      }
    }
    return HttpResponse.json({ users: results });
  }),
  http.delete('/api/user/:id', async (req) => {
    const DDeleteUserParams = struct({
      id: DString,
    });
    const { id } = DDeleteUserParams.validate(req.params).unwrap();
    const info = mockUsers.find((u) => u.username === id);
    if (!info) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户不存在',
      });
    }
    mockUsers = mockUsers.filter((u) => u.username !== id);
    return HttpResponse.json({
      type: 'success',
      msg: '用户删除成功',
    });
  }),
  http.post('/api/register', async (req) => {
    const DRegisterReq = struct({
      info: DUserInfo,
      password: DString,
    });
    const { info } = DRegisterReq.validate(await req.request.json()).unwrap();
    if (mockUsers.find((u) => u.username === info.username)) {
      return HttpResponse.json({
        type: 'error',
        msg: '用户已存在',
      });
    }
    mockUsers.push(info);
    return HttpResponse.json({
      type: 'success',
      msg: '用户注册成功',
    });
  }),
];
