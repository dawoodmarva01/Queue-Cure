import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing.jsx'
import { ForgotPassword, Login, Register } from './pages/auth/AuthPages.jsx'
import NotFound from './pages/NotFound.jsx'
import Onboarding from './pages/onboarding/Onboarding.jsx'
import { TrackLookup, TrackToken } from './pages/track/Track.jsx'
import { AdminLayout, DoctorLayout, ReceptionLayout } from './pages/layouts.jsx'
import ReceptionLive from './pages/reception/ReceptionLive.jsx'
import ReceptionAppointments from './pages/reception/ReceptionAppointments.jsx'
import ReceptionHistory from './pages/reception/ReceptionHistory.jsx'
import DoctorQueue from './pages/doctor/DoctorQueue.jsx'
import DoctorHistory from './pages/doctor/DoctorHistory.jsx'
import AdminOverview from './pages/admin/AdminOverview.jsx'
import AdminAppointments from './pages/admin/AdminAppointments.jsx'
import AdminStaff from './pages/admin/AdminStaff.jsx'
import AdminDepartments from './pages/admin/AdminDepartments.jsx'
import AdminReports from './pages/admin/AdminReports.jsx'
import AdminSettings from './pages/admin/AdminSettings.jsx'

/** Scroll to top on page change, or to the #section when a hash is present. */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/track" element={<TrackLookup />} />
        <Route path="/track/:token" element={<TrackToken />} />

        <Route path="/reception" element={<ReceptionLayout />}>
          <Route index element={<ReceptionLive />} />
          <Route path="appointments" element={<ReceptionAppointments />} />
          <Route path="history" element={<ReceptionHistory />} />
        </Route>

        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorQueue />} />
          <Route path="history" element={<DoctorHistory />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="departments" element={<AdminDepartments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
