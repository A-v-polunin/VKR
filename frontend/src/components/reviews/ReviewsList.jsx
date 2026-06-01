import { useState, useEffect } from 'react'
import api from '../../services/api'
import './ReviewsList.css'

function ReviewsList({ userId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadReviews()
    }
  }, [userId])

  const loadReviews = async () => {
    try {
      const response = await api.get(`/profile/reviews/${userId}/`)
      setReviews(response.data || [])
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Загрузка отзывов...</div>
  }

  return (
    <div className="reviews-list">
      <h2>Отзывы</h2>
      {reviews.length === 0 ? (
        <p>Пока нет отзывов</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <strong>{review.reviewer?.username}</strong>
              <span className="review-rating">{'★'.repeat(review.rating)}</span>
            </div>
            {review.comment && <p>{review.comment}</p>}
          </div>
        ))
      )}
    </div>
  )
}

export default ReviewsList
