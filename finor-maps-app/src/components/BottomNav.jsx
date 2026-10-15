import { NavLink } from 'react-router-dom';
import { Map, LayoutGrid, Navigation, MoreHorizontal } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Map size={24} />
        <span>Mapa</span>
      </NavLink>

      <NavLink to="/categories" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <LayoutGrid size={24} />
        <span>Categorías</span>
      </NavLink>
      <NavLink to="/gps" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <Navigation size={24} />
        <span>Mi ubicación</span>
      </NavLink>
      <NavLink to="/more" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <MoreHorizontal size={24} />
        <span>Más</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
