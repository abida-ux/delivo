import {useState} from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import '../pages.css';
import './MenuManagement.css';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Margherita Pizza',
      category: 'Pizzas',
      price: 12.99,
      description: 'Classic pizza with tomato, mozzarella, basil',
      available: true,
      image: 'https://placehold.co/60x60?text=Pizza'
    },
    {
      id: 2,
      name: 'Pepperoni Pizza',
      category: 'Pizzas',
      price: 14.99,
      description: 'Pizza with pepperoni and cheese',
      available: true,
      image: 'https://placehold.co/60x60?text=Pepperoni'
    },
    {
      id: 3,
      name: 'Garlic Bread',
      category: 'Starters',
      price: 5.99,
      description: 'Fresh garlic bread with herbs',
      available: true,
      image: 'https://placehold.co/60x60?text=Garlic'
    },
    {
      id: 4,
      name: 'Caesar Salad',
      category: 'Salads',
      price: 8.99,
      description: 'Fresh Caesar salad with croutons',
      available: false,
      image: 'https://placehold.co/60x60?text=Salad'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Pizzas', 'Starters', 'Salads', 'Drinks', 'Desserts'];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (id) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const handleToggleAvailability = (id) => {
    setMenuItems(menuItems.map(item =>
      item.id === id ? { ...item, available: !item.available } : item
    ));
  };

  return (
    <div className="menu-management">
      <div className="page-header">
        <div>
          <h1>Menu Management</h1>
          <p>Manage your restaurant menu items</p>
        </div>
        <button className="add-item-btn">
          <Plus size={20} />
          Add New Item
        </button>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? 'category-btn active' : 'category-btn'}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-items-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No menu items found</p>
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map((item) => (
              <div key={item.id} className="menu-item-card">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-category">{item.category}</p>
                  <p className="item-description">{item.description}</p>
                  <p className="item-price">${item.price.toFixed(2)}</p>
                </div>
                <div className="item-status">
                  <button 
                    className={`status-btn ${item.available ? 'available' : 'unavailable'}`}
                    onClick={() => handleToggleAvailability(item.id)}
                  >
                    {item.available ? '✓ Available' : '✗ Out of Stock'}
                  </button>
                </div>
                <div className="item-actions">
                  <button className="action-btn edit-btn">
                    <Edit size={18} />
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="summary-section">
        <div className="summary-item">
          <span>Total Items:</span>
          <strong>{menuItems.length}</strong>
        </div>
        <div className="summary-item">
          <span>Available:</span>
          <strong>{menuItems.filter(i => i.available).length}</strong>
        </div>
        <div className="summary-item">
          <span>Unavailable:</span>
          <strong>{menuItems.filter(i => !i.available).length}</strong>
        </div>
      </div>
    </div>
  );
};

export default MenuManagement;
