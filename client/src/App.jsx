import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import SubmitReport from './pages/SubmitReport'
import MapView from './pages/MapView'
import PriorityList from './pages/PriorityList'
import AreaIntelligence from './pages/AreaIntelligence'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ReportDetail from './pages/ReportDetail'
import AreaDetail from './pages/AreaDetail'

function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return null
  if (!isAuth) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/map" replace />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="submit"     element={<SubmitReport />} />
            <Route path="map"        element={<MapView />} />
            <Route path="priority"   element={<PriorityList />} />
            <Route path="areas"      element={<AreaIntelligence />} />
            <Route path="admin"      element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="report/:id" element={<ReportDetail />} />
            <Route path="areas/:thana" element={<AreaDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
