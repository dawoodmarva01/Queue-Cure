import { Outlet } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  History,
  LayoutDashboard,
  Layers,
  Settings,
  Stethoscope,
  Ticket,
  Users,
} from 'lucide-react'
import { AppShell } from '../components/AppShell.jsx'

export function ReceptionLayout() {
  return (
    <AppShell
      workspace={{ label: 'Reception desk', Icon: Ticket }}
      navLabel="Front desk"
      items={[
        { to: '/reception', label: 'Live queues', mobileLabel: 'Live', Icon: Ticket, end: true },
        { to: '/reception/appointments', label: 'Appointments', Icon: CalendarDays },
        { to: '/reception/history', label: 'Queue history', mobileLabel: 'Queue', Icon: History },
      ]}
      user={{ initials: 'FA', name: 'Farhan Ali', role: 'Receptionist' }}
      searchPlaceholder="Search patient, token or phone…"
    >
      <Outlet />
    </AppShell>
  )
}

export function DoctorLayout() {
  return (
    <AppShell
      workspace={{ label: 'Doctor workspace', Icon: Stethoscope }}
      navLabel="Consultation"
      items={[
        { to: '/doctor', label: 'My queue', mobileLabel: 'My', Icon: Stethoscope, end: true },
        { to: '/doctor/history', label: 'Consultations', Icon: ClipboardList },
      ]}
      user={{ initials: 'AR', name: 'Dr. Ananya Rao', role: 'General Medicine' }}
      searchPlaceholder="Search my patients…"
    >
      <Outlet />
    </AppShell>
  )
}

export function AdminLayout() {
  return (
    <AppShell
      workspace={{ label: 'Admin workspace', Icon: Building2 }}
      navLabel="Administration"
      items={[
        { to: '/admin', label: 'Overview', Icon: LayoutDashboard, end: true },
        { to: '/admin/appointments', label: 'Appointments', Icon: CalendarDays },
        { to: '/admin/staff', label: 'Staff & doctors', mobileLabel: 'Staff', Icon: Users },
        { to: '/admin/departments', label: 'Departments', Icon: Layers },
        { to: '/admin/reports', label: 'Reports', Icon: ChartColumn },
        { to: '/admin/settings', label: 'Clinic settings', mobileLabel: 'Settings', Icon: Settings },
      ]}
      user={{ initials: 'NR', name: 'Nandini Rao', role: 'Clinic admin' }}
      searchPlaceholder="Search patient, token or phone…"
    >
      <Outlet />
    </AppShell>
  )
}
