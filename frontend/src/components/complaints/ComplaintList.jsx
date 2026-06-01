import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './ComplaintList.css'

function ComplaintList({ complaints, onUpdate }) {
  const [resolvingId, setResolvingId] = useState(null)
  const [comment, setComment] = useState('')

  const handleResolve = async (id, status) => {
    try {
      await api.post(`/moderation/complaints/${id}/resolve/`, {
        status,
        moderator_comment: comment || (status === 'rejected' ? 'Отклонено' : status === 'resolved' ? 'Решено' : 'Рассмотрено')
      })
      setResolvingId(null)
      setComment('')
      onUpdate()
      alert('Жалоба обработана')
    } catch (error) {
      console.error('Ошибка решения жалобы:', error)
      alert('Не удалось обработать жалобу')
    }
  }

  const getComplaintTypeLabel = (type) => {
    const labels = {
      spam: 'Спам',
      inappropriate_content: 'Неуместный контент',
      fraud: 'Мошенничество',
      harassment: 'Домогательство',
      other: 'Другое'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает рассмотрения',
      reviewed: 'Рассмотрена',
      resolved: 'Решена',
      rejected: 'Отклонена'
    }
    return labels[status] || status
  }

  return (
    <div className="complaint-list">
      {complaints.length === 0 ? (
        <p className="no-complaints">Нет жалоб</p>
      ) : (
        complaints.map(complaint => (
          <div key={complaint.id} className="complaint-item">
            <div className="complaint-header">
              <h3>{getComplaintTypeLabel(complaint.complaint_type)}</h3>
              <span className={`status-badge status-${complaint.status}`}>
                {getStatusLabel(complaint.status)}
              </span>
            </div>

            <div className="complaint-body">
              <p className="complaint-description">{complaint.description}</p>

              <div className="complaint-targets">
                {complaint.reported_user && (
                  <div className="target-item">
                    <strong>На пользователя:</strong>{' '}
                    <Link to={`/profile/${complaint.reported_user.id}/`}>
                      {complaint.reported_user.username}
                    </Link>
                  </div>
                )}
                {complaint.reported_request && (
                  <div className="target-item">
                    <strong>На заявку:</strong>{' '}
                    <Link to={`/requests/${complaint.reported_request.id}/`}>
                      {complaint.reported_request.title}
                    </Link>
                  </div>
                )}
              </div>

              <div className="complaint-meta">
                <span><strong>От:</strong> {complaint.complainant?.username || 'Неизвестно'}</span>
                <span><strong>Дата:</strong> {new Date(complaint.created_at).toLocaleString('ru-RU')}</span>
              </div>

              {complaint.moderator_comment && (
                <div className="moderator-comment">
                  <strong>Комментарий модератора:</strong> {complaint.moderator_comment}
                </div>
              )}
            </div>

            {complaint.status === 'pending' && (
              <div className="complaint-actions">
                {resolvingId === complaint.id ? (
                  <div className="resolve-form">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Комментарий модератора (необязательно)"
                      rows="3"
                    />
                    <div className="resolve-buttons">
                      <button
                        onClick={() => handleResolve(complaint.id, 'resolved')}
                        className="btn-resolve"
                      >
                        Решено
                      </button>
                      <button
                        onClick={() => handleResolve(complaint.id, 'rejected')}
                        className="btn-reject"
                      >
                        Отклонить
                      </button>
                      <button
                        onClick={() => {
                          setResolvingId(null)
                          setComment('')
                        }}
                        className="btn-cancel"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(complaint.id)}
                    className="btn-resolve-action"
                  >
                    Обработать жалобу
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default ComplaintList
