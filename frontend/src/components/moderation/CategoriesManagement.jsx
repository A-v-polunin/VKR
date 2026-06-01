import { useState, useEffect } from 'react'
import api from '../../services/api'
import './CategoriesManagement.css'

function CategoriesManagement() {
  const [categories, setCategories] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingActivity, setEditingActivity] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    category_id: '',
    description: '',
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [catsRes, actsRes] = await Promise.all([
        api.get('/requests/categories/'),
        api.get('/requests/activities/')
      ])
      setCategories(catsRes.data)
      setActivities(actsRes.data)
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.patch(`/requests/categories/${editingCategory.id}/edit/`, formData)
      } else {
        await api.post('/requests/categories/create/', formData)
      }
      setShowCategoryForm(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', icon: '', category_id: '', description: '', is_active: true })
      loadData()
    } catch (error) {
      console.error('Ошибка сохранения категории:', error)
      alert('Не удалось сохранить категорию')
    }
  }

  const handleActivitySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingActivity) {
        await api.patch(`/requests/activities/${editingActivity.id}/edit/`, formData)
      } else {
        await api.post('/requests/activities/create/', formData)
      }
      setShowActivityForm(false)
      setEditingActivity(null)
      setFormData({ name: '', slug: '', icon: '', category_id: '', description: '', is_active: true })
      loadData()
    } catch (error) {
      console.error('Ошибка сохранения активности:', error)
      alert('Не удалось сохранить активность')
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      category_id: '',
      description: '',
      is_active: true
    })
    setShowCategoryForm(true)
  }

  const handleEditActivity = (activity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      slug: activity.slug,
      icon: activity.icon || '',
      category_id: activity.category?.id || '',
      description: activity.description || '',
      is_active: activity.is_active
    })
    setShowActivityForm(true)
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return
    }
    try {
      await api.delete(`/requests/categories/${id}/delete/`)
      loadData()
    } catch (error) {
      console.error('Ошибка удаления категории:', error)
      alert('Не удалось удалить категорию')
    }
  }

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту активность?')) {
      return
    }
    try {
      await api.delete(`/requests/activities/${id}/delete/`)
      loadData()
    } catch (error) {
      console.error('Ошибка удаления активности:', error)
      alert('Не удалось удалить активность')
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="categories-management">
      <div className="section-header">
        <h2>Категории</h2>
        <button onClick={() => {
          setEditingCategory(null)
          setFormData({ name: '', slug: '', icon: '', category_id: '', description: '', is_active: true })
          setShowCategoryForm(true)
        }} className="btn-add">
          + Добавить категорию
        </button>
      </div>

      {showCategoryForm && (
        <form onSubmit={handleCategorySubmit} className="form-card">
          <h3>{editingCategory ? 'Редактировать категорию' : 'Создать категорию'}</h3>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug (URL):</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Иконка:</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="emoji или класс иконки"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save">Сохранить</button>
            <button type="button" onClick={() => {
              setShowCategoryForm(false)
              setEditingCategory(null)
            }} className="btn-cancel">Отмена</button>
          </div>
        </form>
      )}

      <div className="categories-list">
        {categories.map(cat => (
          <div key={cat.id} className="category-card">
            <div className="card-content">
              <h4>{cat.icon} {cat.name}</h4>
              <p>Slug: {cat.slug}</p>
            </div>
            <div className="card-actions">
              <button onClick={() => handleEditCategory(cat)} className="btn-edit">Редактировать</button>
              <button onClick={() => handleDeleteCategory(cat.id)} className="btn-delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2>Активности</h2>
        <button onClick={() => {
          setEditingActivity(null)
          setFormData({ name: '', slug: '', icon: '', category_id: '', description: '', is_active: true })
          setShowActivityForm(true)
        }} className="btn-add">
          + Добавить активность
        </button>
      </div>

      {showActivityForm && (
        <form onSubmit={handleActivitySubmit} className="form-card">
          <h3>{editingActivity ? 'Редактировать активность' : 'Создать активность'}</h3>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug (URL):</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Категория:</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Иконка:</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="emoji или класс иконки"
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Активна
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-save">Сохранить</button>
            <button type="button" onClick={() => {
              setShowActivityForm(false)
              setEditingActivity(null)
            }} className="btn-cancel">Отмена</button>
          </div>
        </form>
      )}

      <div className="activities-list">
        {activities.map(act => (
          <div key={act.id} className="activity-card">
            <div className="card-content">
              <h4>{act.icon} {act.name}</h4>
              <p>Категория: {act.category?.name}</p>
              <p>Slug: {act.slug}</p>
              <p>Статус: {act.is_active ? 'Активна' : 'Неактивна'}</p>
            </div>
            <div className="card-actions">
              <button onClick={() => handleEditActivity(act)} className="btn-edit">Редактировать</button>
              <button onClick={() => handleDeleteActivity(act.id)} className="btn-delete">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoriesManagement
