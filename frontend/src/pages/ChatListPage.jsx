import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './ChatListPage.css'

function ChatListPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChatRooms()
  }, [])

  const loadChatRooms = async () => {
    try {
      const response = await api.get('/chat/rooms/')
      setRooms(response.data)
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="chat-list-page">Загрузка...</div>
  }

  return (
    <div className="chat-list-page">
      <h1>Чаты</h1>

      <div className="chat-rooms">
        {rooms.map(room => (
          <Link key={room.id} to={`/chat/${room.id}`} className="chat-room-item">
            <div className="room-participant">
              {room.other_participant?.username || 'Пользователь'}
            </div>
            {room.last_message && (
              <div className="room-last-message">
                {room.last_message.content}
              </div>
            )}
            {room.unread_count > 0 && (
              <span className="unread-badge">{room.unread_count}</span>
            )}
          </Link>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="no-chats">
          <p>У вас пока нет чатов</p>
        </div>
      )}
    </div>
  )
}

export default ChatListPage
