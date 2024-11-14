import { DNumber, DString, literal, struct } from '@yyhhenry/type-guard-map';
import { useCheckedStorage } from './storage';
import { computed } from 'vue';
import { GSnackbar } from './global-snackbar';

export const DMsgRes = struct({
  type: literal('info', 'success', 'error'),
  msg: DString,
});

export const DRole = literal('admin', 'user');
export const DTokenPair = struct({
  accessToken: DString,
  refreshToken: DString,
  // expireAt is a timestamp, in milliseconds, representing the time when the **access token** will expire
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
/**
 * Refresh access token with refresh token.
 * Do nothing if not logged in or access token is not expired in 1 minute.
 */
export async function refreshTokenApi() {
  if (
    accountStorage.value === null ||
    accountStorage.value.token.expireAt >= Date.now() + 1000 * 60
  ) {
    return;
  }
  const res: unknown = await fetch('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken: accountStorage.value.token.refreshToken,
    }),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    // If refresh failed, clear the accountStorage
    accountStorage.value = null;
    GSnackbar.error(res.msg);
    // But do not throw error, the pending request may still be valid
    return;
  }
  const token = DTokenPair.validate(res).unwrap();
  accountStorage.value.token = token;
}
/**
 * Get Authorization header for API request
 * @example
 * ```ts
 * const res = await fetch('/api/secret', {
 *   headers: {
 *     ...await getAuthHeader(),
 *     'Content-Type': 'application/json',
 *   },
 *   method: 'POST',
 *   body: "{}",
 * });
 * ```
 */
export async function getAuthHeader() {
  await refreshTokenApi();
  if (accountStorage.value === null) {
    return {};
  }
  return {
    Authorization: `Bearer ${accountStorage.value.token.accessToken}`,
  };
}
/**
 * Logout.
 * Actually, it just clear the accountStorage.
 */
export function logoutApi() {
  accountStorage.value = null;
}
