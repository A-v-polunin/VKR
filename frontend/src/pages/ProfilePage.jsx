import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ProfileEdit from '../components/profile/ProfileEdit'
import InterestsSelector from '../components/profile/InterestsSelector'
import ReviewsList from '../components/reviews/ReviewsList'
import UserRequestsSection from '../components/profile/UserRequestsSection'
import TelegramConnect from '../components/profile/TelegramConnect'
import CreateComplaint from '../components/complaints/CreateComplaint'
import BanUserModal from '../components/moderation/BanUserModal'
import CreateReviewFromProfile from '../components/reviews/CreateReviewFromProfile'
import Breadcrumbs from '../components/common/Breadcrumbs'
import { getMediaUrl } from '../services/mediaUrl'
import { METRO_STATIONS } from '../constants/metro'
import './ProfilePage.css'

function metroStationLabel(stationId) {
  if (!stationId) return ''
  const s = METRO_STATIONS.find((m) => m.id === stationId)
  return s ? s.name : stationId
}

function ProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [profileUser, setProfileUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creatingChat, setCreatingChat] = useState(false)
  const [showComplaint, setShowComplaint] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  const isModerator = currentUser?.is_moderator || currentUser?.is_staff

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const url = userId ? `/profile/${userId}/` : '/profile/'
      const response = await api.get(url)
      if (response.data.profile) {
        setProfile(response.data.profile)
        setProfileUser(response.data.user)
        setPhotoError(false)
      } else {
        setProfile(null)
        setProfileUser(null)
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      setProfile(null)
      setProfileUser(null)
    } finally {
      setLoading(false)
    }
  }

  const isOwnProfile = !userId || (currentUser && currentUser.id === parseInt(userId))

  const handleBanUser = async (banData) => {
    try {
      await api.post('/moderation/bans/create/', {
        user_id: profileUser.id,
        ...banData
      })
      setShowBanModal(false)
      alert('Пользователь заблокирован')
      loadProfile()
    } catch (error) {
      console.error('Ошибка блокировки пользователя:', error)
      alert('Не удалось заблокировать пользователя')
      throw error
    }
  }

  const handleStartChat = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    if (!profileUser) {
      return
    }

    setCreatingChat(true)
    try {
      const response = await api.post(`/chat/create/${profileUser.id}/`)
      navigate(`/chat/${response.data.id}`)
    } catch (error) {
      console.error('Ошибка создания чата:', error)
      alert('Не удалось создать чат')
    } finally {
      setCreatingChat(false)
    }
  }

  if (loading) {
    return <div className="profile-page">Загрузка...</div>
  }

  if (!profile) {
    return <div className="profile-page">Профиль не найден</div>
  }

  return (
    <div className="profile-page">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          isOwnProfile
            ? { label: 'Мой профиль' }
            : { label: profileUser?.first_name || profileUser?.username || 'Профиль' }
        ]}
      />
      <div className="profile-header">
        <div className="profile-photo">
          {profile.photo && !photoError ? (
            <img
              src={getMediaUrl(profile.photo)}
              alt="Фото профиля"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div className="photo-placeholder">Нет фото</div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profileUser?.first_name || profileUser?.username || 'Пользователь'}</h1>
          <p className="profile-city">{profile.city || 'Город не указан'}</p>
          {profile.home_metro_station_id && (
            <p className="profile-metro">Станция метро: {metroStationLabel(profile.home_metro_station_id)}</p>
          )}
          <p className="profile-rating">Рейтинг: {profile.rating.toFixed(2)}/5.00</p>
          {profileUser?.telegram_verified && (
            <span className="verified-badge">✓ Telegram подтверждён</span>
          )}
        </div>
        <div className="profile-actions">
          {isOwnProfile ? (
            <button onClick={() => setShowEditModal(true)} className="edit-button">
              Редактировать
            </button>
          ) : currentUser && (
            <>
              <button
                onClick={handleStartChat}
                className="message-button"
                disabled={creatingChat}
              >
                {creatingChat ? 'Создание...' : '💬 Написать'}
              </button>
              <button
                onClick={() => setShowReview(!showReview)}
                className="review-button"
              >
                ⭐ Оставить отзыв
              </button>
              <button
                onClick={() => setShowComplaint(!showComplaint)}
                className="complaint-button"
              >
                ⚠️ Пожаловаться
              </button>
              {isModerator && (
                <button
                  onClick={() => setShowBanModal(true)}
                  className="ban-button"
                >
                  🚫 Заблокировать
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showEditModal && isOwnProfile && (
        <ProfileEdit
          profile={profile}
          onSave={() => {
            loadProfile()
            setShowEditModal(false)
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {!showEditModal && (
        <>
          <div className="profile-section">
            <h2>О себе</h2>
            <p>{profile.bio || 'Информация не указана'}</p>
          </div>

          {isOwnProfile && profile.available_schedule && Object.keys(profile.available_schedule).length > 0 && (
            <div className="profile-section">
              <h2>Расписание</h2>
              <div className="schedule-display">
                {Object.entries(profile.available_schedule).map(([day, schedule]) => {
                  if (!schedule || !schedule.enabled) return null
                  const dayNames = {
                    monday: 'Понедельник',
                    tuesday: 'Вторник',
                    wednesday: 'Среда',
                    thursday: 'Четверг',
                    friday: 'Пятница',
                    saturday: 'Суббота',
                    sunday: 'Воскресенье'
                  }
                  return (
                    <div key={day} className="schedule-item">
                      <span className="schedule-day-name">{dayNames[day] || day}:</span>
                      <span className="schedule-time-range">
                        {schedule.start || '09:00'} — {schedule.end || '18:00'}
                      </span>
                    </div>
                  )
                })}
                {Object.values(profile.available_schedule).every(s => !s || !s.enabled) && (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>Расписание не указано</p>
                )}
              </div>
            </div>
          )}

          {isOwnProfile && <InterestsSelector />}

          {isOwnProfile && !profileUser?.telegram_verified && (
            <TelegramConnect onSuccess={(user) => {
              setProfileUser(user)
              loadProfile()
            }} />
          )}

          {!isOwnProfile && currentUser && showReview && (
            <CreateReviewFromProfile
              reviewedUserId={profileUser?.id}
              onReviewCreated={() => {
                setShowReview(false)
                loadProfile()
              }}
            />
          )}

          {!isOwnProfile && currentUser && showComplaint && (
            <CreateComplaint
              reportedUser={profileUser}
              onSuccess={() => setShowComplaint(false)}
              onCancel={() => setShowComplaint(false)}
            />
          )}

          <UserRequestsSection userId={profileUser?.id} isOwnProfile={isOwnProfile} />

          <ReviewsList userId={profileUser?.id} />
        </>
      )}

      {showBanModal && profileUser && (
        <BanUserModal
          user={profileUser}
          onConfirm={handleBanUser}
          onCancel={() => setShowBanModal(false)}
        />
      )}
    </div>
  )
}

export default ProfilePage
