import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import RequestCard from '../requests/RequestCard'
import './UserRequestsSection.css'

function UserRequestsSection({ userId, isOwnProfile }) {
  const [activeCreated, setActiveCreated] = useState([])
  const [pastCreated, setPastCreated] = useState([])
  const [activeParticipations, setActiveParticipations] = useState([])
  const [pastParticipations, setPastParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active-created')

  useEffect(() => {
    if (userId || isOwnProfile) {
      loadRequests()
    }
  }, [userId, isOwnProfile])

  useEffect(() => {
    if (!isOwnProfile && userId) {
      setActiveTab('active-created')
    }
  }, [userId, isOwnProfile])

  const loadRequests = async () => {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const isOtherProfile = !isOwnProfile && userId

      if (isOtherProfile) {

        const createdRes = await api.get('/requests/', { params: { creator_id: userId } })
        const allCreated = createdRes.data?.results ?? createdRes.data ?? []
        const list = Array.isArray(allCreated) ? allCreated : []

        const active = list.filter(req => {
          if (req.status !== 'active' && req.status !== 'filled') return false
          const reqDate = new Date(req.date)
          const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
          if (reqDateOnly < today) return false
          if (reqDateOnly.getTime() === today.getTime() && req.time) {
            const [hours, minutes] = req.time.split(':').map(Number)
            const requestTime = new Date(today)
            requestTime.setHours(hours, minutes, 0, 0)
            if (requestTime < now) return false
          }
          return true
        })

        const past = list.filter(req => {
          if (req.status === 'completed' || req.status === 'cancelled') return true
          if (req.status === 'filled') return false
          if (req.status === 'active') {
            const reqDate = new Date(req.date)
            const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
            if (reqDateOnly < today) return true
            if (reqDateOnly.getTime() === today.getTime() && req.time) {
              const [hours, minutes] = req.time.split(':').map(Number)
              const requestTime = new Date(today)
              requestTime.setHours(hours, minutes, 0, 0)
              if (requestTime < now) return true
            }
          }
          return false
        })

        setActiveCreated(active)
        setPastCreated(past)
        setActiveParticipations([])
        setPastParticipations([])
      } else {

        const createdRes = await api.get('/requests/my/')
        const allCreated = createdRes.data || []

        const active = allCreated.filter(req => {
          if (req.status !== 'active' && req.status !== 'filled') return false
          const reqDate = new Date(req.date)
          const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
          if (reqDateOnly < today) return false
          if (reqDateOnly.getTime() === today.getTime() && req.time) {
            const [hours, minutes] = req.time.split(':').map(Number)
            const requestTime = new Date(today)
            requestTime.setHours(hours, minutes, 0, 0)
            if (requestTime < now) return false
          }
          return true
        })

        const past = allCreated.filter(req => {
          if (req.status === 'completed' || req.status === 'cancelled') return true
          if (req.status === 'filled') return false
          if (req.status === 'active') {
            const reqDate = new Date(req.date)
            const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
            if (reqDateOnly < today) return true
            if (reqDateOnly.getTime() === today.getTime() && req.time) {
              const [hours, minutes] = req.time.split(':').map(Number)
              const requestTime = new Date(today)
              requestTime.setHours(hours, minutes, 0, 0)
              if (requestTime < now) return true
            }
          }
          return false
        })

        setActiveCreated(active)
        setPastCreated(past)

        const participationsRes = await api.get('/requests/my/participations/').catch(() => ({ data: [] }))
        const userParticipations = participationsRes.data || []

        const activePart = userParticipations.filter(req => {
          if (req.status !== 'active' && req.status !== 'filled') return false
          const reqDate = new Date(req.date)
          const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
          if (reqDateOnly < today) return false
          if (reqDateOnly.getTime() === today.getTime() && req.time) {
            const [hours, minutes] = req.time.split(':').map(Number)
            const requestTime = new Date(today)
            requestTime.setHours(hours, minutes, 0, 0)
            if (requestTime < now) return false
          }
          return true
        })

        const pastPart = userParticipations.filter(req => {
          if (req.status === 'completed' || req.status === 'cancelled') return true
          if (req.status === 'filled') return false
          if (req.status === 'active') {
            const reqDate = new Date(req.date)
            const reqDateOnly = new Date(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate())
            if (reqDateOnly < today) return true
            if (reqDateOnly.getTime() === today.getTime() && req.time) {
              const [hours, minutes] = req.time.split(':').map(Number)
              const requestTime = new Date(today)
              requestTime.setHours(hours, minutes, 0, 0)
              if (requestTime < now) return true
            }
          }
          return false
        })

        setActiveParticipations(activePart)
        setPastParticipations(pastPart)
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="user-requests-section">Загрузка заявок...</div>
  }

  const isOtherProfile = !isOwnProfile && userId
  const tabs = isOtherProfile
    ? [
        { id: 'active-created', label: `Актуальные (${activeCreated.length})`, data: activeCreated },
        { id: 'past-created', label: `Прошедшие (${pastCreated.length})`, data: pastCreated },
      ]
    : [
        { id: 'active-created', label: `Мои активные (${activeCreated.length})`, data: activeCreated },
        { id: 'past-created', label: `Мои прошедшие (${pastCreated.length})`, data: pastCreated },
        { id: 'active-participations', label: `Участвую активно (${activeParticipations.length})`, data: activeParticipations },
        { id: 'past-participations', label: `Участвовал ранее (${pastParticipations.length})`, data: pastParticipations },
      ]

  const currentData = tabs.find(t => t.id === activeTab)?.data || []

  return (
    <div className="user-requests-section">
      <h2>{isOtherProfile ? 'Созданные заявки' : 'Мои заявки'}</h2>

      <div className="requests-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="requests-list">
        {currentData.length === 0 ? (
          <div className="no-requests">
            <p>Нет заявок в этой категории</p>
            {activeTab === 'active-created' && (
              <Link to="/requests/create" className="create-link">
                Создать заявку
              </Link>
            )}
          </div>
        ) : (
          currentData.map(request => (
            <Link key={request.id} to={`/requests/${request.id}`}>
              <RequestCard request={request} hideDescription={true} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default UserRequestsSection
