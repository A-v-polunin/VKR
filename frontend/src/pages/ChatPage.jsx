import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import websocket from '../services/websocket'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'
import './ChatPage.css'

function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadRoom()
    loadMessages()
    connectWebSocket()

    const interval = setInterval(() => {
      loadMessages()
    }, 3000)

    return () => {
      websocket.disconnect()
      clearInterval(interval)
    }
  }, [id])

  const loadRoom = async () => {
    try {
      const response = await api.get(`/chat/rooms/${id}/`)
      setRoom(response.data)
    } catch (error) {
      console.error('Ошибка загрузки комнаты:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chat/rooms/${id}/messages/`)
      if (Array.isArray(response.data)) {
        setMessages(prev => {
          if (prev.length !== response.data.length || loading) {
            return response.data
          }
          return prev
        })
      } else {
        console.error('Неверный формат данных сообщений:', response.data)
        setMessages([])
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    websocket.connect(id)

    websocket.on('message', (data) => {
      if (data.message) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data.message.id)
          if (exists) return prev
          return [...prev, data.message]
        })
      } else if (data.content) {
        setMessages(prev => [...prev, data])
      }
    })

    websocket.on('open', () => {
      console.log('WebSocket connected')
    })

    websocket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  const handleSendMessage = async (content) => {
    if (!content.trim()) return

    try {
      const response = await api.post(`/chat/rooms/${id}/send/`, {
        content: content.trim()
      })

      setMessages(prev => {
        const exists = prev.some(msg => msg.id === response.data.id)
        if (exists) return prev
        return [...prev, response.data]
      })

      setTimeout(() => {
        loadMessages()
      }, 500)
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
      alert('Не удалось отправить сообщение')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return <div className="chat-page">Загрузка...</div>
  }

  const isOneOnOneChat = room && !room.request && (!room.participants || room.participants.length === 2)
  const otherParticipant = isOneOnOneChat ? (room?.other_participant || (room?.participants?.find(p => p.id !== user?.id))) : null

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button onClick={() => navigate('/chat')} className="back-to-chats-button">
          ← К списку чатов
        </button>
        {room && (
          <div className="chat-title-wrapper">
            {isOneOnOneChat && otherParticipant ? (
              <Link to={`/profile/${otherParticipant.id}/`} className="chat-title-link">
                <h2 className="chat-title">{otherParticipant.username || otherParticipant.first_name || 'Пользователь'}</h2>
              </Link>
            ) : (
              <h2 className="chat-title">
                {room.request ? room.request.title :
                 room.other_participant ? (room.other_participant.username || room.other_participant.first_name) :
                 'Чат'}
              </h2>
            )}
          </div>
        )}
      </div>
      <div className="chat-messages">
        <MessageList messages={messages} room={room} />
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSend={handleSendMessage} />
    </div>
  )
}

export default ChatPage
