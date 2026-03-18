import { apiGet } from '../../../lib/apiClient';

export async function getPatientsByDoctor(doctorUserUid) {
  return apiGet(`/api/patients?doctorUserUid=${doctorUserUid}`);
}

export async function getPatientByPhone(phone) {
  return apiGet(`/api/patients/by-phone/${phone}`);
}
