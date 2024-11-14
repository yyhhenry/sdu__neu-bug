import { loginHandlers } from './login';
import { setupWorker } from 'msw/browser';

export const mockWorker = setupWorker(...loginHandlers);
