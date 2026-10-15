import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapScreen from './pages/MapScreen';
import SearchScreen from './pages/SearchScreen';
import CategoriesScreen from './pages/CategoriesScreen';
import GPSScreen from './pages/GPSScreen';
import DetailScreen from './pages/DetailScreen';
import MoreScreen from './pages/MoreScreen';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  return (
    <Router>
      <div className="mobile-app-container">
        <div className="content-area">
          <Routes>
            <Route path="/" element={<MapScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/categories" element={<CategoriesScreen />} />
            <Route path="/gps" element={<GPSScreen />} />
            <Route path="/detail/:id" element={<DetailScreen />} />
            <Route path="/more" element={<MoreScreen />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
