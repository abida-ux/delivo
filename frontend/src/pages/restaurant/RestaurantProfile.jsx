import {useEffect, useState} from 'react';
import './RestaurantDashboard.css';

const RestaurantProfile = () => {
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '', openingHours: '', closingHours: '', deliveryRadius: '', location: '' });
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json?.success) {
        setForm({ name: json.data.restaurant.name || '', description: '', phone: '', email: '', openingHours: '', closingHours: '', deliveryRadius: '', location: '' });
      }
    };
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/restaurant/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
  };

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Profile</h1><p>Update your partner profile</p></div></div>
      <div className="panel glass-card">
        <form className="restaurant-form" onSubmit={save}>
          <input placeholder="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Opening Hours" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          <input placeholder="Closing Hours" value={form.closingHours} onChange={(e) => setForm({ ...form, closingHours: e.target.value })} />
          <input placeholder="Delivery Radius" value={form.deliveryRadius} onChange={(e) => setForm({ ...form, deliveryRadius: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="button-row"><button className="btn-primary" type="submit">Save Profile</button></div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantProfile;
