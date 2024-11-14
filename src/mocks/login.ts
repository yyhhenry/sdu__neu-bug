import { http, HttpResponse, RequestHandler } from 'msw';

export const loginHandlers: RequestHandler[] = [
  http.post('/api/login', () =>
    HttpResponse.json({
      token: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expireAt: Date.now() + 1000 * 60 * 60 * 24,
      },
      role: 'admin',
    }),
  ),
];
