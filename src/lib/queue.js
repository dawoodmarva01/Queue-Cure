import { useSyncExternalStore } from 'react'

/**
 * Demo queue store shared by the reception desk, doctor console, admin
 * overview and patient tracker. Everything is in-memory mock data: actions
 * taken in one workspace show up in the others until the page reloads.
 *
 * Times are minutes since midnight. The demo clock is frozen at 10:42 AM.
 */

export const NOW = 10 * 60 + 42

export const CLINIC = {
  name: 'Lumen Clinic',
  branch: 'Indiranagar',
  fullName: 'Lumen Multispecialty Clinic',
  city: 'Bengaluru',
}

/** Doctor status: 'consult' | 'available' | 'break' | 'off' */
const initialDoctors = [
  { id: 'd1', name: 'Dr. Ananya Rao', initials: 'AR', dept: 'General Medicine', prefix: 'GM', room: '104', status: 'consult', capacity: 40, avgConsult: 9 },
  { id: 'd2', name: 'Dr. Vikram Mehta', initials: 'VM', dept: 'Cardiology', prefix: 'CA', room: '201', status: 'consult', capacity: 24, avgConsult: 15 },
  { id: 'd3', name: 'Dr. Sarah Thomas', initials: 'ST', dept: 'Pediatrics', prefix: 'PE', room: '108', status: 'available', capacity: 30, avgConsult: 10 },
  { id: 'd4', name: 'Dr. Karan Shah', initials: 'KS', dept: 'Orthopedics', prefix: 'OR', room: '204', status: 'break', capacity: 28, avgConsult: 12 },
  { id: 'd5', name: 'Dr. Meera Iyer', initials: 'MI', dept: 'Dermatology', prefix: 'DE', room: '302', status: 'consult', capacity: 36, avgConsult: 8 },
  { id: 'd6', name: 'Dr. Rahul Nair', initials: 'RN', dept: 'ENT', prefix: 'EN', room: '305', status: 'off', capacity: 26, avgConsult: 10 },
]

let seq = 0
function t(doctorId, prefix, number, patient, reason, extra = {}) {
  seq += 1
  return {
    id: `t${seq}`,
    prefix,
    number,
    doctorId,
    patient,
    reason,
    kind: 'walkin',
    priority: 'normal',
    status: 'waiting',
    checkedInAt: NOW - 30,
    calledAt: null,
    startedAt: null,
    endedAt: null,
    note: '',
    ...extra,
  }
}

const p = (name, age, sex, phone) => ({ name, age, sex, phone })

