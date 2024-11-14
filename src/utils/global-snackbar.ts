import { ref, watchEffect } from 'vue';

export const globalSnackbar = ref<{
  msg: string;
  color?: 'info' | 'success' | 'error';
  until?: number;
}>();

watchEffect(() => {
  const until = globalSnackbar.value?.until;
  if (until !== undefined) {
    setTimeout(
      () => {
        if (globalSnackbar.value?.until === until) {
          globalSnackbar.value = undefined;
        }
      },
      Math.max(0, until - Date.now()),
    );
  }
});

export function showSnackbar(
  msg: string,
  color?: 'info' | 'success' | 'error',
  timeout: number = 1000,
) {
  const now = Date.now();
  globalSnackbar.value = { msg, color, until: now + timeout };
}

export type RuleSets<T> = ((v: T) => true | string)[];

export class GSnackbar {
  static info(msg: string, timeout: number = 1000) {
    showSnackbar(msg, 'info', timeout);
  }
  static success(msg: string, timeout: number = 1000) {
    showSnackbar(msg, 'success', timeout);
  }
  static error(msg: string, timeout: number = 1000) {
    showSnackbar(msg, 'error', timeout);
  }
  static accept<T>(v: T, ruleSets: RuleSets<T>) {
    for (const rule of ruleSets) {
      const result = rule(v);
      if (result !== true) {
        GSnackbar.error(result);
        return false;
      }
    }
    return true;
  }
}
