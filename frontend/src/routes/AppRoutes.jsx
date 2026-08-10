import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/Loader";
import { ProtectedRoute } from "../components/ProtectedRoute";
import NotFound from "../pages/NotFound";

const Home = lazy(() => import("../pages/Home"));
const Menu = lazy(() => import("../pages/Menu"));
const PushDiagnostics = lazy(() => import("../pages/PushDiagnostics"));
const AllRestaurants = lazy(() => import("../pages/customer/AllRestaurants"));
const Restaurants = lazy(() => import("../pages/customer/Restaurants"));
const FoodDetailsPage = lazy(() => import("../pages/customer/FoodDetailsPage"));
const StoresByType = lazy(() => import("../pages/customer/StoresByType"));
const StoreProducts = lazy(() => import("../pages/customer/StoreProducts"));
const Orders = lazy(() => import("../pages/customer/Orders"));
const OrderDetails = lazy(() => import("../pages/customer/OrderDetails"));
const Settings = lazy(() => import("../pages/Settings"));
const Offers = lazy(() => import("../pages/Offers"));
const Login = lazy(() => import("../pages/auth/Login"));
const Signup = lazy(() => import("../pages/auth/Signup"));

// Marketplace Sub-App Layout & Pages
const MarketplaceLayout = lazy(() => import("../layouts/MarketplaceLayout"));
const MarketplaceHome = lazy(() => import("../pages/marketplace/MarketplaceHome"));
const MarketplaceCategories = lazy(() => import("../pages/marketplace/MarketplaceCategories"));
const MarketplaceCategoryDetail = lazy(() => import("../pages/marketplace/MarketplaceCategoryDetail"));
const MarketplaceProductDetail = lazy(() => import("../pages/marketplace/MarketplaceProductDetail"));
const MarketplaceCheckoutPage = lazy(() => import("../pages/marketplace/MarketplaceCheckoutPage"));
const MarketplaceOrdersPage = lazy(() => import("../pages/marketplace/MarketplaceOrdersPage"));
const MarketplaceWishlistPage = lazy(() => import("../pages/marketplace/MarketplaceWishlistPage"));
const MarketplaceSecondHand = lazy(() => import("../pages/marketplace/MarketplaceSecondHand"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminRestaurants = lazy(() => import("../pages/admin/Restaurants"));
const AdminFoods = lazy(() => import("../pages/admin/AdminFoods"));
const AdminFlashSales = lazy(() => import("../pages/admin/AdminFlashSales"));
const AdminMarketplace = lazy(() => import("../pages/admin/AdminMarketplace"));
const AdminMarketplaceProducts = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceProducts"));
const AdminMarketplaceCategories = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceCategories"));
const AdminMarketplaceStores = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceStores"));
const AdminMarketplaceOrders = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceOrders"));
const AdminMarketplaceBanners = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceBanners"));
const AdminMarketplaceFlashSales = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceFlashSales"));
const AdminMarketplaceCoupons = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceCoupons"));
const AdminMarketplaceReviews = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceReviews"));
const AdminMarketplaceSecondHandPage = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceSecondHandPage"));
const AdminMarketplaceCustomers = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceCustomers"));
const AdminMarketplaceReports = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceReports"));
const AdminMarketplaceSettings = lazy(() => import("../pages/admin/marketplace/AdminMarketplaceSettings"));
const AdminCategories = lazy(() => import("../pages/admin/AdminCategories"));
const AdminCombinations = lazy(() => import("../pages/admin/AdminCombinations"));
const AdminRestaurantFoods = lazy(() => import("../pages/admin/AdminRestaurantFoods"));
const AdminRiders = lazy(() => import("../pages/admin/AdminRiders"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders"));
const AdminStoreTypes = lazy(() => import("../pages/admin/AdminStoreTypes"));
const AdminStores = lazy(() => import("../pages/admin/AdminStores"));
const AdminNotificationsPage = lazy(() => import("../pages/admin/AdminNotificationsPage"));
const Analytics = lazy(() => import("../pages/admin/Analytics"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));
const AdminLogs = lazy(() => import("../pages/admin/AdminLogs"));
const RiderDashboard = lazy(() => import("../pages/rider/RiderDashboard"));
const RiderOrderDetails = lazy(() => import("../pages/rider/RiderOrderDetails"));
const RiderStores = lazy(() => import("../pages/rider/RiderStores"));
const AvailableDeliveries = lazy(() => import("../pages/rider/AvailableDeliveries"));
const DeliveryHistory = lazy(() => import("../pages/rider/DeliveryHistory"));
const RiderEarnings = lazy(() => import("../pages/rider/Earnings"));
const RestaurantDashboard = lazy(() => import("../pages/restaurant/RestaurantDashboard"));
const RestaurantOrders = lazy(() => import("../pages/restaurant/RestaurantOrders"));
const RestaurantCompletedOrders = lazy(() => import("../pages/restaurant/RestaurantCompletedOrders"));
const RestaurantFoods = lazy(() => import("../pages/restaurant/RestaurantFoods"));
const RestaurantRevenue = lazy(() => import("../pages/restaurant/RestaurantRevenue"));
const RestaurantWithdrawals = lazy(() => import("../pages/restaurant/RestaurantWithdrawals"));
const RestaurantTransactions = lazy(() => import("../pages/restaurant/RestaurantTransactions"));
const RestaurantProfile = lazy(() => import("../pages/restaurant/RestaurantProfile"));
const RestaurantSettings = lazy(() => import("../pages/restaurant/RestaurantSettings"));
const RestaurantDashboardLayout = lazy(() => import("../layouts/RestaurantDashboardLayout"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/push-diagnostics" element={<PushDiagnostics />} />
      <Route path="/restaurants" element={<AllRestaurants />} />
      <Route path="/restaurants/:id" element={<Restaurants />} />
      <Route path="/food/:foodId" element={<FoodDetailsPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Marketplace Independent Experience */}
      <Route path="/marketplace" element={<MarketplaceLayout />}>
        <Route index element={<MarketplaceHome />} />
        <Route path="categories" element={<MarketplaceCategories />} />
        <Route path="category/:slug" element={<MarketplaceCategoryDetail />} />
        <Route path="product/:id" element={<MarketplaceProductDetail />} />
        <Route path="checkout" element={<MarketplaceCheckoutPage />} />
        <Route path="orders" element={<MarketplaceOrdersPage />} />
        <Route path="wishlist" element={<MarketplaceWishlistPage />} />
        <Route path="second-hand" element={<MarketplaceSecondHand />} />
      </Route>

      <Route path="/stores/:typeId" element={<StoresByType />} />
      <Route path="/store/:storeId" element={<StoreProducts />} />
      <Route path="/customer/orders" element={<Orders />} />
      <Route path="/customer/orders/:orderId" element={<OrderDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/offers" element={<Offers />} />

      {/* Admin Routes - Protected */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/restaurants"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRestaurants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/foods"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFoods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flash-sales"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFlashSales />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/marketplace" element={<ProtectedRoute requiredRole="admin"><AdminMarketplace /></ProtectedRoute>} />
      <Route path="/admin/marketplace/products" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceProducts /></ProtectedRoute>} />
      <Route path="/admin/marketplace/categories" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceCategories /></ProtectedRoute>} />
      <Route path="/admin/marketplace/stores" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceStores /></ProtectedRoute>} />
      <Route path="/admin/marketplace/banners" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceBanners /></ProtectedRoute>} />
      <Route path="/admin/marketplace/flash-sales" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceFlashSales /></ProtectedRoute>} />
      <Route path="/admin/marketplace/orders" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceOrders /></ProtectedRoute>} />
      <Route path="/admin/marketplace/customers" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceCustomers /></ProtectedRoute>} />
      <Route path="/admin/marketplace/coupons" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceCoupons /></ProtectedRoute>} />
      <Route path="/admin/marketplace/reviews" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceReviews /></ProtectedRoute>} />
      <Route path="/admin/marketplace/second-hand" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceSecondHandPage /></ProtectedRoute>} />
      <Route path="/admin/marketplace/reports" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceReports /></ProtectedRoute>} />
      <Route path="/admin/marketplace/settings" element={<ProtectedRoute requiredRole="admin"><AdminMarketplaceSettings /></ProtectedRoute>} />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/combinations"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminCombinations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/restaurant-foods"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRestaurantFoods />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/store-types"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminStoreTypes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stores"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminStores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/riders"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRiders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredRole="admin">
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLogs />
          </ProtectedRoute>
        }
      />

      {/* Rider Routes - Protected */}
      <Route
        path="/rider-dashboard"
        element={
          <ProtectedRoute requiredRole="rider">
            <RiderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/orders/:orderId"
        element={
          <ProtectedRoute requiredRole="rider">
            <RiderOrderDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/stores"
        element={
          <ProtectedRoute requiredRole="rider">
            <RiderStores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/deliveries"
        element={
          <ProtectedRoute requiredRole="rider">
            <AvailableDeliveries />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/history"
        element={
          <ProtectedRoute requiredRole="rider">
            <DeliveryHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rider/earnings"
        element={
          <ProtectedRoute requiredRole="rider">
            <RiderEarnings />
          </ProtectedRoute>
        }
      />

      {/* Restaurant Routes - Protected */}
      <Route
        path="/restaurant"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Restaurant Portal">
              <RestaurantDashboard />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant-dashboard"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Restaurant Portal">
              <RestaurantDashboard />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/orders"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Orders">
              <RestaurantOrders />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/completed-orders"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Completed Orders">
              <RestaurantCompletedOrders />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/foods"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Foods">
              <RestaurantFoods />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/revenue"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Revenue">
              <RestaurantRevenue />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/withdrawals"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Withdrawals">
              <RestaurantWithdrawals />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/transactions"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Transactions">
              <RestaurantTransactions />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/profile"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Profile">
              <RestaurantProfile />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurant/settings"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboardLayout pageTitle="Settings">
              <RestaurantSettings />
            </RestaurantDashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}