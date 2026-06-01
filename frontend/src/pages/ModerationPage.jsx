import { useState, useEffect } from 'react'
import api from '../services/api'
import ComplaintList from '../components/complaints/ComplaintList'
import UserModeration from '../components/moderation/UserModeration'
import CategoriesManagement from '../components/moderation/CategoriesManagement'
import StatisticsView from '../components/moderation/StatisticsView'
import './ModerationPage.css'

function ModerationPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('complaints')
  const [statistics, setStatistics] = useState(null)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    try {
      const response = await api.get('/moderation/complaints/')
      setComplaints(response.data)
    } catch (error) {
      console.error('Ошибка загрузки жалоб:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="moderation-page">Загрузка...</div>
  }

  return (
    <div className="moderation-page">
      <h1>Модерация</h1>

      <div className="moderation-tabs">
        <button
          onClick={() => setActiveTab('complaints')}
          className={activeTab === 'complaints' ? 'active' : ''}
        >
          Жалобы
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'active' : ''}
        >
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={activeTab === 'categories' ? 'active' : ''}
        >
          Категории
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={activeTab === 'statistics' ? 'active' : ''}
        >
          Статистика
        </button>
      </div>

      {activeTab === 'complaints' && (
        <ComplaintList complaints={complaints} onUpdate={loadComplaints} />
      )}

      {activeTab === 'users' && (
        <UserModeration />
      )}

      {activeTab === 'categories' && (
        <CategoriesManagement />
      )}

      {activeTab === 'statistics' && (
        <StatisticsView statistics={statistics} onLoad={setStatistics} />
      )}
    </div>
  )
}

export default ModerationPage
