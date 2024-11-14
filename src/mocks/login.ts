import { http, HttpResponse, RequestHandler } from 'msw';

export const loginHandlers: RequestHandler[] = [
  http.post('/login', () =>
    HttpResponse.json({
      token: 'mocked_token',
      role: 'admin',
    }),
  ),
];
