import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Breadcrumbs from '../components/common/Breadcrumbs'
import { getMediaUrl } from '../services/mediaUrl'
import { METRO_LINES, METRO_STATIONS, METRO_STATIONS_BY_LINE } from '../constants/metro'
import './CreateRequestPage.css'

function CreateRequestPage() {
  const [formData, setFormData] = useState({
    request_type: 'sport',
    activity_id: '',
    format: 'partner',
    date: '',
    time: '',
    date_end: '',
    time_end: '',
    location_name: '',
    metro_stations: [],
    level: 'any',
    max_participants: 2,
    title: '',
    description: '',
    requirements: '',
    visibility: 'public',
    rules_accepted: false
  })
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [metroSearch, setMetroSearch] = useState('')
  const [expandedLines, setExpandedLines] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadActivities()
  }, [formData.request_type])

  const loadActivities = async () => {
    try {
      const response = await api.get('/requests/activities/', {
        params: {
          category_id: formData.request_type === 'sport' ? 1 : 2
        }
      })
      setActivities(response.data)
    } catch (error) {
      console.error('Ошибка загрузки активностей:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const toggleMetroStation = (stationId) => {
    setFormData((prev) => {
      const exists = prev.metro_stations.includes(stationId)
      return {
        ...prev,
        metro_stations: exists
          ? prev.metro_stations.filter((id) => id !== stationId)
          : [...prev.metro_stations, stationId]
      }
    })
  }

  const toggleLineExpanded = (lineId) => {
    setExpandedLines((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId]
    )
  }

  useEffect(() => {
    const search = metroSearch.trim().toLowerCase()
    if (!search) {
      return
    }
    const matchingLines = METRO_LINES.filter((line) => {
      const stations = METRO_STATIONS_BY_LINE[line.id] || []
      return stations.some((s) => s.name.toLowerCase().includes(search))
    }).map((l) => l.id)
    setExpandedLines(matchingLines)
  }, [metroSearch])

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingPhotos(true)
    try {
      const uploadedUrls = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('photo', file)

        const response = await api.post('/requests/upload-photo/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        uploadedUrls.push(response.data.url)
      }
      setPhotos([...photos, ...uploadedUrls])
    } catch (error) {
      console.error('Ошибка загрузки фото:', error)
      alert('Не удалось загрузить фото')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.rules_accepted) {
      setError('Необходимо согласиться с правилами')
      return
    }

    setLoading(true)
    setError('')

    try {
      const metroStationsPayload = formData.metro_stations.map((id) => {
        const station = METRO_STATIONS.find((s) => s.id === id)
        if (station) {
          const { id: sid, name, line } = station
          return { id: sid, name, line }
        }
        return { id }
      })

      const submitData = {
        ...formData,
        photos: photos,
        metro_stations: metroStationsPayload,
      }
      await api.post('/requests/create/', submitData)
      navigate('/requests/my')
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания заявки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-request-page">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Создание заявки' }
        ]}
      />
      <h1>Создать заявку</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="request-form">
        <div className="form-group">
          <label>Тип</label>
          <select name="request_type" value={formData.request_type} onChange={handleChange} required>
            <option value="sport">Спорт</option>
            <option value="entertainment">Развлечения</option>
          </select>
        </div>

        <div className="form-group">
          <label>Активность</label>
          <select name="activity_id" value={formData.activity_id} onChange={handleChange} required>
            <option value="">Выберите активность</option>
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>{activity.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Формат</label>
          <select name="format" value={formData.format} onChange={handleChange} required>
            <option value="partner">Партнёр</option>
            <option value="company">Компания</option>
            <option value="group">Группа</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Время</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Адрес</label>
          <input
            id="location_name_input"
            type="text"
            name="location_name"
            value={formData.location_name}
            onChange={handleChange}
            placeholder="Укажите адрес (улица, дом, ориентир)"
            required
          />
        </div>

        <div className="form-group">
          <label>Метро (станция или станции)</label>
          <div className="metro-select">
            <input
              type="text"
              className="metro-search-input"
              placeholder="Найти станцию"
              value={metroSearch}
              onChange={(e) => setMetroSearch(e.target.value)}
            />
            {METRO_LINES.map((line) => {
              const stationsAll = METRO_STATIONS_BY_LINE[line.id] || []
              const search = metroSearch.trim().toLowerCase()
              const stations = search
                ? stationsAll.filter((s) => s.name.toLowerCase().includes(search))
                : stationsAll

              if (!stations.length) return null

              const expanded = expandedLines.includes(line.id)

              return (
                <div key={line.id} className="metro-line-group">
                  <button
                    type="button"
                    className="metro-line-title"
                    onClick={() => toggleLineExpanded(line.id)}
                  >
                    <span className="metro-line-left">
                      <span
                        className="metro-line-color-dot"
                        style={{ backgroundColor: line.color }}
                      />
                      <span>{line.name}</span>
                    </span>
                    <span className="metro-line-chevron">{expanded ? '▾' : '▸'}</span>
                  </button>
                  {expanded && (
                    <div className="metro-stations-list">
                      {stations.map((station) => (
                        <label key={station.id} className="metro-station-option">
                          <input
                            type="checkbox"
                            checked={formData.metro_stations.includes(station.id)}
                            onChange={() => toggleMetroStation(station.id)}
                          />
                          <span>{station.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Уровень</label>
          <select name="level" value={formData.level} onChange={handleChange}>
            <option value="any">Любой</option>
            <option value="beginner">Начинающий</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
            <option value="professional">Профессионал</option>
          </select>
        </div>

        <div className="form-group">
          <label>Количество участников</label>
          <input
            type="number"
            name="max_participants"
            value={formData.max_participants}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label>Заголовок</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Краткое описание заявки"
            required
          />
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            placeholder="Подробное описание активности"
            required
          />
        </div>

        <div className="form-group">
          <label>Требования</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
            placeholder="Например: только с инвентарём"
          />
        </div>

        <div className="form-group">
          <label>Фото (необязательно)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            disabled={uploadingPhotos}
          />
          {uploadingPhotos && <p>Загрузка фото...</p>}
          {photos.length > 0 && (
            <div className="photos-preview">
              {photos.map((url, index) => (
                <div key={index} className="photo-preview">
                  <img src={getMediaUrl(url)} alt={`Фото ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="remove-photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Видимость</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === 'public'}
                onChange={handleChange}
              />
              Публичная
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="link"
                checked={formData.visibility === 'link'}
                onChange={handleChange}
              />
              Только по ссылке
            </label>
          </div>
        </div>

        <div className="form-group form-group-checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="rules_accepted"
              checked={formData.rules_accepted}
              onChange={handleChange}
              required
            />
            <span>Согласен с правилами</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Создание...' : 'Создать заявку'}
        </button>
      </form>
    </div>
  )
}

export default CreateRequestPage
