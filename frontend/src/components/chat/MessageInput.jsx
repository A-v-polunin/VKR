import { useState } from 'react'
import './MessageInput.css'

function MessageInput({ onSend }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message)
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите сообщение..."
        className="message-field"
      />
      <button type="submit" className="send-button">
        Отправить
      </button>
    </form>
  )
}

export default MessageInput
