import { loginHandlers } from './login';
import { setupWorker } from 'msw/browser';

export const mock = setupWorker(...loginHandlers);
