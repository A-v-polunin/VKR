import { useState } from 'react'
import api from '../../services/api'
import './CreateComplaint.css'

function CreateComplaint({ reportedUser, reportedRequest, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    complaint_type: 'spam',
    description: '',
    reported_user_id: reportedUser?.id || null,
    reported_request_id: reportedRequest?.id || null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.description.trim()) {
      alert('Укажите описание жалобы')
      return
    }

    try {
      await api.post('/moderation/complaints/create/', formData)
      if (onSuccess) {
        onSuccess()
      }
      alert('Жалоба отправлена')
    } catch (error) {
      console.error('Ошибка создания жалобы:', error)
      alert('Не удалось отправить жалобу')
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content create-complaint" onClick={(e) => e.stopPropagation()}>
        <h3>Пожаловаться</h3>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Тип жалобы:</label>
          <select
            value={formData.complaint_type}
            onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
          >
            <option value="spam">Спам</option>
            <option value="inappropriate_content">Неуместный контент</option>
            <option value="fraud">Мошенничество</option>
            <option value="harassment">Домогательство</option>
            <option value="other">Другое</option>
          </select>
        </div>

        <div className="form-group">
          <label>Описание:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="5"
            placeholder="Опишите проблему..."
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit">Отправить жалобу</button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-cancel">
              Отмена
            </button>
          )}
        </div>
      </form>
      </div>
    </div>
  )
}

export default CreateComplaint
