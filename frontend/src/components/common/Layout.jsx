import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getMediaUrl } from '../../services/mediaUrl'
import './Layout.css'

const Icon = ({ children }) => (
  <svg
    className="nav-icon"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
)

function getAvatarInitial(user) {
  const base = (user?.first_name || user?.username || 'П').trim()
  return (base[0] || 'П').toUpperCase()
}

function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const menuRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  useEffect(() => {
    setAvatarError(false)
  }, [user?.id, user?.avatar])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            СпортПартнёр
          </Link>

          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              <span className="nav-link-inner">
                <Icon>
                  <path
                    d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </Icon>
                <span>Главная</span>
              </span>
            </Link>
            <Link to="/search" className={location.pathname === '/search' ? 'active' : ''}>
              <span className="nav-link-inner">
                <Icon>
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </Icon>
                <span>Поиск</span>
              </span>
            </Link>

            {user ? (
              <>
                <Link to="/requests/create" className={`create-btn ${location.pathname === '/requests/create' ? 'active' : ''}`}>
                  <span className="nav-link-inner">
                    <Icon>
                      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </Icon>
                    <span>Создать заявку</span>
                  </span>
                </Link>
                <Link to="/chat" className={location.pathname.startsWith('/chat') ? 'active' : ''}>
                  <span className="nav-link-inner">
                    <Icon>
                      <path
                        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Icon>
                    <span>Чат</span>
                  </span>
                </Link>
                {user.is_moderator && (
                  <Link to="/moderation" className={location.pathname === '/moderation' ? 'active' : ''}>
                    <span className="nav-link-inner">
                      <Icon>
                        <path
                          d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </Icon>
                      <span>Модерация</span>
                    </span>
                  </Link>
                )}
                <div className="user-menu" ref={menuRef}>
                  <button
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="nav-link-inner">
                      <span className="user-avatar" aria-hidden="true">
                        {user?.avatar && !avatarError ? (
                          <img
                            src={getMediaUrl(user.avatar)}
                            alt=""
                            className="user-avatar-img"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <span className="user-avatar-fallback">
                            {getAvatarInitial(user)}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="user-menu-dropdown">
                      <Link
                        to="/profile"
                        className={location.pathname === '/profile' ? 'active' : ''}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="nav-link-inner">
                          <Icon>
                            <path
                              d="M20 21a8 8 0 0 0-16 0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                          </Icon>
                          <span>Мой профиль</span>
                        </span>
                      </Link>
                      <Link
                        to="/favorites"
                        className={location.pathname === '/favorites' ? 'active' : ''}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="nav-link-inner">
                          <Icon>
                            <path
                              d="M12 2l3 7 7 .6-5.3 4.6 1.7 7-6.4-3.9L5.6 21l1.7-7L2 9.6 9 9l3-7z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </Icon>
                          <span>Избранное</span>
                        </span>
                      </Link>
                      <Link
                        to="/notifications"
                        className={location.pathname === '/notifications' ? 'active' : ''}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="nav-link-inner">
                          <Icon>
                            <path
                              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M13.73 21a2 2 0 0 1-3.46 0"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Icon>
                          <span>Уведомления</span>
                        </span>
                      </Link>
                      <Link
                        to="/help"
                        className={location.pathname === '/help' ? 'active' : ''}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="nav-link-inner">
                          <Icon>
                            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path
                              d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path d="M12 17h.01" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          </Icon>
                          <span>Справка</span>
                        </span>
                      </Link>
                      <hr className="menu-divider" />
                      <button onClick={handleLogout} className="menu-logout-btn">
                        <span className="nav-link-inner">
                          <Icon>
                            <path d="M9 21V3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M16 17l5-5-5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 12H9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </Icon>
                          <span>Выйти</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                Войти
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <Link to="/help">Справка</Link>
          </div>
          <p>&copy; 2026 СпортПартнёр</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