const initialTokens = [
  // Dr. Ananya Rao — General Medicine
  t('d1', 'GM', 8, p('Aditya Kulkarni', 34, 'M', '+91 98450 22018'), 'Persistent cough', { status: 'done', checkedInAt: 9 * 60 + 20, startedAt: 9 * 60 + 39, endedAt: 9 * 60 + 48 }),
  t('d1', 'GM', 9, p('Kavya Reddy', 46, 'F', '+91 99001 33412'), 'Diabetes review', { status: 'done', checkedInAt: 9 * 60 + 25, startedAt: 9 * 60 + 48, endedAt: 9 * 60 + 57, kind: 'appt' }),
  t('d1', 'GM', 10, p('Suresh Pillai', 58, 'M', '+91 98860 71230'), 'Body ache & fatigue', { status: 'done', checkedInAt: 9 * 60 + 31, startedAt: 9 * 60 + 57, endedAt: 10 * 60 + 6 }),
  t('d1', 'GM', 11, p('Ayesha Begum', 37, 'F', '+91 97400 55120'), 'Migraine', { status: 'skipped', checkedInAt: 9 * 60 + 40, calledAt: 10 * 60 + 21 }),
  t('d1', 'GM', 12, p('Manoj Verma', 42, 'M', '+91 98455 10982'), 'Fever, 3 days', { status: 'done', checkedInAt: 9 * 60 + 44, startedAt: 10 * 60 + 15, endedAt: 10 * 60 + 24 }),
  t('d1', 'GM', 13, p('Divya Nambiar', 51, 'F', '+91 99860 44310'), 'Follow-up: BP review', { status: 'done', checkedInAt: 9 * 60 + 52, startedAt: 10 * 60 + 24, endedAt: 10 * 60 + 33 }),
  t('d1', 'GM', 14, p("Joseph D'Souza", 62, 'M', '+91 98001 04708'), 'Persistent cough', { status: 'serving', checkedInAt: 10 * 60 + 29, calledAt: 10 * 60 + 37, startedAt: 10 * 60 + 38 }),
  t('d1', 'GM', 15, p('Ishaan Malhotra', 11, 'M', '+91 99020 88123'), 'Diabetes review', { status: 'called', kind: 'appt', checkedInAt: 10 * 60 + 3, calledAt: 10 * 60 + 41 }),
  t('d1', 'GM', 16, p('Pooja Agarwal', 78, 'F', '+91 98440 61177'), 'Body ache & fatigue', { priority: 'priority', checkedInAt: 10 * 60 + 9, flags: 'Senior citizen · wheelchair' }),
  t('d1', 'GM', 17, p('Ramesh Gowda', 55, 'M', '+91 98861 22045'), 'Acidity, nausea', { checkedInAt: 10 * 60 + 15 }),
  t('d1', 'GM', 18, p('Sneha Patil', 29, 'F', '+91 99459 30871'), 'Fever, 3 days', { kind: 'appt', checkedInAt: 10 * 60 + 21 }),
  t('d1', 'GM', 19, p('Tanvir Ahmed', 41, 'M', '+91 98802 76511'), 'Follow-up: BP review', { checkedInAt: 10 * 60 + 27 }),
  t('d1', 'GM', 20, p('Meenakshi Sundaram', 49, 'F', '+91 97391 40026'), 'Persistent cough', { checkedInAt: 10 * 60 + 33 }),

  // Dr. Vikram Mehta — Cardiology
  t('d2', 'CA', 4, p('Harish Kumar', 64, 'M', '+91 98450 99012'), 'Chest discomfort', { status: 'done', checkedInAt: 9 * 60 + 30, startedAt: 9 * 60 + 58, endedAt: 10 * 60 + 13 }),
  t('d2', 'CA', 5, p('Lakshmi Narayan', 59, 'F', '+91 99001 22871'), 'ECG follow-up', { status: 'serving', kind: 'appt', checkedInAt: 9 * 60 + 52, calledAt: 10 * 60 + 28, startedAt: 10 * 60 + 29 }),
  t('d2', 'CA', 6, p('Prakash Jain', 67, 'M', '+91 98860 10334'), 'Palpitations', { checkedInAt: 10 * 60 + 5 }),
  t('d2', 'CA', 7, p('Farah Khan', 52, 'F', '+91 97410 66501'), 'BP medication review', { kind: 'appt', checkedInAt: 10 * 60 + 18 }),
  t('d2', 'CA', 8, p('Venkatesh Iyer', 71, 'M', '+91 98455 30921'), 'Breathlessness on walking', { priority: 'priority', checkedInAt: 10 * 60 + 30, flags: 'Senior citizen' }),

  // Dr. Sarah Thomas — Pediatrics
  t('d3', 'PE', 7, p('Aarav Shetty', 4, 'M', '+91 99860 12099'), 'Fever and cold', { status: 'done', checkedInAt: 9 * 60 + 40, startedAt: 10 * 60 + 20, endedAt: 10 * 60 + 31 }),
  t('d3', 'PE', 8, p('Myra Kapoor', 6, 'F', '+91 98861 45210'), 'Vaccination', { kind: 'appt', checkedInAt: 10 * 60 + 2 }),
  t('d3', 'PE', 9, p('Vihaan Rao', 2, 'M', '+91 99020 77345'), 'Ear pain', { checkedInAt: 10 * 60 + 12 }),
  t('d3', 'PE', 10, p('Anika Joshi', 8, 'F', '+91 97400 31188'), 'Skin rash', { checkedInAt: 10 * 60 + 24 }),
  t('d3', 'PE', 11, p('Kabir Menon', 5, 'M', '+91 98440 90012'), 'Cough, 1 week', { checkedInAt: 10 * 60 + 35 }),

  // Dr. Karan Shah — Orthopedics
  t('d4', 'OR', 5, p('Nikhil Bhat', 33, 'M', '+91 98450 61902'), 'Knee pain', { status: 'done', checkedInAt: 9 * 60 + 35, startedAt: 10 * 60 + 5, endedAt: 10 * 60 + 17 }),
  t('d4', 'OR', 6, p('Geeta Menon', 61, 'F', '+91 99001 54233'), 'Lower back pain', { checkedInAt: 10 * 60 + 6 }),
  t('d4', 'OR', 7, p('Rohit Saxena', 27, 'M', '+91 98860 21456'), 'Sprained ankle', { checkedInAt: 10 * 60 + 19 }),
  t('d4', 'OR', 8, p('Usha Rani', 55, 'F', '+91 97391 88720'), 'Shoulder stiffness', { kind: 'appt', checkedInAt: 10 * 60 + 31 }),

  // Dr. Meera Iyer — Dermatology
  t('d5', 'DE', 1, p('Neha Sinha', 24, 'F', '+91 98455 77310'), 'Acne review', { status: 'done', kind: 'appt', checkedInAt: 9 * 60 + 50, startedAt: 10 * 60 + 22, endedAt: 10 * 60 + 30 }),
  t('d5', 'DE', 2, p('Arjun Das', 31, 'M', '+91 99860 30219'), 'Eczema flare-up', { status: 'serving', checkedInAt: 10 * 60 + 1, calledAt: 10 * 60 + 33, startedAt: 10 * 60 + 34 }),
  t('d5', 'DE', 3, p('Priya Hegde', 36, 'F', '+91 98861 50923'), 'Hair fall', { checkedInAt: 10 * 60 + 10 }),
  t('d5', 'DE', 4, p('Sameer Qureshi', 45, 'M', '+91 99020 61844'), 'Fungal infection', { checkedInAt: 10 * 60 + 20 }),
  t('d5', 'DE', 5, p('Anjali Pai', 28, 'F', '+91 97400 72931'), 'Pigmentation', { kind: 'appt', checkedInAt: 10 * 60 + 28 }),
  t('d5', 'DE', 6, p('Mohan Lal', 66, 'M', '+91 98440 11829'), 'Itching, 2 weeks', { checkedInAt: 10 * 60 + 38 }),

  // Dr. Rahul Nair — ENT
  t('d6', 'EN', 1, p('Sunita Murthy', 50, 'F', '+91 98450 41207'), 'Blocked ear', { checkedInAt: 10 * 60 + 25 }),
]

export const initialAppointments = [
  { id: 'a1', time: 10 * 60 + 30, patient: 'Gautam Sen', doctorId: 'd4', status: 'noshow' },
  { id: 'a2', time: 11 * 60, patient: 'Rekha Srinivasan', doctorId: 'd2', status: 'booked' },
  { id: 'a3', time: 11 * 60 + 15, patient: 'Mohit Arora', doctorId: 'd1', status: 'booked' },
  { id: 'a4', time: 11 * 60 + 30, patient: 'Leela Paul', doctorId: 'd3', status: 'booked' },
  { id: 'a5', time: 12 * 60, patient: 'Shalini Raj', doctorId: 'd5', status: 'booked' },
  { id: 'a6', time: 12 * 60 + 30, patient: 'Varun Chopra', doctorId: 'd1', status: 'booked' },
  { id: 'a7', time: 14 * 60, patient: 'Deepa Krishnan', doctorId: 'd2', status: 'booked' },
]

let state = {
  doctors: initialDoctors,
  tokens: initialTokens,
  appointments: initialAppointments,
  activity: [],
  online: true,
}

const listeners = new Set()

function setState(updater) {
  state = { ...state, ...updater(state) }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: subscribe to the whole queue state. */
export function useQueue() {
  return useSyncExternalStore(subscribe, () => state)
}

/* ---------- formatting helpers ---------- */

export function formatTime(minutes) {
  const h24 = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  const h12 = ((h24 + 11) % 12) + 1
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

export function pad3(n) {
  return String(n).padStart(3, '0')
}

export function tokenCode(token) {
  return `${token.prefix}-${pad3(token.number)}`
}

export function sexLabel(sex) {
  return { M: 'Male', F: 'Female', O: 'Other' }[sex] ?? sex
}

/* ---------- selectors ---------- */

const priorityRank = { emergency: 0, priority: 1, normal: 2 }

/** Waiting tokens for a doctor, in call order (emergency → priority → arrival). */
export function waitingFor(s, doctorId) {
  return s.tokens
    .filter((tk) => tk.doctorId === doctorId && tk.status === 'waiting')
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] || a.checkedInAt - b.checkedInAt,
    )
}

