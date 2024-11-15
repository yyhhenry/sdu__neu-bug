import { useStorage } from '@vueuse/core';
import { TypeHelper } from '@yyhhenry/type-guard-map';
import { ref } from 'vue';

export function useCheckedStorage<T>(
  key: string,
  helper: TypeHelper<T>,
  defaultValue: T,
) {
  return useStorage<T>(key, defaultValue, undefined, {
    serializer: {
      read: (text) =>
        helper.parseWithDefault(text, helper.clone(defaultValue).unwrap()),
      write: JSON.stringify,
    },
  });
}

export function useRefreshCounter() {
  const counter = ref(0);
  const refresh = () => (counter.value += 1);
  const require = () => counter.value;
  return { counter, refresh, require };
}
