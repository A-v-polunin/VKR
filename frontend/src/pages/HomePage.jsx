import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import SearchBar from '../components/common/SearchBar'
import CategorySelector from '../components/filters/CategorySelector'
import PopularActivities from '../components/activities/PopularActivities'
import NearbyRequests from '../components/map/NearbyRequests'
import NearbyEvents from '../components/map/NearbyEvents'
import './HomePage.css'

function HomePage() {
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

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Найди партнёра для спорта</h1>
        <SearchBar />
        <Link to="/requests/create" className="cta-button">
          <span>Создать заявку</span>
        </Link>
      </section>

      <CategorySelector categories={categories} />

      <PopularActivities activities={activities.slice(0, 4)} />

      <NearbyRequests />

      <NearbyEvents />
    </div>
  )
}

export default HomePage
