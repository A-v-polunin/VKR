import { useState } from 'react'
import api from '../../services/api'
import './TelegramConnect.css'

function TelegramConnect({ onSuccess }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!code.trim()) {
      setError('Введите код')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/profile/connect-telegram/', { code: code.trim() })
      setSuccess(true)
      setCode('')
      if (onSuccess) {
        onSuccess(response.data.user)
      }
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка привязки Telegram')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="telegram-connect">
      <h3>Привязать Telegram</h3>
      <p className="telegram-connect-info">
        Для получения уведомлений в Telegram:
      </p>
      <ol className="telegram-connect-steps">
        <li>Напишите боту команду <code>/start</code> в Telegram</li>
        <li>Скопируйте полученный код</li>
        <li>Вставьте код ниже и нажмите "Привязать"</li>
      </ol>

      <form onSubmit={handleSubmit} className="telegram-connect-form">
        <div className="form-group">
          <label htmlFor="telegram-code">Код из Telegram:</label>
          <input
            id="telegram-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Вставьте код из бота"
            disabled={loading || success}
            className="telegram-code-input"
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            ✓ Telegram успешно привязан! Страница обновится через несколько секунд...
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="connect-button"
        >
          {loading ? 'Привязка...' : 'Привязать Telegram'}
        </button>
      </form>
    </div>
  )
}

export default TelegramConnect
