import {useState, useEffect} from 'react';
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { getAllOrders, getAllFoods, getAllRestaurants, getAllUsers } from '../../services/api';
import '../pages.css';
import './Analytics.css';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    userGrowth: 0,
  });
  const [topFoods, setTopFoods] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [ordersRes, foodsRes, restaurantsRes, usersRes] = await Promise.all([
        getAllOrders(),
        getAllFoods(),
        getAllRestaurants(),
        getAllUsers(),
      ]);

      const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes.data || [];
      const foods = Array.isArray(foodsRes) ? foodsRes : foodsRes.data || [];
      const restaurants = Array.isArray(restaurantsRes) ? restaurantsRes : restaurantsRes.data || [];
      const users = Array.isArray(usersRes) ? usersRes : usersRes.data || [];

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const averageOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0;

      setStats({
        totalRevenue: totalRevenue,
        totalOrders: orders.length,
        totalUsers: users.length,
        averageOrderValue: parseFloat(averageOrderValue),
        monthlyGrowth: 12,
        userGrowth: 8,
      });

      // Calculate top foods by counting items in orders
      const foodCounts = {};
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            const foodId = item.foodId?._id || item.foodId;
            const foodName = item.foodId?.name || 'Unknown';
            if (!foodCounts[foodId]) {
              foodCounts[foodId] = { name: foodName, orders: 0, revenue: 0 };
            }
            foodCounts[foodId].orders += item.quantity || 1;
            foodCounts[foodId].revenue += (item.price || 0) * (item.quantity || 1);
          });
        }
      });

      const topFoodsList = Object.values(foodCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopFoods(topFoodsList.length > 0 ? topFoodsList : []);

      // Calculate top restaurants by order count
      const restaurantCounts = {};
      orders.forEach(order => {
        const restId = order.restaurantId?._id || order.restaurantId;
        const restName = order.restaurantId?.name || 'Unknown';
        if (!restaurantCounts[restId]) {
          restaurantCounts[restId] = { name: restName, orders: 0, revenue: 0 };
        }
        restaurantCounts[restId].orders += 1;
        restaurantCounts[restId].revenue += order.totalPrice || 0;
      });

      const topRestaurantsList = Object.values(restaurantCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopRestaurants(topRestaurantsList.length > 0 ? topRestaurantsList : []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { label: 'Mon', orders: 125, revenue: 1250 },
    { label: 'Tue', orders: 150, revenue: 1650 },
    { label: 'Wed', orders: 145, revenue: 1580 },
    { label: 'Thu', orders: 175, revenue: 1920 },
    { label: 'Fri', orders: 200, revenue: 2200 },
    { label: 'Sat', orders: 220, revenue: 2420 },
    { label: 'Sun', orders: 180, revenue: 1980 },
  ];

  if (loading) {
    return (
      <AdminDashboardLayout pageTitle="Analytics">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading analytics...</p>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout pageTitle="Analytics">
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="header-title">
            <h2>Performance Analytics</h2>
            <p>Track your platform's performance and growth metrics</p>
          </div>

          <div className="date-range-selector">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#ec488920' }}>
              <DollarSign size={24} color="#ec4899" />
            </div>
            <div className="metric-content">
              <p className="metric-label">Total Revenue</p>
              <h3 className="metric-value">Ksh {stats.totalRevenue?.toLocaleString() || '0'}</h3>
              <p className="metric-change">
                <TrendingUp size={14} /> +{stats.monthlyGrowth}% from last month
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#f59e0b20' }}>
              <ShoppingCart size={24} color="#f59e0b" />
            </div>
            <div className="metric-content">
              <p className="metric-label">Total Orders</p>
              <h3 className="metric-value">{stats.totalOrders?.toLocaleString() || '0'}</h3>
              <p className="metric-change">Avg: Ksh {stats.averageOrderValue?.toFixed(2) || '0'} per order</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#3b82f620' }}>
              <Users size={24} color="#3b82f6" />
            </div>
            <div className="metric-content">
              <p className="metric-label">Active Users</p>
              <h3 className="metric-value">{stats.totalUsers?.toLocaleString() || '0'}</h3>
              <p className="metric-change">
                <TrendingUp size={14} /> +{stats.userGrowth}% growth
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#22c55e20' }}>
              <BarChart3 size={24} color="#22c55e" />
            </div>
            <div className="metric-content">
              <p className="metric-label">Avg Order Value</p>
              <h3 className="metric-value">Ksh {stats.averageOrderValue?.toFixed(2) || '0'}</h3>
              <p className="metric-change">Per transaction</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card">
            <h3>Weekly Orders & Revenue</h3>
            <div className="mini-chart">
              {chartData.map((data, i) => (
                <div key={i} className="chart-bar" title={`${data.label}: ${data.orders} orders`}>
                  <div
                    className="bar"
                    style={{
                      height: `${(data.orders / 220) * 100}%`,
                      backgroundColor: '#ff6b35',
                    }}
                  ></div>
                  <span className="label">{data.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Top 5 Foods</h3>
            <div className="list-chart">
              {topFoods.map((food, i) => (
                <div key={i} className="list-item">
                  <div className="item-header">
                    <span className="rank">#{i + 1}</span>
                    <span className="name">{food.name}</span>
                  </div>
                  <div className="item-stats">
                    <span className="orders">{food.orders} orders</span>
                    <span className="revenue">Ksh {food.revenue?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Restaurants */}
        <div className="section">
          <h3>Top Performing Restaurants</h3>
          <div className="restaurants-list">
            {topRestaurants.map((restaurant, i) => (
              <div key={i} className="restaurant-row">
                <div className="restaurant-rank">#{i + 1}</div>
                <div className="restaurant-name">{restaurant.name}</div>
                <div className="restaurant-stats">
                  <div className="stat">
                    <span className="label">Orders</span>
                    <span className="value">{restaurant.orders.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Revenue</span>
                    <span className="value">Ksh {restaurant.revenue?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default Analytics;
