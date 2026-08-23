import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="logo">PayGateway</div>
        <div className="nav-links">
          <Link to="/login" className="btn-login">Login</Link>
          <Link to="/signup" className="btn-signup">Sign Up</Link>
        </div>
      </nav>
      <main className="landing-main">
        <h1>Fast, Secure, & Reliable Payment Gateway</h1>
        <p>Accept payments from anywhere with our advanced API and merchant dashboard.</p>
        <Link to="/signup" className="btn-cta">Get Started Now</Link>
      </main>
    </div>
  );
};

export default LandingPage;
