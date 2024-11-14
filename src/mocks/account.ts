import { DString, struct } from '@yyhhenry/type-guard-map';
import { http, HttpResponse, RequestHandler } from 'msw';

const expireTime = 1000 * 60 * 5;

export const loginHandlers: RequestHandler[] = [
  http.post('/api/login', async (req) => {
    const reqBody = await req.request.json();
    const DWithUsername = struct({ username: DString });
    const username = DWithUsername.validate(reqBody).unwrap().username;
    return HttpResponse.json({
      token: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expireAt: Date.now() + expireTime,
      },
      role: username === 'admin' ? 'admin' : 'user',
    });
  }),
  http.post('/api/refresh', () =>
    HttpResponse.json({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expireAt: Date.now() + expireTime,
    }),
  ),
  http.get('/api/user/:id', (req) =>
    HttpResponse.json({
      username: req.params.id,
      fullName: req.params.id === 'admin' ? '管理员甲' : '用户乙',
      role: req.params.id === 'admin' ? 'admin' : 'user',
      email: req.params.id + '@example.com',
    }),
  ),
];
