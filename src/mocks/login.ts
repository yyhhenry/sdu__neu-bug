import { http, HttpResponse, RequestHandler } from 'msw';

const expireTime = 1000 * 60 * 5;

export const loginHandlers: RequestHandler[] = [
  http.post('/api/login', () =>
    HttpResponse.json({
      token: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expireAt: Date.now() + expireTime,
      },
      role: 'admin',
    }),
  ),
  http.post('/api/refresh', () =>
    HttpResponse.json({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expireAt: Date.now() + expireTime,
    }),
  ),
];
