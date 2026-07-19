import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/Loader";
import { ProtectedRoute } from "../components/ProtectedRoute";
import NotFound from "../pages/NotFound";

const Home = lazy(() => import("../pages/Home"));
const Menu = lazy(() => import("../pages/Menu"));
const AllRestaurants = lazy(() => import("../pages/customer/AllRestaurants"));
const Restaurants = lazy(() => import("../pages/customer/Restaurants"));
const StoresByType = lazy(() => import("../pages/customer/StoresByType"));
const StoreProducts = lazy(() => import("../pages/customer/StoreProducts"));
const Orders = lazy(() => import("../pages/customer/Orders"));
const OrderDetails = lazy(() => import("../pages/customer/OrderDetails"));
const Settings = lazy(() => import("../pages/Settings"));
const Wishlist = lazy(() => import("../pages/Wishlist"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminRestaurants = lazy(() => import("../pages/admin/Restaurants"));
const AdminFoods = lazy(() => import("../pages/admin/AdminFoods"));
const AdminRiders = lazy(() => import("../pages/admin/AdminRiders"));
const AdminOrders = lazy(() => import("../pages/admin/AdminOrders"));
const AdminStoreTypes = lazy(() => import("../pages/admin/AdminStoreTypes"));
const AdminStores = lazy(() => import("../pages/admin/AdminStores"));
const AdminNotifications = lazy(() => import("../pages/admin/AdminNotifications"));
const Analytics = lazy(() => import("../pages/admin/Analytics"));
const AdminSettings = lazy(() => import("../pages/admin/AdminSettings"));
const RiderDashboard = lazy(() => import("../pages/rider/RiderDashboard"));
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
      <Route path="/restaurants" element={<AllRestaurants />} />
      <Route path="/restaurants/:id" element={<Restaurants />} />
      <Route path="/stores/:typeId" element={<StoresByType />} />
      <Route path="/store/:storeId" element={<StoreProducts />} />
      <Route path="/customer/orders" element={<Orders />} />
      <Route path="/customer/orders/:orderId" element={<OrderDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/wishlist" element={<Wishlist />} />

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
            <AdminNotifications />
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