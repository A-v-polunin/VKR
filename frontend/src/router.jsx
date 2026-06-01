import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CreateRequestPage from './pages/CreateRequestPage'
import MyRequestsPage from './pages/MyRequestsPage'
import RequestDetailPage from './pages/RequestDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import ChatListPage from './pages/ChatListPage'
import ChatPage from './pages/ChatPage'
import NotificationsPage from './pages/NotificationsPage'
import SearchPage from './pages/SearchPage'
import HelpPage from './pages/HelpPage'
import ModerationPage from './pages/ModerationPage'
import Layout from './components/common/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Загрузка...</div>
  }

  return user ? children : <Navigate to="/login" />
}

function Router() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/help" element={<HelpPage />} />

        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/requests/create" element={
          <PrivateRoute><CreateRequestPage /></PrivateRoute>
        } />
        <Route path="/requests/my" element={
          <PrivateRoute><MyRequestsPage /></PrivateRoute>
        } />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/favorites" element={
          <PrivateRoute><FavoritesPage /></PrivateRoute>
        } />
        <Route path="/chat" element={
          <PrivateRoute><ChatListPage /></PrivateRoute>
        } />
        <Route path="/chat/:id" element={
          <PrivateRoute><ChatPage /></PrivateRoute>
        } />
        <Route path="/notifications" element={
          <PrivateRoute><NotificationsPage /></PrivateRoute>
        } />
        <Route path="/moderation" element={
          <PrivateRoute><ModerationPage /></PrivateRoute>
        } />
      </Routes>
    </Layout>
  )
}

export default Router
