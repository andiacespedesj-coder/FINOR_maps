import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MapScreen from './pages/MapScreen';
import SearchScreen from './pages/SearchScreen';
import CategoriesScreen from './pages/CategoriesScreen';
import CategoryResultsScreen from './pages/CategoryResultsScreen';
import DetailScreen from './pages/DetailScreen';
import RouteScreen from './pages/RouteScreen';
import MoreScreen from './pages/MoreScreen';
import TransportScreen from './pages/TransportScreen';
import ReportScreen from './pages/ReportScreen';
import GuidedRoutePreview from './pages/GuidedRoutePreview';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import './App.css';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { pathname } = useLocation();
  const showNavigation = ['/', '/categories', '/more'].includes(pathname);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mobile-app-container">
      <div className="content-area">
        <Routes>
          <Route path="/" element={<MapScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/categories" element={<CategoriesScreen />} />
          <Route path="/categories/:id" element={<CategoryResultsScreen />} />
          <Route path="/detail/:id" element={<DetailScreen />} />
          <Route path="/route/:placeId" element={<RouteScreen />} />
          <Route path="/more" element={<MoreScreen />} />
          <Route path="/transport" element={<TransportScreen />} />
          <Route path="/report" element={<ReportScreen />} />
          {import.meta.env.DEV && <Route path="/preview/ruta" element={<GuidedRoutePreview />} />}
        </Routes>
      </div>
      {showNavigation && <BottomNav />}
      {showSplash && <SplashScreen />}
    </div>
  );
}

function App() {
  return <Router><AppContent /></Router>;
}

export default App;
