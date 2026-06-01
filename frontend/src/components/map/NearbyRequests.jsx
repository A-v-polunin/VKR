import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import RequestCard from '../requests/RequestCard'
import './NearbyRequests.css'

function NearbyRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNearbyRequests()
  }, [])

  const loadNearbyRequests = async () => {
    try {
      setLoading(true)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            const response = await api.get('/requests/', {
              params: {
                latitude,
                longitude,
                radius: 10,
                quick_tag: 'nearby'
              }
            })
            const filtered = filterActiveRequests(response.data)
            setRequests(filtered.slice(0, 6))
            setLoading(false)
          },
          async () => {
            const response = await api.get('/requests/')
            const filtered = filterActiveRequests(response.data)
            setRequests(filtered.slice(0, 6))
            setLoading(false)
          }
        )
      } else {
        const response = await api.get('/requests/')
        const filtered = filterActiveRequests(response.data)
        setRequests(filtered.slice(0, 6))
        setLoading(false)
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error)
      setLoading(false)
    }
  }

  const filterActiveRequests = (requests) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return requests.filter(request => {
      if (request.status !== 'active') return false

      const requestDate = new Date(request.date)
      const requestDateTime = new Date(
        requestDate.getFullYear(),
        requestDate.getMonth(),
        requestDate.getDate()
      )

      if (requestDateTime < today) return false

      if (requestDateTime.getTime() === today.getTime() && request.time) {
        const [hours, minutes] = request.time.split(':').map(Number)
        const requestTime = new Date(today)
        requestTime.setHours(hours, minutes, 0, 0)

        if (requestTime < now) return false
      }

      return true
    })
  }

  if (loading) {
    return <div className="nearby-requests">Загрузка...</div>
  }

  return (
    <section className="nearby-requests">
      <h2>Заявки рядом</h2>
      <div className="requests-grid">
        {requests.map(request => (
          <Link
            key={request.id}
            to={`/requests/${request.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <RequestCard request={request} />
          </Link>
        ))}
      </div>
      {requests.length === 0 && (
        <p className="no-requests">Пока нет заявок рядом</p>
      )}
    </section>
  )
}

export default NearbyRequests