/** Called + waiting tokens for a doctor (the full line, called first). */
export function lineFor(s, doctorId) {
  const called = s.tokens.filter((tk) => tk.doctorId === doctorId && tk.status === 'called')
  return [...called, ...waitingFor(s, doctorId)]
}

export function servingFor(s, doctorId) {
  return s.tokens.find((tk) => tk.doctorId === doctorId && tk.status === 'serving') ?? null
}

export function doneFor(s, doctorId) {
  return s.tokens
    .filter((tk) => tk.doctorId === doctorId && tk.status === 'done')
    .sort((a, b) => b.endedAt - a.endedAt)
}

export function skippedFor(s, doctorId) {
  return s.tokens.filter((tk) => tk.doctorId === doctorId && tk.status === 'skipped')
}

export function doctorById(s, id) {
  return s.doctors.find((d) => d.id === id)
}

export function findToken(s, code) {
  const normalized = code.toUpperCase().replace(/\s/g, '')
  return s.tokens.find((tk) => tokenCode(tk) === normalized) ?? null
}

/** Estimated minutes until the token is seen (position × doctor's avg consult). */
export function estimateWait(s, token) {
  const doctor = doctorById(s, token.doctorId)
  const line = lineFor(s, token.doctorId)
  const idx = line.findIndex((tk) => tk.id === token.id)
  if (idx < 0) return 0
  return (idx + 1) * doctor.avgConsult + (servingFor(s, token.doctorId) ? 0 : -doctor.avgConsult + 5)
}

export function positionInLine(s, token) {
  return lineFor(s, token.doctorId).findIndex((tk) => tk.id === token.id)
}

export function clinicStats(s) {
  const waiting = s.tokens.filter((tk) => tk.status === 'waiting' || tk.status === 'called')
  const serving = s.tokens.filter((tk) => tk.status === 'serving')
  const done = s.tokens.filter((tk) => tk.status === 'done')
  const longest = waiting.reduce((max, tk) => Math.max(max, NOW - tk.checkedInAt), 0)
  return {
    waiting: waiting.length,
    serving: serving.length,
    seen: done.length + 22, // + consults completed before the demo data starts
    longestWait: longest,
    emergencies: waiting.filter((tk) => tk.priority === 'emergency').length,
    onDuty: s.doctors.filter((d) => d.status !== 'off').length,
    issued: s.tokens.length + 20,
  }
}

/* ---------- actions ---------- */

function log(text, kind = 'info') {
  return { id: `act${Date.now()}${Math.random()}`, at: NOW, text, kind }
}

