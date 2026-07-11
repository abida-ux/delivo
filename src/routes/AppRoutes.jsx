import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Menu from "../pages/Menu";
import AllRestaurants from "../pages/customer/AllRestaurants";
import Restaurants from "../pages/customer/Restaurants";
import StoresByType from "../pages/customer/StoresByType";
import StoreProducts from "../pages/customer/StoreProducts";
import Cart from "../pages/customer/Cart";
import Orders from "../pages/customer/Orders";
import Settings from "../pages/Settings";
import Stores from "../pages/Stores";
import About from "../pages/About";
import Business from "../pages/Business";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminRestaurants from "../pages/admin/Restaurants";
import AdminFoods from "../pages/admin/AdminFoods";
import AdminRiders from "../pages/admin/AdminRiders";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminStoreTypes from "../pages/admin/AdminStoreTypes";
import AdminStores from "../pages/admin/AdminStores";
import AdminNotifications from "../pages/admin/AdminNotifications";
import Analytics from "../pages/admin/Analytics";
import AdminSettings from "../pages/admin/AdminSettings";
import RiderDashboard from "../pages/rider/RiderDashboard";
import RiderStores from "../pages/rider/RiderStores";
import AvailableDeliveries from "../pages/rider/AvailableDeliveries";
import DeliveryHistory from "../pages/rider/DeliveryHistory";
import RiderEarnings from "../pages/rider/Earnings";
import RestaurantDashboard from "../pages/restaurant/RestaurantDashboard";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/restaurants" element={<AllRestaurants />} />
      <Route path="/restaurants/:id" element={<Restaurants />} />
      <Route path="/stores" element={<Stores />} />
      <Route path="/stores/:typeId" element={<StoresByType />} />
      <Route path="/store/:storeId" element={<StoreProducts />} />
      <Route path="/customer/cart" element={<Cart />} />
      <Route path="/customer/orders" element={<Orders />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/about" element={<About />} />
      <Route path="/business" element={<Business />} />

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
  );
}