import { useState, useEffect } from 'react'
import api from '../services/api'
import './NotificationsPage.css'

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications/')
      setNotifications(response.data)
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count/')
      setUnreadCount(response.data.count)
    } catch (error) {
      console.error('Ошибка загрузки количества непрочитанных:', error)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Ошибка пометки как прочитанное:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all/')
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Ошибка пометки всех как прочитанных:', error)
    }
  }

  if (loading) {
    return <div className="notifications-page">Загрузка...</div>
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Уведомления</h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="mark-all-read">
            Пометить все как прочитанные
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
          >
            <div className="notification-content">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <span className="notification-time">
                {new Date(notification.created_at).toLocaleString('ru-RU')}
              </span>
            </div>
            {!notification.is_read && <div className="unread-indicator" />}
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="no-notifications">
          <p>У вас пока нет уведомлений</p>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
