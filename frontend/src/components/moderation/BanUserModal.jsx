import { useState } from 'react'
import './BanUserModal.css'

function BanUserModal({ user, onConfirm, onCancel }) {
  const [banType, setBanType] = useState('temporary')
  const [reason, setReason] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!reason.trim()) {
      alert('Укажите причину блокировки')
      return
    }

    if (banType === 'temporary' && !endsAt) {
      alert('Укажите дату окончания блокировки')
      return
    }

    setLoading(true)
    try {
      await onConfirm({
        ban_type: banType,
        reason: reason.trim(),
        ends_at: banType === 'temporary' ? endsAt : null
      })
      setReason('')
      setEndsAt('')
    } catch (error) {
      console.error('Ошибка блокировки:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content ban-user-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Заблокировать пользователя</h3>
        <p className="modal-description">
          Вы собираетесь заблокировать пользователя <strong>{user?.username}</strong>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Тип блокировки:</label>
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value)}
            >
              <option value="temporary">Временная</option>
              <option value="permanent">Постоянная</option>
            </select>
          </div>

          <div className="form-group">
            <label>Причина блокировки:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="4"
              placeholder="Укажите причину блокировки..."
              required
            />
          </div>

          {banType === 'temporary' && (
            <div className="form-group">
              <label>Дата окончания блокировки:</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel" disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Блокировка...' : 'Заблокировать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BanUserModal
