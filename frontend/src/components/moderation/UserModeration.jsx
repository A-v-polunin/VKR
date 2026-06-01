import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './UserModeration.css'

function UserModeration() {
  const [bans, setBans] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [showBanForm, setShowBanForm] = useState(false)
  const [banForm, setBanForm] = useState({
    user_id: '',
    ban_type: 'temporary',
    reason: '',
    ends_at: ''
  })

  useEffect(() => {
    loadBans()
    loadUsers()
  }, [])

  const loadBans = async () => {
    try {
      const response = await api.get('/moderation/bans/')
      setBans(response.data)
    } catch (error) {
      console.error('Ошибка загрузки блокировок:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/requests/statistics/')
      if (response.data.active_users) {
        setUsers(response.data.active_users)
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    }
  }

  const handleCreateBan = async (e) => {
    e.preventDefault()

    if (!banForm.user_id || !banForm.reason) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      await api.post('/moderation/bans/create/', banForm)
      setShowBanForm(false)
      setBanForm({ user_id: '', ban_type: 'temporary', reason: '', ends_at: '' })
      loadBans()
      alert('Блокировка создана')
    } catch (error) {
      console.error('Ошибка создания блокировки:', error)
      alert('Не удалось создать блокировку')
    }
  }

  const handleUnban = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите разблокировать этого пользователя?')) return

    try {
      await api.post(`/moderation/users/${userId}/moderate/`, { action: 'unban' })
      loadBans()
      alert('Пользователь разблокирован')
    } catch (error) {
      console.error('Ошибка разблокировки:', error)
      alert('Не удалось разблокировать пользователя')
    }
  }

  const activeBans = bans.filter(b => b.is_active)
  const historyBans = bans.filter(b => !b.is_active)
  const displayedBans = activeTab === 'active' ? activeBans : historyBans

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="user-moderation">
      <div className="moderation-header">
        <h2>Блокировки пользователей</h2>
        <button onClick={() => setShowBanForm(!showBanForm)} className="btn-create-ban">
          {showBanForm ? 'Отмена' : '+ Создать блокировку'}
        </button>
      </div>

      {showBanForm && (
        <form onSubmit={handleCreateBan} className="ban-form">
          <div className="form-group">
            <label>Пользователь:</label>
            <select
              value={banForm.user_id}
              onChange={(e) => setBanForm({ ...banForm, user_id: e.target.value })}
              required
            >
              <option value="">Выберите пользователя</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username} (ID: {user.id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Тип блокировки:</label>
            <select
              value={banForm.ban_type}
              onChange={(e) => setBanForm({ ...banForm, ban_type: e.target.value })}
            >
              <option value="temporary">Временная</option>
              <option value="permanent">Постоянная</option>
            </select>
          </div>

          <div className="form-group">
            <label>Причина:</label>
            <textarea
              value={banForm.reason}
              onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
              rows="4"
              required
              placeholder="Укажите причину блокировки"
            />
          </div>

          {banForm.ban_type === 'temporary' && (
            <div className="form-group">
              <label>Дата окончания:</label>
              <input
                type="datetime-local"
                value={banForm.ends_at}
                onChange={(e) => setBanForm({ ...banForm, ends_at: e.target.value })}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit">Создать блокировку</button>
            <button type="button" onClick={() => setShowBanForm(false)} className="btn-cancel">
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="bans-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Активные
          {activeBans.length > 0 && (
            <span className="tab-count">{activeBans.length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          История
          {historyBans.length > 0 && (
            <span className="tab-count tab-count--inactive">{historyBans.length}</span>
          )}
        </button>
      </div>

      <div className="bans-list">
        {displayedBans.length === 0 ? (
          <p className="no-bans">
            {activeTab === 'active' ? 'Нет активных блокировок' : 'История блокировок пуста'}
          </p>
        ) : (
          displayedBans.map(ban => (
            <div key={ban.id} className={`ban-item ${!ban.is_active ? 'ban-item--inactive' : ''}`}>
              <div className="ban-header">
                <Link to={`/profile/${ban.user?.id}/`} className="ban-user-link">
                  <strong>{ban.user?.username}</strong>
                </Link>
                <span className={`ban-status ${ban.is_active ? 'active' : 'inactive'}`}>
                  {ban.is_active ? 'Активна' : 'Истекла'}
                </span>
              </div>
              <div className="ban-details">
                <span><strong>Тип:</strong> {ban.ban_type === 'temporary' ? 'Временная' : 'Постоянная'}</span>
                <span><strong>Причина:</strong> {ban.reason}</span>
                <span><strong>Начало:</strong> {new Date(ban.starts_at).toLocaleString('ru-RU')}</span>
                {ban.ends_at && (
                  <span><strong>Окончание:</strong> {new Date(ban.ends_at).toLocaleString('ru-RU')}</span>
                )}
                <span><strong>Модератор:</strong> {ban.moderator?.username || 'Не указан'}</span>
              </div>
              {ban.is_active && (
                <button
                  onClick={() => handleUnban(ban.user?.id)}
                  className="btn-unban"
                >
                  Разблокировать
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default UserModeration
