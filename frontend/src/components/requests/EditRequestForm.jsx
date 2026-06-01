import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getMediaUrl } from '../../services/mediaUrl'
import './EditRequestForm.css'

function EditRequestForm({ request, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    title: request?.title || '',
    description: request?.description || '',
    date: request?.date || '',
    time: request?.time || '',
    max_participants: request?.max_participants || 2,
    level: request?.level || 'any',
    requirements: request?.requirements || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState(request?.photos || [])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || '',
        description: request.description || '',
        date: request.date ? request.date.split('T')[0] : '',
        time: request.time || '',
        max_participants: request.max_participants || 2,
        level: request.level || 'any',
        requirements: request.requirements || ''
      })
      setPhotos(request.photos || [])
    }
  }, [request])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_participants' ? parseInt(value) || 2 : value
    }))
  }

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
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        photos: photos
      }
      const response = await api.patch(`/requests/${request.id}/edit/`, submitData)
      if (onSave) {
        onSave(response.data)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось сохранить изменения')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div className="edit-request-form">
      <h2>Редактировать заявку</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Описание:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Время:</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Максимум участников:</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              min="2"
              required
            />
          </div>

          <div className="form-group">
            <label>Уровень:</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="any">Любой</option>
              <option value="beginner">Начинающий</option>
              <option value="intermediate">Средний</option>
              <option value="advanced">Продвинутый</option>
              <option value="professional">Профессионал</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Требования (необязательно):</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Фото (необязательно):</label>
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

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-cancel">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="btn-save">
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditRequestForm
