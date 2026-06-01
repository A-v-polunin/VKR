import { Link } from 'react-router-dom'
import './PopularActivities.css'

function PopularActivities({ activities }) {
  return (
    <section className="popular-activities">
      <h2>Популярные активности</h2>
      <div className="activities-grid">
        {activities.map(activity => (
          <Link
            key={activity.id}
            to={`/search?activity_id=${activity.id}`}
            className="activity-card"
          >
            <span className="activity-icon">{activity.icon || '⚽'}</span>
            <span className="activity-name">{activity.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PopularActivities
