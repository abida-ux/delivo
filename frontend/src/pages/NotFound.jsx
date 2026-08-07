import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './pages.css';

const NotFound = () => (
  <div className="page notfound-page">
    <SEO
      title="Page Not Found"
      description="The page you are looking for does not exist on Delivo. Return to homepage to explore delicious meals and shop items."
    />
    <div className="notfound-card">
      <h1>404</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <Link to="/" className="primary-button">
        Return home
      </Link>
    </div>
  </div>
);

export default NotFound;
