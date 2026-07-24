import { useState, useEffect, useRef } from 'react';
import { Menu, Truck, Activity, XCircle, X, ShoppingCart } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import AdminBottomNav from '../components/AdminBottomNav';
import { getNotifications } from '../services/api';
import './AdminDashboardLayout.css';

const AdminDashboardLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const seenNotificationIds = useRef(new Set());
  const isFirstFetch = useRef(true);

  const getToastType = (notification) => {
    const title = String(notification.title || '').toLowerCase();
    const message = String(notification.message || '').toLowerCase();
    
    if (title.includes('rider status')) {
      if (message.includes('offline')) {
        return 'status-offline';
      }
      return 'status-online';
    }

    if (title.includes('new order') || title.includes('order alert') || title.includes('order placed') || title.includes('order received')) {
      return 'new-order';
    }
    
    return 'order-grabbed';
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'status-online':
        return <Activity size={18} />;
      case 'status-offline':
        return <XCircle size={18} />;
      case 'new-order':
        return <ShoppingCart size={18} />;
      default:
        return <Truck size={18} />;
    }
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const pollNotifications = async () => {
      try {
        const data = await getNotifications();
        if (data?.success && data?.notifications) {
          const newNotifications = data.notifications;
          
          if (isFirstFetch.current) {
            // Populate seen set with all current notifications so they don't spam toasts
            newNotifications.forEach((n) => seenNotificationIds.current.add(n._id));
            isFirstFetch.current = false;
            return;
          }

          // We check notifications starting from the oldest to display them in sequence
          const notificationsToToast = [...newNotifications]
            .reverse()
            .filter((n) => !seenNotificationIds.current.has(n._id));

          notificationsToToast.forEach((n) => {
            seenNotificationIds.current.add(n._id);
            const type = getToastType(n);
            const toastId = n._id;

            setToasts((prev) => [
              ...prev,
              {
                id: toastId,
                title: n.title,
                message: n.message,
                type,
                isFading: false,
              },
            ]);

            // Auto-fadeout and remove
            setTimeout(() => {
              setToasts((prev) =>
                prev.map((t) => (t.id === toastId ? { ...t, isFading: true } : t))
              );
            }, 5700);

            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== toastId));
            }, 6000);
          });
        }
      } catch (err) {
        console.error('Error polling admin notifications:', err);
      }
    };

    pollNotifications();
    const interval = setInterval(pollNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
          <AdminNavbar pageTitle={pageTitle} />
        </div>

        <div className="admin-content">
          {children}
        </div>

        <AdminBottomNav />
      </div>

      {/* Modern Glassmorphic Real-time Toasts */}
      <div className="admin-toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`admin-toast ${toast.type} ${toast.isFading ? 'fade-out' : ''}`}
          >
            <div className="admin-toast-icon">
              {getToastIcon(toast.type)}
            </div>
            <div className="admin-toast-content">
              <h4 className="admin-toast-title">{toast.title}</h4>
              <p className="admin-toast-message">{toast.message}</p>
            </div>
            <button
              className="admin-toast-close"
              onClick={() => dismissToast(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
