import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import RequestCard from '../components/requests/RequestCard'
import ParticipantsList from '../components/requests/ParticipantsList'
import './MyRequestsPage.css'

function MyRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const response = await api.get('/requests/my/')
      setRequests(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await api.patch(`/requests/${requestId}/edit/`, { status: newStatus })
      loadRequests()
    } catch (error) {
      console.error('Ошибка изменения статуса:', error)
    }
  }

  const handleParticipantAction = async (requestId, userId, action) => {
    try {
      loadRequests()
    } catch (error) {
      console.error('Ошибка действия с участником:', error)
    }
  }

  if (loading) {
    return <div className="my-requests-page">Загрузка...</div>
  }

  return (
    <div className="my-requests-page">
      <div className="page-header">
        <h1>Мои заявки</h1>
        <Link to="/requests/create" className="create-button">
          Создать новую заявку
        </Link>
      </div>

      <div className="requests-list">
        {requests.map(request => (
          <div key={request.id} className="request-item">
            <RequestCard request={request} />
            <div className="request-actions">
              <select
                value={request.status}
                onChange={(e) => handleStatusChange(request.id, e.target.value)}
                className="status-select"
              >
                <option value="active">Активна</option>
                <option value="pending">Ожидает подтверждения</option>
                <option value="filled">Набрана</option>
                <option value="completed">Завершена</option>
                <option value="cancelled">Отменена</option>
              </select>
              <Link to={`/requests/${request.id}`} className="edit-link">
                Редактировать
              </Link>
              <button
                onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                className="participants-button"
              >
                Участники
              </button>
            </div>
            {selectedRequest === request.id && (
              <ParticipantsList
                requestId={request.id}
                onAction={handleParticipantAction}
              />
            )}
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="no-requests">
          <p>У вас пока нет заявок</p>
          <Link to="/requests/create" className="create-button">
            Создать первую заявку
          </Link>
        </div>
      )}
    </div>
  )
}

export default MyRequestsPage
