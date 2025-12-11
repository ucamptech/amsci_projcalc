const AUTH_STORAGE_KEY = "pc_auth_token"; // User auth token
const AUTH_USER_KEY = "pc_auth_user";

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function restoreTokenFromStorage(): string | null {
  const t = localStorage.getItem(AUTH_STORAGE_KEY);
  inMemoryToken = t;
  return t;
}

export function clearToken() {
  inMemoryToken = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}
