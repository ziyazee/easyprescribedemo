import { apiGet } from '../../../lib/apiClient';

export async function getDashboardOverview(doctorUserUid, limit = 10) {
  return apiGet(`/api/dashboard/overview?doctorUserUid=${doctorUserUid}&limit=${limit}`);
}
