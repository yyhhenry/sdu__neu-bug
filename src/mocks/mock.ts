import { loginHandlers } from './account';
import { setupWorker } from 'msw/browser';

export const mockWorker = setupWorker(...loginHandlers);
