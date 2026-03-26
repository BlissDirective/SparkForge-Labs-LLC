/**
 * MSW Browser — for Playwright / browser-based tests
 *
 * Usage:
 *   import { worker } from '@/mocks/browser';
 *   worker.start();
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
