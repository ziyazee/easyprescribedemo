import { apiGet, apiPost } from '../../../lib/apiClient';

function toInternationalPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return digits.startsWith('91') ? digits : `91${digits}`;
}

export async function lookupPatientByPhone(phone) {
  const normalized = toInternationalPhone(phone);
  return apiGet(`/api/patients/by-phone/${normalized}`);
}

export async function createPrescription(payload) {
  const body = {
    ...payload,
    patientPhone: toInternationalPhone(payload.patientPhone),
  };
  return apiPost('/api/prescriptions', body);
}

export async function getPrescription(prescriptionUid) {
  return apiGet(`/api/prescriptions/${prescriptionUid}`);
}

export async function sendPrescriptionWhatsApp(prescriptionUid) {
  return apiPost(`/api/prescriptions/${prescriptionUid}/send-whatsapp`, {});
}

export async function listPrescriptions(doctorUserUid) {
  return apiGet(`/api/prescriptions?doctorUserUid=${doctorUserUid}`);
}
