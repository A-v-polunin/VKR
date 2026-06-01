import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './MessageList.css'

function getUserColor(userId) {
  const colors = [
    '#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
    '#fee140', '#30cfd0', '#a8edea', '#fed6e3', '#ff9a9e',
    '#ffecd2', '#fcb69f', '#ff8a80', '#84fab0', '#a1c4fd'
  ]
  return colors[userId % colors.length]
}

function getInitials(username) {
  if (!username) return '?'
  const parts = username.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return username.substring(0, 2).toUpperCase()
}

function MessageList({ messages, room }) {
  const { user } = useAuth()

  const isGroupChat = room?.request || (room?.participants?.length > 2)
  const isOneOnOneChat = room && !room.request && (!room.participants || room.participants.length === 2)

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list">
        <div className="no-messages">Пока нет сообщений</div>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isOwn = message.sender?.id === user?.id
        const prevMessage = index > 0 ? messages[index - 1] : null
        const isSameSender = prevMessage && prevMessage.sender?.id === message.sender?.id
        const showSender = isGroupChat ? (!isOwn && !isSameSender) : (isOneOnOneChat && !isOwn)

        const userColor = message.sender?.id ? getUserColor(message.sender.id) : '#667eea'
        const initials = getInitials(message.sender?.username || 'Пользователь')

        return (
          <div
            key={message.id || Math.random()}
            className={`message ${isOwn ? 'own' : 'other'} ${isSameSender ? 'same-sender' : ''}`}
          >
            {showSender && (
              <div className="message-sender-header">
                <div
                  className="message-avatar"
                  style={{ backgroundColor: userColor }}
                >
                  {initials}
                </div>
                {message.sender?.id ? (
                  <Link
                    to={`/profile/${message.sender.id}/`}
                    className="message-sender-name"
                    style={{ color: userColor }}
                  >
                    {message.sender.username || 'Пользователь'}
                  </Link>
                ) : (
                  <span className="message-sender-name" style={{ color: userColor }}>
                    {message.sender?.username || 'Пользователь'}
                  </span>
                )}
              </div>
            )}
            {!isOwn && isSameSender && !showSender && (
              <div className="message-avatar-small" style={{ backgroundColor: userColor }}>
                {initials.substring(0, 1)}
              </div>
            )}
            <div
              className="message-content"
              style={!isOwn && isGroupChat ? {
                backgroundColor: '#f8f9fa'
              } : {}}
            >
              {message.content || message.message || ''}
            </div>
            <div className="message-time">
              {message.created_at ? new Date(message.created_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
              }) : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList
