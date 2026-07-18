import {useState} from 'react';
import { Star, Users, TrendingUp, Award, Heart, CheckCircle, Zap, Users2, Globe, Lightbulb, Rocket, Handshake, Leaf } from 'lucide-react';
import './About.css';
import MainLayout from '../layouts/MainLayout';

const About = () => {
  const [activeTab, setActiveTab] = useState('about');
  const [ratings] = useState({
    average: 4.7,
    total: 12500,
    distribution: [
      { stars: 5, percentage: 65, count: 8125 },
      { stars: 4, percentage: 20, count: 2500 },
      { stars: 3, percentage: 10, count: 1250 },
      { stars: 2, percentage: 3, count: 375 },
      { stars: 1, percentage: 2, count: 250 }
    ]
  });

  const [reviews] = useState([
    {
      id: 1,
      name: 'Sarah M.',
      rating: 5,
      text: 'Delivo has completely changed how I order food. Fast delivery, great restaurants, and excellent customer service!',
      date: '2 days ago',
      verified: true
    },
    {
      id: 2,
      name: 'Ahmed K.',
      rating: 5,
      text: 'Love the variety of stores and restaurants available. The app is very user-friendly and reliable.',
      date: '1 week ago',
      verified: true
    },
    {
      id: 3,
      name: 'Jessica L.',
      rating: 4,
      text: 'Great platform overall. Would love to see more payment options, but otherwise very satisfied.',
      date: '2 weeks ago',
      verified: true
    },
    {
      id: 4,
      name: 'David R.',
      rating: 5,
      text: 'Best delivery app in the city. Consistent quality, competitive prices, and amazing customer support.',
      date: '3 weeks ago',
      verified: true
    }
  ]);

  return (
    <MainLayout>
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <div className="hero-content">
            <h1>About Delivo</h1>
            <p>Delivering excellence, one order at a time</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="about-tabs">
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            Our Story
          </button>
          <button
            className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            Ratings & Reviews
          </button>
          <button
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Our Team
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="about-section">
              <div className="about-intro">
                <h2>Our Mission</h2>
                <p>
                  At Delivo, we're revolutionizing the way people order food and everyday essentials. 
                  We believe that everyone deserves access to their favorite restaurants and stores 
                  with fast, reliable delivery right at their doorstep.
                </p>
              </div>

              <div className="about-grid">
                <div className="about-card">
                  <Rocket size={32} className="about-icon" />
                  <h3>Innovation</h3>
                  <p>Using cutting-edge technology to make ordering faster and easier than ever</p>
                </div>

                <div className="about-card">
                  <Handshake size={32} className="about-icon" />
                  <h3>Community</h3>
                  <p>Building a vibrant ecosystem connecting customers, restaurants, and riders</p>
                </div>

                <div className="about-card">
                  <Leaf size={32} className="about-icon" />
                  <h3>Sustainability</h3>
                  <p>Committed to eco-friendly practices and supporting local businesses</p>
                </div>

                <div className="about-card">
                  <Lightbulb size={32} className="about-icon" />
                  <h3>Excellence</h3>
                  <p>Striving for the highest standards in service, quality, and reliability</p>
                </div>
              </div>

              <div className="about-story">
                <h2>Our Journey</h2>
                <div className="story-timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker">2020</div>
                    <div className="timeline-content">
                      <h4>Founded</h4>
                      <p>Delivo was born from a simple idea: make food delivery accessible to everyone</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-marker">2021</div>
                    <div className="timeline-content">
                      <h4>Rapid Expansion</h4>
                      <p>Expanded to 50+ cities with 5,000+ partner restaurants</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-marker">2022</div>
                    <div className="timeline-content">
                      <h4>New Categories</h4>
                      <p>Added grocery, beverages, and specialty stores to our platform</p>
                    </div>
                  </div>

                  <div className="timeline-item">
                    <div className="timeline-marker">2024</div>
                    <div className="timeline-content">
                      <h4>Today</h4>
                      <p>Serving over 500,000 customers with 12,500+ reviews and 4.7★ rating</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="values-section">
                <h2>Our Core Values</h2>
                <div className="values-grid">
                  <div className="value-item">
                    <Heart size={24} />
                    <h4>Customer First</h4>
                    <p>Your satisfaction is our priority</p>
                  </div>

                  <div className="value-item">
                    <CheckCircle size={24} />
                    <h4>Integrity</h4>
                    <p>Honest and transparent in everything we do</p>
                  </div>

                  <div className="value-item">
                    <TrendingUp size={24} />
                    <h4>Growth</h4>
                    <p>Continuously innovating and improving</p>
                  </div>

                  <div className="value-item">
                    <Award size={24} />
                    <h4>Excellence</h4>
                    <p>Delivering quality in every interaction</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ratings & Reviews Tab */}
          {activeTab === 'ratings' && (
            <div className="ratings-section">
              <div className="rating-summary">
                <div className="rating-average">
                  <div className="avg-number">{ratings.average}</div>
                  <div className="avg-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        fill={i < Math.floor(ratings.average) ? '#ff6b35' : '#e0e0e0'}
                        color={i < Math.floor(ratings.average) ? '#ff6b35' : '#e0e0e0'}
                      />
                    ))}
                  </div>
                  <div className="avg-text">Based on {ratings.total.toLocaleString()} reviews</div>
                </div>

                <div className="rating-distribution">
                  {ratings.distribution.map((item) => (
                    <div key={item.stars} className="distribution-item">
                      <div className="dist-stars">
                        {item.stars}
                        <Star size={14} fill="#ff6b35" color="#ff6b35" />
                      </div>
                      <div className="dist-bar">
                        <div
                          className="dist-fill"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="dist-count">{item.count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reviews-list">
                <h3>Latest Reviews</h3>
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">{review.name.charAt(0)}</div>
                        <div>
                          <h4>{review.name}</h4>
                          <div className="review-meta">
                            <div className="review-stars">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < review.rating ? '#ff6b35' : '#e0e0e0'}
                                  color={i < review.rating ? '#ff6b35' : '#e0e0e0'}
                                />
                              ))}
                            </div>
                            <span className="review-date">{review.date}</span>
                            {review.verified && (
                              <span className="verified-badge">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="review-text">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="team-section">
              <h2>Meet Our Team</h2>
              <p className="team-intro">
                Delivo is powered by a passionate team dedicated to delivering excellence
              </p>

              <div className="team-grid">
                <div className="team-member">
                  <div className="member-avatar">👨‍💼</div>
                  <h3>John Kariuki</h3>
                  <p className="member-role">CEO & Founder</p>
                  <p className="member-bio">Visionary leader with 15+ years in logistics and delivery</p>
                </div>

                <div className="team-member">
                  <div className="member-avatar">👩‍💼</div>
                  <h3>Emily Ochieng</h3>
                  <p className="member-role">COO</p>
                  <p className="member-bio">Operations expert ensuring seamless delivery experience</p>
                </div>

                <div className="team-member">
                  <div className="member-avatar">👨‍💻</div>
                  <h3>James Kipchoge</h3>
                  <p className="member-role">CTO</p>
                  <p className="member-bio">Tech innovator building next-gen delivery solutions</p>
                </div>

                <div className="team-member">
                  <div className="member-avatar">👩‍💻</div>
                  <h3>Grace Mwangi</h3>
                  <p className="member-role">Head of Customer Service</p>
                  <p className="member-bio">Committed to providing exceptional customer support</p>
                </div>
              </div>

              <div className="team-stats">
                <div className="stat-card">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Team Members</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Cities</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number">12500+</div>
                  <div className="stat-label">Positive Reviews</div>
                </div>

                <div className="stat-card">
                  <div className="stat-number">4.7★</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="about-cta">
          <h2>Join Our Growing Community</h2>
          <p>Experience fast, reliable delivery like never before</p>
          <button className="cta-button">Get Started Today</button>
        </div>
      </div>
    </MainLayout>
  );
};

export default About;
