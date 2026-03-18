// BroadcastChannel for cross-tab real-time patient updates
const CHANNEL_NAME = 'easyprescribe_patient_updates';

let channel = null;

function getChannel() {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcastPatientUpdate(event, patient) {
  const ch = getChannel();
  if (ch) {
    ch.postMessage({ event, patient, timestamp: Date.now() });
  }
}

export function onPatientUpdate(callback) {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (e) => callback(e.data);
  ch.addEventListener('message', handler);
  return () => ch.removeEventListener('message', handler);
}
