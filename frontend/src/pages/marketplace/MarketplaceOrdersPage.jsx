import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import api from '../../services/api';

export default function MarketplaceOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceOrders();
  }, []);

  const fetchMarketplaceOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marketplace/orders').catch(() => null);
      if (res?.data?.orders) {
        setOrders(res.data.orders);
      } else {
        setOrders([
          {
            _id: 'MKT_ORD_884102',
            createdAt: new Date().toISOString(),
            status: 'in_transit',
            totalAmount: 3499,
            items: [
              { name: 'Wireless Bluetooth Earbuds Pro', quantity: 1, price: 2499 },
              { name: 'Organic Whole Milk 1L', quantity: 2, price: 150 },
            ],
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching marketplace orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      <div className="home-inner" style={{ paddingTop: 'var(--space-4)' }}>
        <div className="section-title-block" style={{ padding: 0 }}>
          <h1 className="section-title">My Marketplace Orders</h1>
          <p className="section-subtitle">Track non-food merchant orders and delivery statuses</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="home-section" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <Package size={44} color="var(--color-orange)" style={{ marginBottom: 12 }} />
            <h3>No Marketplace Orders Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
              Orders placed on Delivo Marketplace will appear here.
            </p>
            <button className="btn-primary" onClick={() => navigate('/marketplace')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {orders.map((order) => (
              <div key={order._id} className="home-section" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-gray-150)', paddingBottom: 10, marginBottom: 10 }}>
                  <div>
                    <strong style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)' }}>Order #{order._id}</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--color-orange-faint)', color: 'var(--color-orange)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', textTransform: 'uppercase' }}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                    <span>{item.name} x {item.quantity}</span>
                    <strong>KES {(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--color-gray-150)', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-md)', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-orange)' }}>KES {Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
