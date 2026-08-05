import { Outlet } from 'react-router-dom';
import { MarketplaceCartProvider } from '../contexts/marketplace/MarketplaceCartContext';
import MarketplaceNavbar from '../components/marketplace/MarketplaceNavbar';
import '../styles/global.css';
import '../components/Navbar.css';
import '../pages/Home.css';
import '../pages/Menu.css';
import '../pages/customer/FoodDetailsPage.css';
import './MarketplaceLayout.css';

export default function MarketplaceLayout() {
  return (
    <MarketplaceCartProvider>
      <div className="mkt-layout-wrapper">
        <MarketplaceNavbar />
        <main className="mkt-layout-content">
          <Outlet />
        </main>
      </div>
    </MarketplaceCartProvider>
  );
}
