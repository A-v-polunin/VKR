import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import RequestCard from '../requests/RequestCard'
import DeleteRequestModal from '../requests/DeleteRequestModal'
import './RequestsModeration.css'

function RequestsModeration() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => {
    loadRequests()
  }, [filter])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/requests/', {
        params: filter !== 'all' ? { status: filter } : {}
      })
      setRequests(response.data)
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (request) => {
    setDeleteModal(request)
  }

  const handleDeleteConfirm = async (requestId, comment) => {
    try {
      await api.delete(`/requests/${requestId}/delete/`, {
        data: { reason: comment }
      })
      setDeleteModal(null)
      loadRequests()
      alert('Заявка удалена')
    } catch (error) {
      console.error('Ошибка удаления заявки:', error)
      alert('Не удалось удалить заявку')
      throw error
    }
  }

  if (loading) {
    return <div className="requests-moderation">Загрузка...</div>
  }

  return (
    <div className="requests-moderation">
      <div className="moderation-header">
        <h2>Модерация заявок</h2>
        <div className="filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'active' : ''}
          >
            Активные
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'active' : ''}
          >
            Завершённые
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={filter === 'cancelled' ? 'active' : ''}
          >
            Отменённые
          </button>
        </div>
      </div>

      <div className="requests-list">
        {requests.length === 0 ? (
          <p className="no-requests">Нет заявок</p>
        ) : (
          requests.map(request => (
            <div key={request.id} className="moderation-request-item">
              <Link
                to={`/requests/${request.id}`}
                style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
              >
                <RequestCard request={request} />
              </Link>
              <div className="moderation-actions">
                <button
                  onClick={() => handleDeleteClick(request)}
                  className="btn-delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteModal && (
        <DeleteRequestModal
          request={deleteModal}
          onConfirm={(comment) => handleDeleteConfirm(deleteModal.id, comment)}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  )
}

export default RequestsModeration
