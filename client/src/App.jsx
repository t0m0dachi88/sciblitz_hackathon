import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import SubmitReport from './pages/SubmitReport'
import MapView from './pages/MapView'
import PriorityList from './pages/PriorityList'
import AreaIntelligence from './pages/AreaIntelligence'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="submit"     element={<SubmitReport />} />
          <Route path="map"        element={<MapView />} />
          <Route path="priority"   element={<PriorityList />} />
          <Route path="areas"      element={<AreaIntelligence />} />
          <Route path="admin"      element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
