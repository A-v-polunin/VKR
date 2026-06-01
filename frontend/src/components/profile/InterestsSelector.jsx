import { useState, useEffect } from 'react'
import api from '../../services/api'
import './InterestsSelector.css'

function InterestsSelector() {
  const [interests, setInterests] = useState([])
  const [activities, setActivities] = useState([])
  const [selectedActivity, setSelectedActivity] = useState('')
  const [level, setLevel] = useState('beginner')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [interestsRes, activitiesRes] = await Promise.all([
        api.get('/profile/interests/'),
        api.get('/requests/activities/')
      ])
      setInterests(interestsRes.data)
      setActivities(activitiesRes.data)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedActivity) return

    try {
      await api.post('/profile/interests/add/', {
        activity_id: selectedActivity,
        level
      })
      loadData()
      setSelectedActivity('')
    } catch (error) {
      console.error('Ошибка добавления интереса:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/profile/interests/${id}/delete/`)
      loadData()
    } catch (error) {
      console.error('Ошибка удаления интереса:', error)
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="interests-selector">
      <h2>Мои интересы</h2>

      <div className="add-interest">
        <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
          <option value="">Выберите активность</option>
          {activities.map(activity => (
            <option key={activity.id} value={activity.id}>{activity.name}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">Начинающий</option>
          <option value="intermediate">Средний</option>
          <option value="advanced">Продвинутый</option>
          <option value="professional">Профессионал</option>
        </select>
        <button onClick={handleAdd} className="add-button">
          Добавить
        </button>
      </div>
      <p className="interests-hint">Укажите уровень для каждого вида активности</p>

      <div className="interests-list">
        {interests.map(interest => {
          const levelLabels = {
            beginner: 'Начинающий',
            intermediate: 'Средний',
            advanced: 'Продвинутый',
            professional: 'Профессионал'
          }
          return (
            <div key={interest.id} className="interest-item">
              <div className="interest-info">
                <span className="interest-name">{interest.activity?.name}</span>
                <span className="interest-level">Уровень: {levelLabels[interest.level] || interest.level}</span>
              </div>
              <button onClick={() => handleDelete(interest.id)} className="delete-button">
                Удалить
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InterestsSelector
