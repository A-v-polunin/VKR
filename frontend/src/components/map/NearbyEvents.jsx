import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import './NearbyEvents.css'

function NearbyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/requests/', {
        params: {
          status: 'filled'
        }
      })
      setEvents(response.data.slice(0, 6))
      setLoading(false)
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="nearby-events">Загрузка...</div>
  }

  return (
    <section className="nearby-events">
      <h2>События рядом</h2>
      <div className="events-grid">
        {events.map(event => (
          <Link
            key={event.id}
            to={`/requests/${event.id}`}
            className="event-card"
          >
            <h3>{event.title}</h3>
            <p className="event-activity">{event.activity?.name}</p>
            <p className="event-participants">
              Участников: {event.current_participants}/{event.max_participants}
            </p>
            <p className="event-date">
              {new Date(event.date).toLocaleDateString('ru-RU')} в {event.time}
            </p>
          </Link>
        ))}
      </div>
      {events.length === 0 && (
        <p className="no-events">Пока нет событий</p>
      )}
    </section>
  )
}

export default NearbyEvents
