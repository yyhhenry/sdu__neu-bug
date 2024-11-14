import { DNumber, DString, literal, struct } from '@yyhhenry/type-guard-map';
import { useCheckedStorage } from './storage';
import { computed } from 'vue';

export const DMsgRes = struct({
  type: literal('info', 'success', 'error'),
  msg: DString,
});

export const DRole = literal('admin', 'user');
export const DTokenPair = struct({
  accessToken: DString,
  refreshToken: DString,
  expireAt: DNumber,
});

export const DAccountStorage = struct({
  username: DString,
  role: DRole,
  token: DTokenPair,
}).or(literal(null));

export const accountStorage = useCheckedStorage(
  'account',
  DAccountStorage,
  null,
);
export const adminPrivilege = computed(
  () => accountStorage.value?.role === 'admin',
);
export function getPrivilegeNameOfRole(role?: 'admin' | 'user') {
  if (role === undefined) {
    return '未登录';
  }
  return role === 'admin' ? '管理员' : '用户';
}
export const privilegeName = computed(() =>
  getPrivilegeNameOfRole(accountStorage.value?.role),
);

export const DLoginRes = struct({
  role: DRole,
  token: DTokenPair,
});

export interface LoginReq {
  username: string;
  password: string;
}
/**
 * Login with username and password
 * Throw error if failed
 */
export async function loginApi(req: LoginReq) {
  const res: unknown = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  const loginRes = DLoginRes.validate(res).unwrap();
  accountStorage.value = {
    username: req.username,
    role: loginRes.role,
    token: loginRes.token,
  };
  return accountStorage.value;
}
export function logoutApi() {
  accountStorage.value = null;
}
