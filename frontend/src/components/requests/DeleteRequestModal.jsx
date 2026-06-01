import { useState } from 'react'
import './DeleteRequestModal.css'

function DeleteRequestModal({ request, onConfirm, onCancel }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!comment.trim()) {
      alert('Укажите причину удаления')
      return
    }

    setLoading(true)
    try {
      await onConfirm(comment)
      setComment('')
    } catch (error) {
      console.error('Ошибка удаления:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content delete-request-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Удалить заявку</h3>
        <p className="modal-description">
          Вы уверены, что хотите удалить заявку "{request?.title}"?
          Пользователю будет отправлено уведомление с указанной причиной.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Причина удаления:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              placeholder="Укажите причину удаления заявки..."
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel" disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Удаление...' : 'Удалить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DeleteRequestModal
