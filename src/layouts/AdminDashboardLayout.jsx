import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import AdminBottomNav from '../components/AdminBottomNav';
import './AdminDashboardLayout.css';

const AdminDashboardLayout = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    </div>
  );
};

export default AdminDashboardLayout;
