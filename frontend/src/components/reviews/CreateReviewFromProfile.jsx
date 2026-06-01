import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import './CreateReviewFromProfile.css'

function CreateReviewFromProfile({ reviewedUserId, onReviewCreated }) {
  const { user: currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (reviewedUserId && currentUser) {
      loadCompletedRequests()
    }
  }, [reviewedUserId, currentUser])

  const loadCompletedRequests = async () => {
    try {
      setLoadingRequests(true)
      const response = await api.get(`/requests/`, {
        params: {
          creator_id: reviewedUserId
        }
      })

      const allRequests = response.data || []

      const availableRequests = []

      let existingReviews = []
      try {
        const reviewsRes = await api.get(`/requests/reviews/user/${reviewedUserId}/`).catch(() => ({ data: [] }))
        existingReviews = reviewsRes.data?.filter(r =>
          r.reviewer?.id === currentUser.id &&
          r.reviewed_user?.id === reviewedUserId
        ) || []
      } catch (error) {
        console.error('Ошибка загрузки отзывов:', error)
      }

      for (const request of allRequests) {
        const hasReview = existingReviews.some(r => r.request?.id === request.id)
        if (!hasReview) {
          availableRequests.push(request)
        }
      }

      setRequests(availableRequests)
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
      setRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRequestId) {
      setError('Выберите активность')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.post(`/requests/${selectedRequestId}/reviews/`, {
        reviewed_user_id: reviewedUserId,
        rating,
        comment: comment.trim()
      })

      setComment('')
      setRating(5)
      setSelectedRequestId(null)

      if (onReviewCreated) {
        onReviewCreated()
      }

      loadCompletedRequests()
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать отзыв')
    } finally {
      setLoading(false)
    }
  }

  if (loadingRequests) {
    return <div className="create-review-from-profile">Загрузка...</div>
  }

  if (requests.length === 0) {
    return (
      <div className="create-review-from-profile">
        <p className="no-requests-message">
          У этого пользователя нет заявок, по которым можно оставить отзыв
        </p>
      </div>
    )
  }

  return (
    <div className="create-review-from-profile">
      <h3>Оставить отзыв</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Активность:</label>
          <select
            value={selectedRequestId || ''}
            onChange={(e) => setSelectedRequestId(parseInt(e.target.value))}
            required
          >
            <option value="">Выберите активность</option>
            {requests.map(request => (
              <option key={request.id} value={request.id}>
                {request.title || request.activity?.name} ({new Date(request.date).toLocaleDateString('ru-RU')})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Оценка:</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                className={`rating-star ${rating >= num ? 'active' : ''}`}
              >
                ★
              </button>
            ))}
            <span className="rating-value">{rating}/5</span>
          </div>
        </div>

        <div className="form-group">
          <label>Комментарий (необязательно):</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            placeholder="Оставьте комментарий..."
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading || !selectedRequestId} className="submit-button">
          {loading ? 'Отправка...' : 'Отправить отзыв'}
        </button>
      </form>
    </div>
  )
}

export default CreateReviewFromProfile