/** Issue a new token. Returns the created token. */
export function issueToken({ doctorId, name, age, sex, phone, reason, kind = 'walkin', priority = 'normal' }) {
  const doctor = doctorById(state, doctorId)
  const maxNumber = state.tokens
    .filter((tk) => tk.prefix === doctor.prefix)
    .reduce((max, tk) => Math.max(max, tk.number), 0)
  seq += 1
  const token = {
    id: `t${seq}`,
    prefix: priority === 'emergency' ? 'EM' : doctor.prefix,
    number: priority === 'emergency' ? state.tokens.filter((tk) => tk.prefix === 'EM').length + 1 : maxNumber + 1,
    doctorId,
    patient: { name, age: Number(age) || null, sex, phone },
    reason: reason || 'General consultation',
    kind,
    priority,
    status: 'waiting',
    checkedInAt: NOW,
    calledAt: null,
    startedAt: null,
    endedAt: null,
    note: '',
  }
  setState((s) => ({
    tokens: [...s.tokens, token],
    activity: [log(`${tokenCode(token)} issued to ${name} for ${doctor.name}`, 'issue'), ...s.activity],
  }))
  return token
}

/** Finish whoever is being served and call the next patient in line. */
export function callNext(doctorId) {
  setState((s) => {
    const next = lineFor(s, doctorId)[0]
    const tokens = s.tokens.map((tk) => {
      if (tk.doctorId === doctorId && tk.status === 'serving') return { ...tk, status: 'done', endedAt: NOW }
      if (next && tk.id === next.id) return { ...tk, status: 'serving', calledAt: tk.calledAt ?? NOW, startedAt: NOW }
      return tk
    })
    const doctors = s.doctors.map((d) =>
      d.id === doctorId ? { ...d, status: next ? 'consult' : 'available' } : d,
    )
    const entry = next
      ? log(`${tokenCode(next)} called to Room ${doctorById(s, doctorId).room}`, 'call')
      : log(`${doctorById(s, doctorId).name} has no one waiting`, 'info')
    return { tokens, doctors, activity: [entry, ...s.activity] }
  })
}

export function completeToken(tokenId, note = '') {
  setState((s) => {
    const token = s.tokens.find((tk) => tk.id === tokenId)
    return {
      tokens: s.tokens.map((tk) => (tk.id === tokenId ? { ...tk, status: 'done', endedAt: NOW, note } : tk)),
      doctors: s.doctors.map((d) => (d.id === token.doctorId ? { ...d, status: 'available' } : d)),
      activity: [log(`${tokenCode(token)} consultation completed`, 'done'), ...s.activity],
    }
  })
}

export function skipToken(tokenId) {
  setState((s) => {
    const token = s.tokens.find((tk) => tk.id === tokenId)
    return {
      tokens: s.tokens.map((tk) => (tk.id === tokenId ? { ...tk, status: 'skipped', calledAt: tk.calledAt ?? NOW } : tk)),
      activity: [log(`${tokenCode(token)} skipped — not present`, 'skip'), ...s.activity],
    }
  })
}

export function recallToken(tokenId) {
  setState((s) => {
    const token = s.tokens.find((tk) => tk.id === tokenId)
    return {
      tokens: s.tokens.map((tk) => (tk.id === tokenId ? { ...tk, status: 'waiting', priority: 'priority' } : tk)),
      activity: [log(`${tokenCode(token)} recalled to the front of the line`, 'recall'), ...s.activity],
    }
  })
}

export function setPriority(tokenId, priority) {
  setState((s) => ({
    tokens: s.tokens.map((tk) => (tk.id === tokenId ? { ...tk, priority } : tk)),
  }))
}

export function cancelToken(tokenId) {
  setState((s) => {
    const token = s.tokens.find((tk) => tk.id === tokenId)
    return {
      tokens: s.tokens.filter((tk) => tk.id !== tokenId),
      activity: [log(`${tokenCode(token)} cancelled`, 'skip'), ...s.activity],
    }
  })
}

export function setDoctorStatus(doctorId, status) {
  setState((s) => ({
    doctors: s.doctors.map((d) => (d.id === doctorId ? { ...d, status } : d)),
    activity: [log(`${doctorById(s, doctorId).name} marked ${status === 'break' ? 'on break' : status}`, 'info'), ...s.activity],
  }))
}

export function setAppointmentStatus(appointmentId, status) {
  setState((s) => ({
    appointments: s.appointments.map((a) => (a.id === appointmentId ? { ...a, status } : a)),
  }))
}

export function toggleOnline() {
  setState((s) => ({ online: !s.online }))
}
