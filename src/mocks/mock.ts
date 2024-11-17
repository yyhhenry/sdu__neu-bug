import { accountHandlers } from './account';
import { setupWorker } from 'msw/browser';
import { projectHandlers } from './projects';

export const mockWorker = setupWorker(...accountHandlers, ...projectHandlers);
