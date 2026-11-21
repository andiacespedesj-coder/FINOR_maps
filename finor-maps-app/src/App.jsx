import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MapScreen from './pages/MapScreen';
import SearchScreen from './pages/SearchScreen';
import CategoriesScreen from './pages/CategoriesScreen';
import CategoryResultsScreen from './pages/CategoryResultsScreen';
import DetailScreen from './pages/DetailScreen';
import RouteScreen from './pages/RouteScreen';
import MoreScreen from './pages/MoreScreen';
import { AboutScreen, AuthoritiesScreen } from './pages/InfoDetailsScreen';
import TransportScreen from './pages/TransportScreen';
import TransportRouteScreen from './pages/TransportRouteScreen';
import ReportScreen from './pages/ReportScreen';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import './App.css';
import './MaterialExpressive.css';

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
          <Route path="/more/authorities" element={<AuthoritiesScreen />} />
          <Route path="/more/about" element={<AboutScreen />} />
          <Route path="/transport" element={<TransportScreen />} />
          <Route path="/transport/:routeId" element={<TransportRouteScreen />} />
          <Route path="/report" element={<ReportScreen />} />
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
