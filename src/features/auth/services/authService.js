import { apiPost } from '../../../lib/apiClient';

function normalizeUsername(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
}

export async function registerDoctor({ name, password }) {
  const username = normalizeUsername(name);

  return apiPost('/api/auth/register', {
    username,
    password,
    confirmPassword: password,
  });
}

export async function loginDoctor({ username, password }) {
  return apiPost('/api/auth/login', {
    username: username.trim().toLowerCase(),
    password,
  });
}

export async function registerReceptionist({ doctorUserUid, name, phone, password }) {
  return apiPost('/api/auth/register-receptionist', {
    doctorUserUid,
    name,
    phone,
    password,
  });
}

export async function loginByPhone({ phone, password }) {
  return apiPost('/api/auth/login-phone', {
    phone,
    password,
  });
}
