import React from 'react';
import { Search, ShoppingBag, CreditCard, ShoppingCart, Truck } from 'lucide-react';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      id: 1,
      title: "Browse Restaurants",
      description: "Explore nearby restaurants and discover your favorite dishes.",
      icon: <Search size={28} />,
    },
    {
      id: 2,
      title: "Add to Cart",
      description: "Select meals you love and add them to your cart.",
      icon: <ShoppingCart size={28} />,
    },
    {
      id: 3,
      title: "Review Checkout",
      description: "Review your order, adjust quantities, and proceed to checkout.",
      icon: <ShoppingBag size={28} />,
    },
    {
      id: 4,
      title: "Secure Payment",
      description: "Enter your phone number and confirm payment via M-Pesa STK push.",
      icon: <CreditCard size={28} />,
    },
    {
      id: 5,
      title: "Fast Delivery",
      description: "Your order is prepared, dispatched, and delivered to your doorstep.",
      icon: <Truck size={28} />,
    },
  ];

  return (
    <section className="how-it-works-section">
      {/* Background Grid Lines for Technical SaaS Aesthetic */}
      <div className="bg-grid-overlay"></div>

      <div className="section-header">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">From craving to doorstep in just a few steps</p>
      </div>

      <div className="steps-timeline-container">
        {/* Animated Journey Indicator - Delivery Bike */}
        <div className="journey-indicator">
          <span className="journey-icon">🏍️</span>
        </div>

        {steps.map((step, index) => (
          <div key={step.id} className="step-card-wrapper">
            {/* Connecting Track Line (Hidden after the last item) */}
            {index < steps.length - 1 && <div className="step-connect-line"></div>}

            <div className="step-card">
              {/* Top Row: Floating Step Counter & Icon Panel */}
              <div className="step-card-header">
                <div className="step-number-badge">0{step.id}</div>
                <div className="step-icon-panel">{step.icon}</div>
              </div>

              {/* Bottom Row: Text Content */}
              <div className="step-card-body">
                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-description">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;