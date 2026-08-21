import React from 'react';

const AuthBrand = () => (
  <div className="auth-brand">
    {/* Logo */}
    <div className="auth-brand-logo">
      <div className="auth-brand-logo-icon">Z</div>
      <div>
        <div className="auth-brand-logo-name">Zetto</div>
        <div className="auth-brand-logo-dot">Payment Gateway</div>
      </div>
    </div>

    {/* Hero Content */}
    <div className="auth-brand-body">
      <h2 className="auth-brand-tagline">
        India's Fastest<br />
        <span>Payment Infrastructure</span>
      </h2>
      <p className="auth-brand-desc">
        Accept payments, manage payouts, and grow your business with Zetto's enterprise-grade payment gateway.
      </p>
      <ul className="auth-brand-features">
        <li>Instant UPI &amp; bank transfers</li>
        <li>Real-time webhook notifications</li>
        <li>Advanced RBAC &amp; team management</li>
        <li>99.9% uptime SLA guarantee</li>
      </ul>
    </div>

    {/* Footer */}
    <div className="auth-brand-footer">
      © 2025 Zetto.in &nbsp;·&nbsp; Secured by 256-bit SSL
    </div>
  </div>
);

export default AuthBrand;
