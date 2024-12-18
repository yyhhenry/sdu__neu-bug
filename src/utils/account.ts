import {
  DNumber,
  DString,
  InferType,
  literal,
  struct,
} from '@yyhhenry/type-guard-map';
import { useCheckedStorage } from './storage';
import { computed } from 'vue';
import { GSnackbar } from './global-snackbar';
import { isEmail } from 'validator';

export const usernameRules = [
  (v: string) => v.length > 0 || '用户名不能为空',
  (v: string) => /^[a-zA-Z0-9]+$/.test(v) || '用户名只可以包含字母和数字',
  (v: string) => (v.length >= 5 && v.length <= 30) || '用户名长度应在5-30之间',
];
export const passwordRules = [
  (v: string) => v.length > 0 || '密码不能为空',
  (v: string) =>
    /^[\x20-\x7E]+$/.test(v) || '密码只可以包含可见ASCII字符和空格',
  (v: string) => (v.length >= 6 && v.length <= 20) || '密码长度应在6-20之间',
];
export const emailRules = [
  (v: string) => v.length > 0 || '邮箱不能为空',
  (v: string) => isEmail(v) || '邮箱格式不正确',
];

export const DMsgRes = struct({
  type: literal('info', 'success', 'error'),
  msg: DString,
});

export const DRole = literal('admin', 'user');
export type RoleType = InferType<typeof DRole>;
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
export function getPrivilegeNameOfRole(role: RoleType): '管理员' | '用户';
export function getPrivilegeNameOfRole(
  role?: RoleType,
): '未登录' | '管理员' | '用户';
export function getPrivilegeNameOfRole(role?: RoleType) {
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
export async function getAuthHeader(): Promise<{
  Authorization?: string;
}> {
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

export const DUserInfo = struct({
  username: DString,
  fullName: DString,
  role: DRole,
  email: DString,
});
export type UserInfo = InferType<typeof DUserInfo>;

/**
 * Get user information by username. (Admin only to get other's information)
 */
export async function getUserInfoApi(username?: string) {
  const target = username ?? accountStorage.value?.username;
  if (target === null) {
    throw new Error('未登录');
  }
  const res: unknown = await fetch(`/api/user/${target}`, {
    headers: await getAuthHeader(),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DUserInfo.validate(res).unwrap();
}

export interface ChangePasswordReq {
  oldPassword: string;
  newPassword: string;
}

export async function changePasswordApi(req: ChangePasswordReq) {
  const res: unknown = await fetch('/api/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}

/**
 * Edit user information. (Admin only)
 */
export async function editUserApi(username: string, req: UserInfo) {
  const res: unknown = await fetch(`/api/user/${username}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}

export interface SearchUserReq {
  username?: string;
  fullName?: string;
  email?: string;
  role?: string; // '' for all
}
export const DSearchUserRes = struct({
  users: DUserInfo.arr(),
});
/**
 * Search user by partial information. (Admin only)
 */
export async function searchUserApi(req: SearchUserReq) {
  const url = new URL('/api/search-user', window.location.origin);
  for (const key of ['username', 'fullName', 'email', 'role'] as const) {
    if (req[key]) {
      url.searchParams.set(key, req[key]!);
    }
  }
  const res: unknown = await fetch(url, {
    headers: await getAuthHeader(),
  }).then((res) => res.json());
  if (DMsgRes.guard(res)) {
    throw new Error(res.msg);
  }
  return DSearchUserRes.validate(res).unwrap().users;
}

/**
 * Delete user. (Admin only)
 */
export async function deleteUserApi(username: string) {
  const res: unknown = await fetch(`/api/user/${username}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}

export interface RegisterReq {
  info: UserInfo;
  password: string;
}
/**
 * Register a new account. (Admin only)
 */
export async function registerApi(req: RegisterReq) {
  const res: unknown = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeader()),
    },
    body: JSON.stringify(req),
  }).then((res) => res.json());
  const msgRes = DMsgRes.validate(res).unwrap();
  if (msgRes.type === 'error') {
    throw new Error(msgRes.msg);
  }
  return msgRes.msg;
}
