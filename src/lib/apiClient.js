import { demoApiRequest } from './demoStore';

async function withLatency(callback) {
  const result = await callback();
  await new Promise((resolve) => setTimeout(resolve, 120));
  return result;
}

export async function apiPost(path, body) {
  return withLatency(() => demoApiRequest('POST', path, body));
}

export async function apiPatch(path, body) {
  return withLatency(() => demoApiRequest('PATCH', path, body));
}

export async function apiGet(path) {
  return withLatency(() => demoApiRequest('GET', path));
}
