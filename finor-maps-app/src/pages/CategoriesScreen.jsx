import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LoaderCircle, MapPin } from 'lucide-react';
import { fetchCategorias } from '../services/catalogApi';
import PlaceIcon from '../components/PlaceIcon';
import './CategoriesScreen.css';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetchCategorias()
      .then((response) => active && setCategories(response.results || response || []))
      .catch(() => active && setError('No se pudieron cargar las categorías. Revisa tu conexión.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <main className="categories-screen">
      <header className="categories-header">
        <span>EXPLORA FINOR</span>
        <h1>Lugares</h1>
        <p>Elige qué necesitas encontrar en el campus.</p>
      </header>
      <section className="categories-content" aria-label="Tipos de lugares">
        {loading && <p className="categories-state"><LoaderCircle className="spin" size={20} /> Cargando lugares…</p>}
        {error && <p className="categories-state">{error}</p>}
        {!loading && !error && categories.length === 0 && <p className="categories-state">Aún no hay categorías publicadas.</p>}
        {categories.map((category) => <button
          key={category.id}
          className="category-row"
          onClick={() => navigate(`/categories/${category.id}`)}
        >
          <span className="category-icon"><PlaceIcon name={category.icono} size={23} /></span>
          <span className="category-copy"><strong>{category.nombre}</strong><small>Explorar resultados</small></span>
          <ChevronRight size={20} aria-hidden="true" />
        </button>)}
        {!loading && !error && <div className="categories-hint"><MapPin size={19} /><span>También puedes tocar un edificio directamente en el mapa.</span></div>}
      </section>
    </main>
  );
}
