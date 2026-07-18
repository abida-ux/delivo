import {useEffect, useState} from 'react';
import './RestaurantDashboard.css';

const RestaurantFoods = () => {
  const [foods, setFoods] = useState([]);
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/restaurant/foods', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setFoods(json?.data || []);
    };
    load();
  }, []);

  return (
    <div className="restaurant-shell">
      <div className="restaurant-header glass-card"><div><h1>Foods</h1><p>Manage your restaurant menu</p></div></div>
      <div className="panel glass-card">{foods.length === 0 ? <div className="empty-state">No foods added yet.</div> : <table className="table"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Available</th></tr></thead><tbody>{foods.map((food) => <tr key={food._id} className="table-row"><td>{food.name}</td><td>{food.category}</td><td>KES {Number(food.price || 0).toLocaleString()}</td><td>{food.isAvailable ? 'Yes' : 'No'}</td></tr>)}</tbody></table>}</div>
    </div>
  );
};

export default RestaurantFoods;
