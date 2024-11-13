import { useStorage } from '@vueuse/core';

export const theme = useStorage<'light' | 'dark'>('theme', 'dark');
