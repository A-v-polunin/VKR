import { useState, useEffect } from 'react'
import api from '../../services/api'
import './StatisticsView.css'

function StatisticsView({ statistics: propStatistics, onLoad }) {
  const [statistics, setStatistics] = useState(propStatistics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const response = await api.get('/requests/statistics/')
      setStatistics(response.data)
      if (onLoad) {
        onLoad(response.data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="statistics-view">Загрузка статистики...</div>
  }

  if (!statistics) {
    return <div className="statistics-view">Нет данных</div>
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="statistics-view">
      <h2>Статистика</h2>

      <div className="stats-navigation">
        <button onClick={() => scrollToSection('stats-overview')} className="nav-button">
          Общая статистика
        </button>
        <button onClick={() => scrollToSection('stats-by-type')} className="nav-button">
          Заявки по типам
        </button>
        <button onClick={() => scrollToSection('stats-by-status')} className="nav-button">
          Заявки по статусам
        </button>
        <button onClick={() => scrollToSection('stats-popular')} className="nav-button">
          Популярные активности
        </button>
        <button onClick={() => scrollToSection('stats-users')} className="nav-button">
          Активные пользователи
        </button>
        <button onClick={() => scrollToSection('stats-by-date')} className="nav-button">
          Заявки по датам
        </button>
      </div>

      <div id="stats-overview" className="stats-grid">
        <div className="stat-card">
          <h3>Всего заявок</h3>
          <p className="stat-value">{statistics.total_requests || 0}</p>
        </div>

        <div className="stat-card">
          <h3>Отменено заявок</h3>
          <p className="stat-value">{statistics.cancelled_requests || 0}</p>
          <p className="stat-subvalue">{statistics.cancelled_percentage || 0}%</p>
        </div>
      </div>

      <div id="stats-by-type" className="stats-section">
        <h3>Заявки по типам</h3>
        <div className="stats-list">
          {statistics.requests_by_type?.map(item => (
            <div key={item.request_type} className="stat-item">
              <span className="stat-label">
                {item.request_type === 'sport' ? 'Спорт' : 'Развлечения'}
              </span>
              <span className="stat-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="stats-by-status" className="stats-section">
        <h3>Заявки по статусам</h3>
        <div className="stats-list">
          {statistics.requests_by_status?.map(item => (
            <div key={item.status} className="stat-item">
              <span className="stat-label">
                {item.status === 'active' ? 'Активна' :
                 item.status === 'completed' ? 'Завершена' :
                 item.status === 'cancelled' ? 'Отменена' :
                 item.status === 'filled' ? 'Набрана' : item.status}
              </span>
              <span className="stat-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="stats-popular" className="stats-section">
        <h3>Популярные активности</h3>
        <div className="stats-list">
          {statistics.popular_activities?.map((activity, index) => (
            <div key={activity.id} className="stat-item">
              <span className="stat-rank">#{index + 1}</span>
              <span className="stat-label">{activity.name}</span>
              <span className="stat-count">{activity.count} заявок</span>
            </div>
          ))}
        </div>
      </div>

      <div id="stats-users" className="stats-section">
        <h3>Активные пользователи</h3>
        <div className="stats-list">
          {statistics.active_users?.map(user => (
            <div key={user.id} className="stat-item">
              <span className="stat-label">{user.username}</span>
              <span className="stat-count">
                {user.requests_count} создано, {user.participations_count} участвует
              </span>
            </div>
          ))}
        </div>
      </div>

      <div id="stats-by-date" className="stats-section">
        <h3>Заявки по датам (последние 30 дней)</h3>
        <div className="stats-list">
          {statistics.requests_by_date?.slice(0, 10).map(item => (
            <div key={item.date_created} className="stat-item">
              <span className="stat-label">
                {new Date(item.date_created).toLocaleDateString('ru-RU')}
              </span>
              <span className="stat-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatisticsView
