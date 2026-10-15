import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Building2, GraduationCap, Briefcase, DoorOpen, FlaskConical, Library, Mic, Trophy, Info, Utensils, Droplets, CreditCard, HeartPulse, MoreHorizontal } from 'lucide-react';
import { fetchCategorias } from '../services/api';
import './CategoriesScreen.css';

// Diccionario para mapear el texto que viene de la BD a iconos reales de Lucide
const IconMap = {
  'Book': <Book />,
  'Building2': <Building2 />,
  'GraduationCap': <GraduationCap />,
  'Briefcase': <Briefcase />,
  'DoorOpen': <DoorOpen />,
  'FlaskConical': <FlaskConical />,
  'Library': <Library />,
  'Mic': <Mic />,
  'Trophy': <Trophy />,
  'Info': <Info />,
  'Utensils': <Utensils />,
  'Droplets': <Droplets />,
  'CreditCard': <CreditCard />,
  'HeartPulse': <HeartPulse />,
  'MoreHorizontal': <MoreHorizontal />
};

// Colores predefinidos para ir alternando si no vienen de la BD
const colors = ['#4a90e2', '#50e3c2', '#9013fe', '#f5a623', '#f8e71c', '#d0021b', '#8b572a', '#7ed321'];

const CategoriesScreen = () => {
  const [categorias, setCategorias] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategorias().then(data => {
      // DRF devuelve resultados paginados por defecto (results)
      const fetchedCats = data.results || data || [];
      setCategorias(fetchedCats);
    });
  }, []);

  return (
    <div className="categories-screen">
      <header className="categories-header">
        <h2>Categorías</h2>
      </header>
      <div className="categories-grid">
        {categorias.map((cat, index) => {
          // Si el icono no se encuentra en el mapa, usamos MoreHorizontal por defecto
          const iconComponent = IconMap[cat.icono] || <MoreHorizontal />;
          const color = colors[index % colors.length];

          return (
            <div 
              key={cat.id || index} 
              className="category-card"
              onClick={() => {
                navigate('/', { state: { filterCategoryId: cat.id, filterCategoryName: cat.nombre } });
              }}
            >
              <div className="icon-circle" style={{ backgroundColor: color }}>
                {iconComponent}
              </div>
              <span>{cat.nombre}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesScreen;
