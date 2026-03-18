import { apiGet, apiPost } from '../../../lib/apiClient';

export async function savePersonalDetails(payload) {
  return apiPost('/api/onboarding/personal-details', payload);
}

export async function saveExpertise(payload) {
  return apiPost('/api/onboarding/expertise', payload);
}

export async function saveTags(payload) {
  return apiPost('/api/onboarding/tags', payload);
}

export async function getOnboarding(userUid) {
  return apiGet(`/api/onboarding/${userUid}`);
}
