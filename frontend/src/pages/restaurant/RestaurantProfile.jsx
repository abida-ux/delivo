import {useEffect, useState} from 'react';
import './RestaurantDashboard.css';

const RestaurantProfile = () => {
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '', openingHours: '', closingHours: '', deliveryRadius: '', location: '', isOpen: true });
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in again to view your restaurant profile.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/restaurant/dashboard', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const restaurant = json?.data?.restaurant || json?.restaurant || {};

        setForm((prev) => ({
          ...prev,
          name: restaurant.name || prev.name || '',
          description: restaurant.description || prev.description || '',
          phone: restaurant.phone || prev.phone || '',
          email: restaurant.email || prev.email || '',
          openingHours: restaurant.openingHours || prev.openingHours || '',
          closingHours: restaurant.closingHours || prev.closingHours || '',
          deliveryRadius: restaurant.deliveryRadius ?? prev.deliveryRadius ?? '',
          location: restaurant.location || prev.location || '',
          isOpen: restaurant.isOpen !== undefined ? restaurant.isOpen : prev.isOpen,
        }));
      } catch (loadError) {
        console.error('Failed to load restaurant profile', loadError);
        setError('Unable to load your restaurant profile right now.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json?.success) {
        setStatusMessage('Profile updated successfully.');
      } else {
        setStatusMessage(json?.message || 'Unable to update profile right now.');
      }
    } catch (saveError) {
      console.error('Failed to save restaurant profile', saveError);
      setStatusMessage('Unable to update profile right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Profile</h1><p>Update your partner profile</p></div></div>
      <div className="panel glass-card">
        {loading ? <p className="helper-text">Loading your restaurant profile…</p> : null}
        {error ? <p className="status-message">{error}</p> : null}
        <form className="restaurant-form" onSubmit={save}>
          <input placeholder="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Opening Hours" value={form.openingHours} onChange={(e) => setForm({ ...form, openingHours: e.target.value })} />
          <input placeholder="Closing Hours" value={form.closingHours} onChange={(e) => setForm({ ...form, closingHours: e.target.value })} />
          <input placeholder="Delivery Radius" value={form.deliveryRadius} onChange={(e) => setForm({ ...form, deliveryRadius: e.target.value })} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label className="availability-toggle">
            <input type="checkbox" checked={Boolean(form.isOpen)} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
            <span>{Boolean(form.isOpen) ? 'Open now' : 'Closed for now'}</span>
          </label>
          <p className="helper-text">Switch this on when your restaurant is ready to receive orders, and off when you are closed.</p>
          {statusMessage ? <p className="status-message">{statusMessage}</p> : null}
          <div className="button-row"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantProfile;
