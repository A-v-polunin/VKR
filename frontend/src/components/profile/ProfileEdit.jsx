import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { getMediaUrl } from '../../services/mediaUrl'
import { METRO_LINES, METRO_STATIONS } from '../../constants/metro'
import './ProfileEdit.css'

const LINE_COLOR = Object.fromEntries(METRO_LINES.map((l) => [l.id, l.color]))

function ProfileEdit({ profile, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    city: profile.city || '',
    bio: profile.bio || '',
    photo: null,
    available_schedule: profile.available_schedule || {},
    home_metro_station_id: profile.home_metro_station_id || ''
  })
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(profile.photo || null)
  const [deletePhoto, setDeletePhoto] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const metroComboRef = useRef(null)
  const [metroDraft, setMetroDraft] = useState('')
  const [metroListOpen, setMetroListOpen] = useState(false)
  const [scheduleDays, setScheduleDays] = useState([
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ])

  useEffect(() => {
    const schedule = profile.available_schedule || {}
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const newSchedule = { ...schedule }
    days.forEach(day => {
      if (!newSchedule[day]) {
        newSchedule[day] = { enabled: false, start: '09:00', end: '18:00' }
      }
    })
    setFormData(prev => ({
      ...prev,
      available_schedule: newSchedule,
      home_metro_station_id: profile.home_metro_station_id || ''
    }))
    const hs = profile.home_metro_station_id
    if (hs) {
      const st = METRO_STATIONS.find((s) => s.id === hs)
      setMetroDraft(st ? st.name : hs)
    } else {
      setMetroDraft('')
    }
    setPhotoPreview(profile.photo || null)
  }, [profile])

  useEffect(() => {
    const onDoc = (e) => {
      if (metroComboRef.current && !metroComboRef.current.contains(e.target)) {
        setMetroListOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const metroSuggestions = (() => {
    const q = metroDraft.trim().toLowerCase()
    if (q.length < 1) return []
    return METRO_STATIONS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    ).slice(0, 40)
  })()

  const handleMetroInputChange = (e) => {
    const v = e.target.value
    setMetroDraft(v)
    setMetroListOpen(true)
    const selected = METRO_STATIONS.find((s) => s.id === formData.home_metro_station_id)
    if (selected && v !== selected.name) {
      setFormData((prev) => ({ ...prev, home_metro_station_id: '' }))
    }
  }

  const pickMetroStation = (station) => {
    setFormData((prev) => ({ ...prev, home_metro_station_id: station.id }))
    setMetroDraft(station.name)
    setMetroListOpen(false)
  }

  const clearMetroStation = () => {
    setFormData((prev) => ({ ...prev, home_metro_station_id: '' }))
    setMetroDraft('')
    setMetroListOpen(false)
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (files && files[0]) {
      handleFileSelect(files[0])
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleDeletePhoto = () => {
    setFormData({ ...formData, photo: null })
    setPhotoPreview(null)
    setDeletePhoto(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0]
      setFormData({ ...formData, photo: file })
      setDeletePhoto(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, photo: file })
      setDeletePhoto(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleScheduleChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      available_schedule: {
        ...prev.available_schedule,
        [day]: {
          ...prev.available_schedule[day],
          [field]: value
        }
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('city', formData.city)
      formDataToSend.append('bio', formData.bio)
      formDataToSend.append('home_metro_station_id', formData.home_metro_station_id || '')
      formDataToSend.append('available_schedule', JSON.stringify(formData.available_schedule))
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }
      if (deletePhoto) {
        formDataToSend.append('delete_photo', 'true')
      }

      await api.patch('/profile/edit/', formDataToSend)
      if (onSave) {
        onSave()
      }
      if (onCancel) {
        onCancel()
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error)
      alert('Ошибка сохранения профиля')
    } finally {
      setLoading(false)
    }
  }

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Редактировать профиль</h2>
        <form onSubmit={handleSubmit} className="profile-edit">
      <div className="form-group">
        <label>Город</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
        />
      </div>

      <div className="form-group metro-autocomplete-group" ref={metroComboRef}>
        <label htmlFor="home-metro-input">Моя станция метро (для поиска «Рядом»)</label>
        <div className="metro-autocomplete-wrap">
          <input
            id="home-metro-input"
            type="text"
            autoComplete="off"
            placeholder="Начните вводить название станции…"
            value={metroDraft}
            onChange={handleMetroInputChange}
            onFocus={() => setMetroListOpen(true)}
          />
          {(metroDraft || formData.home_metro_station_id) && (
            <button
              type="button"
              className="metro-autocomplete-clear"
              onClick={clearMetroStation}
              aria-label="Очистить станцию"
            >
              ×
            </button>
          )}
        </div>
        {metroListOpen && metroSuggestions.length > 0 && (
          <ul className="metro-autocomplete-list" role="listbox">
            {metroSuggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="metro-autocomplete-option"
                  style={{ borderLeft: `3px solid ${LINE_COLOR[s.line] || '#888'}` }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickMetroStation(s)}
                >
                  <span
                    className="metro-line-dot"
                    style={{ backgroundColor: LINE_COLOR[s.line] || '#888' }}
                    title={s.line}
                  />
                  <span className="metro-option-name">{s.name}</span>
                  <span className="metro-option-line">{s.line}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {metroListOpen && metroDraft.trim().length >= 1 && metroSuggestions.length === 0 && (
          <p className="metro-autocomplete-empty">Нет совпадений — попробуйте другой запрос</p>
        )}
        <p className="field-hint">От этой станции считаются ±3 станции по линии в фильтре «Рядом», если в поиске станции не выбраны. Выберите станцию из списка.</p>
      </div>

      <div className="form-group">
        <label>О себе</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="5"
        />
      </div>

      <div className="form-group">
        <label>Фото профиля</label>
        <div className="photo-upload-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="photo-input-hidden"
            id="photo-upload"
          />
          <div
            className={`photo-upload-area ${isDragging ? 'dragging' : ''}`}
            onClick={handlePhotoClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="photo-upload-placeholder">
              <svg className="photo-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="photo-upload-text">Выберите или перетащите файл</span>
              <span className="photo-upload-hint">JPG, PNG до 5MB</span>
            </div>
          </div>
          {photoPreview && (
            <div className="photo-preview-section">
              <img src={getMediaUrl(photoPreview)} alt="Превью фото" className="photo-preview" />
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="photo-delete-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Удалить фото
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Расписание доступного времени (опционально)</label>
        <div className="schedule-editor">
          {scheduleDays.map(day => {
            const daySchedule = formData.available_schedule[day] || { enabled: false, start: '09:00', end: '18:00' }
            return (
              <div key={day} className="schedule-day">
                <label className="schedule-day-label">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled || false}
                    onChange={(e) => handleScheduleChange(day, 'enabled', e.target.checked)}
                  />
                  <span>{dayNames[day]}</span>
                </label>
                {daySchedule.enabled && (
                  <div className="schedule-time">
                    <input
                      type="time"
                      value={daySchedule.start || '09:00'}
                      onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                    />
                    <span>—</span>
                    <input
                      type="time"
                      value={daySchedule.end || '18:00'}
                      onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="save-button">
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button type="button" onClick={onCancel} className="cancel-button">
          Отмена
        </button>
      </div>
    </form>
      </div>
    </div>
  )
}

export default ProfileEdit
