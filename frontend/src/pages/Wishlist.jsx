import './Wishlist.css';

export default function Wishlist() {
  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <h1>Your Wishlist</h1>
        <p>Save favorite meals and restaurants here for quick access later.</p>

        <div className="wishlist-placeholder-card">
          <h2>No items yet</h2>
          <p>Start browsing the menu and add items to your wishlist.</p>
        </div>
      </div>
    </div>
  );
}
