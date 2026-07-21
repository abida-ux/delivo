import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import Loader from "./components/Loader";
import AuthModal from "./components/AuthModal";
import { LoaderContext } from "./context/LoaderContext";
import './styles/global.css';
import './components/Loader.css';

const triggerRefreshNotification = async () => {
  if (!('Notification' in window)) return;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }

  if (Notification.permission === 'granted') {
    new Notification('Delivo refresh test', {
      body: 'This notification appears on every refresh for testing.',
      icon: '/delivos.png',
      tag: 'delivo-refresh-test',
    });
  }
};

function App() {
  const { isLoading } = useContext(LoaderContext);
  const location = useLocation();

  useEffect(() => {
    triggerRefreshNotification();
  }, [location.pathname]);

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