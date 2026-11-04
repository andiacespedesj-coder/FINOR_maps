import { NavLink } from 'react-router-dom';
import { Info, Map, MapPin } from 'lucide-react';
import './BottomNav.css';

const items = [
  { to: '/', label: 'Mapa', icon: Map, end: true },
  { to: '/categories', label: 'Lugares', icon: MapPin },
  { to: '/more', label: 'Info', icon: Info },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
