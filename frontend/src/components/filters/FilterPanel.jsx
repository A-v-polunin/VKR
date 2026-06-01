import { useState, useEffect } from 'react'
import api from '../../services/api'
import { METRO_LINES, METRO_STATIONS_BY_LINE } from '../../constants/metro'
import './FilterPanel.css'

function FilterPanel({ filters, onChange }) {
  const [categories, setCategories] = useState([])
  const [activities, setActivities] = useState([])

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
    }
  }

  const handleChange = (name, value) => {
    onChange({
      ...filters,
      [name]: value
    })
  }

  const toggleMetroStation = (stationId) => {
    const current = (filters.metro_stations || '').split(',').map((s) => s.trim()).filter(Boolean)
    const exists = current.includes(stationId)
    const next = exists ? current.filter((id) => id !== stationId) : [...current, stationId]
    handleChange('metro_stations', next.join(','))
  }

  return (
    <div className="filter-panel">
      <input
        type="text"
        placeholder="Поиск..."
        value={filters.q}
        onChange={(e) => handleChange('q', e.target.value)}
        className="search-input"
      />

      <select
        value={filters.category_id}
        onChange={(e) => handleChange('category_id', e.target.value)}
      >
        <option value="">Все категории</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <select
        value={filters.activity_id}
        onChange={(e) => handleChange('activity_id', e.target.value)}
      >
        <option value="">Все активности</option>
        {activities.map(act => (
          <option key={act.id} value={act.id}>{act.name}</option>
        ))}
      </select>

      <select
        value={filters.level}
        onChange={(e) => handleChange('level', e.target.value)}
      >
        <option value="">Любой уровень</option>
        <option value="beginner">Начинающий</option>
        <option value="intermediate">Средний</option>
        <option value="advanced">Продвинутый</option>
        <option value="professional">Профессионал</option>
      </select>

      <select
        value={filters.metro_line}
        onChange={(e) => handleChange('metro_line', e.target.value)}
      >
        <option value="">Все линии метро</option>
        {METRO_LINES.map((line) => (
          <option key={line.id} value={line.id}>
            {line.name}
          </option>
        ))}
      </select>

      <div className="metro-filter">
        {(filters.metro_line
          ? METRO_LINES.filter((l) => l.id === filters.metro_line)
          : METRO_LINES
        ).map((line) => (
          <div key={line.id} className="metro-line-group">
            <div className="metro-line-title">
              <span className="metro-line-color-dot" style={{ backgroundColor: line.color }} />
              {line.name}
            </div>
            <div className="metro-stations-list">
              {METRO_STATIONS_BY_LINE[line.id].map((station) => {
                const selected = (filters.metro_stations || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .includes(station.id)
                return (
                  <label key={station.id} className="metro-station-option">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleMetroStation(station.id)}
                    />
                    <span>{station.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FilterPanel
