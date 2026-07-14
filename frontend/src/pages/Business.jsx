import React from 'react';
import { ArrowRight, MessageCircle, Mail, Phone } from 'lucide-react';
import './Business.css';
import MainLayout from '../layouts/MainLayout';

const Business = () => {
  return (
    <MainLayout>
      <div className="business-container">
        <div className="business-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1>Partner with Delivo</h1>
            <p>We support local restaurants and stores with a simple, reliable delivery experience. Reach out to our team for partnership questions and next steps.</p>
            <div className="hero-actions">
              <a className="hero-cta-btn" href="mailto:partners@delivo.com">
                Contact Partnerships
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="partner-support-card">
          <h2>How we can help</h2>
          <p>Whether you run a café, restaurant, or small shop, our team can help you understand the support available and how to get started.</p>
          <ul className="support-list">
            <li>Menu and order setup guidance</li>
            <li>Local delivery support</li>
            <li>Customer support and onboarding questions</li>
          </ul>
        </div>

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
              <p>+254 700 000 000</p>
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
