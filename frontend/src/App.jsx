import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import Loader from "./components/Loader";
import AuthModal from "./components/AuthModal";
import { LoaderContext } from "./context/LoaderContext";
import './styles/global.css';
import './components/Loader.css';

function App() {
  const { isLoading } = useContext(LoaderContext);
  const location = useLocation();

  // Hide navbar on admin and restaurant portal routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isRestaurantRoute = location.pathname.startsWith('/restaurant');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {isLoading && <Loader />}
      <AuthModal />
      {!isAdminRoute && !isRestaurantRoute && <Navbar />}
      <main className={isAdminRoute || isRestaurantRoute ? 'admin-page-main' : ''}>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;