import React, { useState } from 'react';
import { TrendingUp, DollarSign, Users, Clock, CheckCircle, ArrowRight, Smartphone, ClipboardList, Bike, Star, Gift, CreditCard, Building2, BarChart3, MessageCircle, Mail, Phone } from 'lucide-react';
import './Business.css';
import MainLayout from '../layouts/MainLayout';

const Business = () => {
  const [activeTab, setActiveTab] = useState('benefits');

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Reach thousands of new customers and increase your revenue exponentially'
    },
    {
      icon: Clock,
      title: '24/7 Operations',
      description: 'Stay open and receiving orders 24 hours a day, 7 days a week'
    },
    {
      icon: CreditCard,
      title: 'Multiple Payment',
      description: 'Customers can pay with cards, mobile money, and cash on delivery'
    },
    {
      icon: BarChart3,
      title: 'Targeted Marketing',
      description: 'Reach customers in your area with our smart marketing tools'
    },
    {
      icon: CheckCircle,
      title: 'Real-time Analytics',
      description: 'Get insights into customer behavior and sales patterns'
    },
    {
      icon: Bike,
      title: 'Reliable Delivery',
      description: 'Our network of riders ensures timely and safe delivery'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Register Your Business',
      description: 'Sign up and provide basic information about your restaurant or store'
    },
    {
      number: '02',
      title: 'Add Your Menu/Products',
      description: 'Upload your menu items or products with descriptions and prices'
    },
    {
      number: '03',
      title: 'Get Verified',
      description: 'Our team verifies your business documents and approval takes 24-48 hours'
    },
    {
      number: '04',
      title: 'Start Receiving Orders',
      description: 'Go live and start receiving orders from Delivo customers'
    }
  ];

  const features = [
    {
      title: 'Smart Dashboard',
      description: 'Manage orders, inventory, and analytics from one place',
      icon: Smartphone
    },
    {
      title: 'Order Management',
      description: 'Accept, prepare, and track orders in real-time',
      icon: ClipboardList
    },
    {
      title: 'Rider Integration',
      description: 'Automatically assign orders to available delivery riders',
      icon: Bike
    },
    {
      title: 'Customer Ratings',
      description: 'Build trust with customer reviews and ratings',
      icon: Star
    },
    {
      title: 'Promotional Tools',
      description: 'Create discounts, offers, and loyalty programs',
      icon: Gift
    },
    {
      title: 'Payment Processing',
      description: 'Secure payment processing with instant payouts',
      icon: DollarSign
    }
  ];

  const faq = [
    {
      question: 'How long does verification take?',
      answer: 'Most businesses are verified within 24-48 hours. We review your documents and contact you if we need any additional information.'
    },
    {
      question: 'What commission does Delivo charge?',
      answer: 'We charge a competitive commission starting from 10% on each order. The exact rate depends on your category and location.'
    },
    {
      question: 'Can I edit my menu/products after going live?',
      answer: 'Yes! You can update your menu, prices, and product details anytime from your dashboard.'
    },
    {
      question: 'How do I get paid?',
      answer: 'We process payments daily. You can withdraw to your bank account, mobile money, or choose automatic transfers.'
    },
    {
      question: 'What if I have issues with a delivery?',
      answer: 'Our dedicated support team is available 24/7 to help resolve any issues quickly and professionally.'
    },
    {
      question: 'Can I reject orders?',
      answer: 'Yes, but we encourage accepting orders. Multiple rejections may affect your visibility and rating.'
    }
  ];

  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <MainLayout>
      <div className="business-container">
        {/* Hero Section */}
        <div className="business-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1>Grow Your Business with Delivo</h1>
            <p>Join thousands of successful restaurants and stores already earning more</p>
            <button className="hero-cta-btn">Become a Partner</button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="business-stats">
          <div className="stat-item">
            <Building2 size={32} className="stat-icon" />
            <div className="stat-content">
              <h3>5,000+</h3>
              <p>Partner Businesses</p>
            </div>
          </div>

          <div className="stat-item">
            <Users size={32} className="stat-icon" />
            <div className="stat-content">
              <h3>500,000+</h3>
              <p>Active Customers</p>
            </div>
          </div>

          <div className="stat-item">
            <CheckCircle size={32} className="stat-icon" />
            <div className="stat-content">
              <h3>1M+</h3>
              <p>Orders Delivered</p>
            </div>
          </div>

          <div className="stat-item">
            <Star size={32} className="stat-icon" />
            <div className="stat-content">
              <h3>4.7★</h3>
              <p>Average Rating</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="business-tabs">
          <button
            className={`tab-btn ${activeTab === 'benefits' ? 'active' : ''}`}
            onClick={() => setActiveTab('benefits')}
          >
            Benefits
          </button>
          <button
            className={`tab-btn ${activeTab === 'howto' ? 'active' : ''}`}
            onClick={() => setActiveTab('howto')}
          >
            How to Get Started
          </button>
          <button
            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className="benefits-section">
              <h2>Why Partner With Delivo?</h2>
              <div className="benefits-grid">
                {benefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <div key={index} className="benefit-card">
                      <IconComponent size={32} className="benefit-icon" />
                      <h3>{benefit.title}</h3>
                      <p>{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* How to Get Started Tab */}
          {activeTab === 'howto' && (
            <div className="howto-section">
              <h2>Getting Started is Easy</h2>
              <div className="steps-container">
                {steps.map((step, index) => (
                  <div key={index} className="step-card">
                    <div className="step-number">{step.number}</div>
                    <div className="step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                    {index < steps.length - 1 && <div className="step-arrow">→</div>}
                  </div>
                ))}
              </div>

              <div className="requirements-section">
                <h3>Requirements</h3>
                <div className="requirements-list">
                  <div className="requirement-item">
                    <CheckCircle size={20} />
                    <span>Valid business registration</span>
                  </div>
                  <div className="requirement-item">
                    <CheckCircle size={20} />
                    <span>Health permits and certifications</span>
                  </div>
                  <div className="requirement-item">
                    <CheckCircle size={20} />
                    <span>Bank account for payments</span>
                  </div>
                  <div className="requirement-item">
                    <CheckCircle size={20} />
                    <span>Business address within covered area</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="features-section">
              <h2>Powerful Tools for Your Success</h2>
              <div className="features-grid">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={index} className="feature-card">
                      <IconComponent size={32} className="feature-icon" />
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faq.map((item, index) => (
                  <div
                    key={index}
                    className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                    >
                      <span>{item.question}</span>
                      <span className="faq-toggle">
                        {expandedFaq === index ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFaq === index && (
                      <div className="faq-answer">{item.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="business-cta">
          <h2>Ready to Grow Your Business?</h2>
          <p>Join our network of successful partners today</p>
          <button className="cta-button">Start Your Application</button>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2>Need Help?</h2>
          <p>Our partnership team is here to support you</p>
          <div className="contact-options">
            <div className="contact-card">
              <Mail size={32} className="contact-icon" />
              <h3>Email</h3>
              <p>partners@delivo.com</p>
            </div>
            <div className="contact-card">
              <Phone size={32} className="contact-icon" />
              <h3>Phone</h3>
              <p>+1 (555) 123-4567</p>
            </div>
            <div className="contact-card">
              <MessageCircle size={32} className="contact-icon" />
              <h3>Chat</h3>
              <p>Available 24/7</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Business;
