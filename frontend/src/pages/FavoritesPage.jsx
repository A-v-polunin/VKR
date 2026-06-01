import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import RequestCard from '../components/requests/RequestCard'
import './FavoritesPage.css'

function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await api.get('/requests/favorites/')
      setFavorites(response.data || [])
    } catch (error) {
      console.error('Ошибка загрузки избранного:', error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (requestId, e) => {
    e.stopPropagation()
    if (!window.confirm('Удалить заявку из избранного?')) {
      return
    }

    try {
      await api.delete(`/requests/${requestId}/favorite/`)
      setFavorites(favorites.filter(f => f.id !== requestId))
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error)
      alert('Не удалось удалить из избранного')
    }
  }

  const handleCardClick = (requestId) => {
    navigate(`/requests/${requestId}`)
  }

  const getFilteredFavorites = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return favorites.filter(request => {
      if (filter === 'all') return true

      const reqDate = new Date(request.date)
      reqDate.setHours(0, 0, 0, 0)

      if (filter === 'active') {
        return request.status === 'active' && reqDate >= now
      }

      if (filter === 'past') {
        return request.status !== 'active' || reqDate < now
      }

      return true
    })
  }

  const filteredFavorites = getFilteredFavorites()

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка избранного...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div className="header-content">
          <h1>⭐ Избранное</h1>
          <p className="favorites-count">
            {favorites.length} {favorites.length === 1 ? 'заявка' :
             favorites.length < 5 ? 'заявки' : 'заявок'}
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="filters">
            <button
              onClick={() => setFilter('all')}
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            >
              Активные
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
            >
              Прошедшие
            </button>
          </div>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="no-favorites">
          <div className="empty-icon">⭐</div>
          <h2>У вас пока нет избранных заявок</h2>
          <p>Сохраняйте интересные заявки, чтобы не потерять их</p>
          <div className="empty-actions">
            <Link to="/search" className="search-link">
              🔍 Найти заявки
            </Link>
            <Link to="/" className="home-link">
              🏠 На главную
            </Link>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="no-favorites">
          <div className="empty-icon">🔍</div>
          <h2>Нет заявок в этой категории</h2>
          <p>Попробуйте выбрать другую категорию</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {filteredFavorites.map(request => (
            <div
              key={request.id}
              className="favorite-card-wrapper"
              onClick={() => handleCardClick(request.id)}
            >
              <div className="favorite-card">
                <RequestCard request={request} />
                <div className="card-actions">
                  <button
                    onClick={(e) => handleRemoveFavorite(request.id, e)}
                    className="remove-favorite-btn"
                    title="Удалить из избранного"
                  >
                    ❌ Удалить
                  </button>
                  <Link
                    to={`/requests/${request.id}`}
                    className="view-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    👁️ Подробнее
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FavoritesPage
