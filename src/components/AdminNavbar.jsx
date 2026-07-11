import React, { useContext } from 'react';
import { User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './AdminNavbar.css';

const AdminNavbar = ({ pageTitle }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="admin-navbar">
      <div className="navbar-left">
        <h1 className="page-title">{pageTitle || 'Dashboard'}</h1>
      </div>

      <div className="navbar-right">
        <div className="navbar-user-section">
          <div className="user-info-small">
            <span className="user-name-small">{user?.name}</span>
            <span className="user-role-small">Admin</span>
          </div>
          <div className="user-avatar-small">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;
