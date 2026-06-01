import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import FilterPanel from '../components/filters/FilterPanel'
import RequestCard from '../components/requests/RequestCard'
import './SearchPage.css'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') || '',
    activity_id: searchParams.get('activity_id') || '',
    request_type: searchParams.get('request_type') || '',
    level: searchParams.get('level') || '',
    format: searchParams.get('format') || '',
    quick_tag: searchParams.get('quick_tag') || '',
    metro_line: searchParams.get('metro_line') || '',
    metro_stations: searchParams.get('metro_stations') || ''
  })

  useEffect(() => {
    searchRequests()
  }, [searchParams])

  const searchRequests = async () => {
    try {
      setLoading(true)
      const params = Object.fromEntries(searchParams)
      const response = await api.get('/requests/search/', { params })
      setRequests(response.data)
    } catch (error) {
      console.error('Ошибка поиска:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })
    setSearchParams(params)
  }

  return (
    <div className="search-page">
      <h1>Поиск</h1>

      <FilterPanel filters={filters} onChange={handleFilterChange} />

      <div className="quick-tags">
        <button
          onClick={() => handleFilterChange({ ...filters, quick_tag: 'today' })}
          className={filters.quick_tag === 'today' ? 'active' : ''}
        >
          Сегодня
        </button>
        <button
          onClick={() => handleFilterChange({ ...filters, quick_tag: 'weekend' })}
          className={filters.quick_tag === 'weekend' ? 'active' : ''}
        >
          На выходных
        </button>
        <button
          onClick={() => handleFilterChange({ ...filters, quick_tag: 'nearby' })}
          className={filters.quick_tag === 'nearby' ? 'active' : ''}
        >
          Рядом
        </button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="search-results">
          {requests.map(request => (
            <Link key={request.id} to={`/requests/${request.id}`}>
              <RequestCard request={request} />
            </Link>
          ))}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="no-results">
          <p>Ничего не найдено</p>
        </div>
      )}
    </div>
  )
}

export default SearchPage
