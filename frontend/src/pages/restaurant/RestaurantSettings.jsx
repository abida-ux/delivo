import React from 'react';
import './RestaurantDashboard.css';

const RestaurantSettings = () => {
  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Settings</h1><p>Adjust preferences for your partner account</p></div></div>
      <div className="panel glass-card">
        <div className="empty-state">Notification preferences, password, and profile photo controls can be extended here.</div>
      </div>
    </div>
  );
};

export default RestaurantSettings;
