import { useState } from 'react'
import api from '../../services/api'
import './CreateReview.css'

function CreateReview({ request, onReviewCreated }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewedUserId, setReviewedUserId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reviewedUserId) {
      setError('Выберите пользователя для отзыва')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.post(`/requests/${request.id}/reviews/`, {
        reviewed_user_id: reviewedUserId,
        rating,
        comment: comment.trim()
      })

      setComment('')
      setRating(5)
      setReviewedUserId(null)

      if (onReviewCreated) {
        onReviewCreated()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать отзыв')
    } finally {
      setLoading(false)
    }
  }

  const getReviewableUsers = () => {
    const users = []

    if (request.creator) {
      users.push({
        id: request.creator.id,
        name: request.creator.first_name || request.creator.username,
        role: 'Создатель'
      })
    }

    if (request.participations) {
      request.participations.forEach(p => {
        if (p.user && p.user.id !== request.creator?.id) {
          users.push({
            id: p.user.id,
            name: p.user.first_name || p.user.username,
            role: 'Участник'
          })
        }
      })
    }

    return users
  }

  const reviewableUsers = getReviewableUsers()

  if (reviewableUsers.length === 0) {
    return null
  }

  return (
    <div className="create-review">
      <h3>Оставить отзыв</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Пользователь:</label>
          <select
            value={reviewedUserId || ''}
            onChange={(e) => setReviewedUserId(parseInt(e.target.value))}
            required
          >
            <option value="">Выберите пользователя</option>
            {reviewableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
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

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Отправка...' : 'Отправить отзыв'}
        </button>
      </form>
    </div>
  )
}

export default CreateReview
