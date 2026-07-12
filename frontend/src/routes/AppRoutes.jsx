import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Loader from "../components/Loader";
import { ProtectedRoute } from "../components/ProtectedRoute";

const Home = lazy(() => import("../pages/Home"));
const Menu = lazy(() => import("../pages/Menu"));
const AllRestaurants = lazy(() => import("../pages/customer/AllRestaurants"));
const Restaurants = lazy(() => import("../pages/customer/Restaurants"));
const StoresByType = lazy(() => import("../pages/customer/StoresByType"));
const StoreProducts = lazy(() => import("../pages/customer/StoreProducts"));
const Cart = lazy(() => import("../pages/customer/Cart"));
const Orders = lazy(() => import("../pages/customer/Orders"));
const Settings = lazy(() => import("../pages/Settings"));
const About = lazy(() => import("../pages/About"));
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
      <Route path="/customer/cart" element={<Cart />} />
      <Route path="/customer/orders" element={<Orders />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/about" element={<About />} />

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
        path="/restaurant-dashboard"
        element={
          <ProtectedRoute requiredRole="restaurant">
            <RestaurantDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}