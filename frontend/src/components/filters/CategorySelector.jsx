import { Link } from 'react-router-dom'
import './CategorySelector.css'

function CategorySelector({ categories }) {
  return (
    <section className="category-selector">
      <h2>Категории</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <Link
            key={category.id}
            to={`/search?category_id=${category.id}`}
            className="category-card"
          >
            <span className="category-icon">{category.icon || '🏃'}</span>
            <span className="category-name">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategorySelector
