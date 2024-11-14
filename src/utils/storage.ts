import { useStorage } from '@vueuse/core';
import { TypeHelper } from '@yyhhenry/type-guard-map';

export function useCheckedStorage<T>(
  key: string,
  helper: TypeHelper<T>,
  defaultValue: T,
) {
  return useStorage<T>(key, defaultValue, undefined, {
    serializer: {
      read: (text) => helper.parseWithDefault(text, defaultValue),
      write: JSON.stringify,
    },
  });
}
