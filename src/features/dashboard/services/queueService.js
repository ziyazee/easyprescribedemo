import { apiGet, apiPost, apiPatch } from '../../../lib/apiClient';

export async function addToQueue(doctorUserUid, patient) {
  return apiPost('/api/queue/add', {
    doctorUserUid,
    patientName: patient.name,
    patientPhone: patient.phone,
    gender: patient.gender,
    age: patient.age,
    complaint: patient.complaint,
    priority: patient.priority || false,
  });
}

export async function getTodayQueue(doctorUserUid) {
  return apiGet(`/api/queue/today?doctorUserUid=${doctorUserUid}`);
}

export async function updateQueueStatus(queueEntryUid, status) {
  return apiPatch('/api/queue/status', { queueEntryUid, status });
}

export async function callNextInQueue(doctorUserUid) {
  return apiPost('/api/queue/call-next', { doctorUserUid });
}
