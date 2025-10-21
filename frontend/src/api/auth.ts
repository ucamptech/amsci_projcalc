const STORAGE_KEY = "pc_auth_token"; // User auth token

let inMemoryToken: string | null = null;

export function getToken(): string | null {
  return inMemoryToken;
}

export function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function restoreTokenFromStorage(): string | null {
  const t = localStorage.getItem(STORAGE_KEY);
  inMemoryToken = t;
  return t;
}

export function clearToken() {
  inMemoryToken = null;
  localStorage.removeItem(STORAGE_KEY);
}
