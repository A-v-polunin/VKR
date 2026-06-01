import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import './LoginPage.css'

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, telegramLogin } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login({
          username: formData.username,
          password: formData.password
        })
      } else {
        result = await register(formData)
      }

      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const [botLink, setBotLink] = useState(null)

  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        const response = await api.get('/auth/telegram-bot-info/')
        setBotLink(response.data.register_link || response.data.bot_link)
      } catch (error) {
        console.error('Ошибка получения информации о боте:', error)
        setBotLink('https://t.me/sportact1v_bot?start=register')
      }
    }
    fetchBotInfo()
  }, [])

  const handleTelegramLogin = async () => {
    if (botLink) {
      window.open(botLink, '_blank')
      setError('')
      setTimeout(() => {
        alert('Бот открыт в Telegram. Используй команду /register для регистрации через бота.')
      }, 500)
    } else {
      setError('Не удалось получить ссылку на бота. Попробуй позже.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <input
                type="text"
                name="first_name"
                placeholder="Имя"
                value={formData.first_name}
                onChange={handleChange}
                required={!isLogin}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Фамилия"
                value={formData.last_name}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </>
          )}

          <input
            type="text"
            name="username"
            placeholder="Имя пользователя"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="telegram-login">
          <button onClick={handleTelegramLogin} className="telegram-button">
            Войти через Telegram
          </button>
        </div>

        <div className="toggle-form">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="toggle-button"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
