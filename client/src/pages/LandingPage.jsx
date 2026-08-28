import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiShield, FiZap, FiCode, FiActivity,
  FiCheckCircle, FiMenu, FiX, FiDollarSign, FiLink,
  FiRefreshCw, FiBell, FiLock, FiUsers, FiTrendingUp,
  FiGlobe, FiStar, FiChevronDown
} from 'react-icons/fi';
import './LandingPage.css';

const FEATURES = [
  { icon: <FiZap />, color: 'blue', title: 'Instant Settlements', desc: 'Real-time payouts and lightning-fast transaction processing with 99.9% uptime SLA.' },
  { icon: <FiShield />, color: 'indigo', title: 'Bank-grade Security', desc: 'End-to-end encryption, fraud detection, and PCI-DSS compliance built in from day one.' },
  { icon: <FiCode />, color: 'cyan', title: 'Developer First API', desc: 'Clean REST APIs, real-time webhooks, and ready-made SDKs to integrate in minutes.' },
  { icon: <FiActivity />, color: 'blue', title: 'Real-time Analytics', desc: 'Live dashboard with success rates, revenue insights, and transaction monitoring.' },
  { icon: <FiDollarSign />, color: 'indigo', title: 'Smart Payouts', desc: 'Automated payouts to banks, UPI, and wallets. Bulk transfers with a single API call.' },
  { icon: <FiLink />, color: 'cyan', title: 'Payment Links & QR', desc: 'Generate shareable payment links and dynamic QR codes — no code required.' },
];

const REASONS = [
  'No hidden fees or setup charges',
  'Instant payin & payout support',
  'Dedicated webhook callbacks',
  'Merchant-level API key system',
  '24/7 technical support',
  'Multi-currency & UPI support',
  'Auto-retry failed transactions',
  'Detailed settlement reports',
];

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up in 2 minutes. No paperwork, no waiting. Instant approval for startups.' },
  { num: '02', title: 'Get API Keys', desc: 'Generate your API keys from the merchant dashboard. Test in sandbox first.' },
  { num: '03', title: 'Integrate & Go Live', desc: 'Integrate our simple API and start accepting payments in production immediately.' },
];

const INDUSTRIES = [
  { label: 'E-Commerce', desc: 'Checkout, links & QR for online and omnichannel sales', color: 'bg-ind-1' },
  { label: 'Education', desc: 'Course fees, admissions & EMI instalments on rails', color: 'bg-ind-2' },
  { label: 'SaaS & Startups', desc: 'Subscription billing and automated invoicing', color: 'bg-ind-3' },
  { label: 'Travel & Events', desc: 'Bookings, deposits & on-site collections made simple', color: 'bg-ind-4' },
  { label: 'Healthcare', desc: 'Clinic fees, lab payments and insurance collections', color: 'bg-ind-5' },
  { label: 'Logistics', desc: 'COD reconciliation, vendor payouts & fleet settlements', color: 'bg-ind-6' },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', role: 'CEO, ShopNow', text: "Zetto Pay cut our integration time from weeks to 2 days. The API is incredibly clean and the support team is always available.", rating: 5 },
  { name: 'Priya Mehta', role: 'CTO, EduLink', text: "We process thousands of fee collections daily. Zetto's webhook reliability is unmatched — we've never missed a payment notification.", rating: 5 },
  { name: 'Amit Singh', role: 'Founder, QuickDeliver', text: "The bulk payout feature saves us hours every day. Our vendor payments are now fully automated with zero errors.", rating: 5 },
];

const FAQS = [
  { q: 'How quickly can I go live?', a: 'You can integrate and go live in as little as 2 hours. Our sandbox environment lets you test everything before production.' },
  { q: 'Are there any setup fees?', a: 'No setup fees, no hidden charges. You only pay per successful transaction. Check our transparent pricing page.' },
  { q: 'What payment methods do you support?', a: 'We support UPI, Net Banking, Credit/Debit Cards, Wallets, and IMPS/NEFT for payouts.' },
  { q: 'How does the payout process work?', a: 'Payouts are initiated via our API and typically settle within minutes for UPI and a few hours for bank transfers.' },
  { q: 'Is my data secure?', a: 'Yes. We use TLS 1.3 encryption, store zero card data, and are fully PCI-DSS compliant. All webhooks are HMAC-signed.' },
  { q: 'Do you offer multi-merchant or reseller accounts?', a: 'Yes! Our platform supports multi-merchant management with separate API keys, wallets, and reporting per merchant.' },
];

const PARTNERS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'IMPS', 'NEFT', 'Net Banking', 'Wallets', 'UPI', 'Visa', 'Mastercard', 'RuPay', 'IMPS', 'NEFT', 'Net Banking', 'Wallets'];

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="lp-root">
      {/* ── Navbar ── */}
      <header className="lp-navbar">
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand">
            <div className="lp-brand-icon">Z</div>
            <span className="lp-brand-name">Zetto<span className="lp-brand-dot">Pay</span></span>
          </Link>
          <nav className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#industries" onClick={() => setMenuOpen(false)}>Industries</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link to="/login" className="lp-nav-login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" className="lp-nav-cta" onClick={() => setMenuOpen(false)}>
              Get Started <FiArrowRight />
            </Link>
          </nav>
          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg-grid"></div>
        <div className="lp-hero-glow"></div>
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot"></span>
            Trusted Payment Infrastructure for India
          </div>
          <h1 className="lp-hero-title">
            The Fastest Way to<br />
            <span className="lp-gradient-text">Accept & Send Payments</span>
          </h1>
          <p className="lp-hero-subtitle">
            Zetto Pay provides a powerful, developer-friendly payment gateway. Integrate payins, payouts, and real-time webhooks with a single API — built for startups and enterprises.
          </p>
          <div className="lp-hero-actions">
            <Link to="/signup" className="lp-btn-primary lp-btn-lg">
              Start Processing Free <FiArrowRight className="lp-btn-arrow" />
            </Link>
            <Link to="/login" className="lp-btn-outline lp-btn-lg">
              Merchant Login
            </Link>
          </div>
          <div className="lp-hero-trust">
            {['Instant KYC', 'No Setup Fee', 'Live Webhooks', '24/7 Support'].map(t => (
              <span key={t} className="lp-trust-chip">
                <FiCheckCircle className="lp-trust-icon" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="lp-hero-mockup-wrap">
          <div className="lp-mockup-glow"></div>
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <span className="lp-dot lp-dot-red"></span>
              <span className="lp-dot lp-dot-yellow"></span>
              <span className="lp-dot lp-dot-green"></span>
              <span className="lp-mockup-url">dashboard.zetto.in</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                <div className="lp-sidebar-logo"></div>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="lp-sidebar-item" style={{opacity: 1 - i * 0.12}}></div>
                ))}
              </div>
              <div className="lp-mockup-main">
                <div className="lp-mockup-stat-row">
                  {['blue','indigo','cyan'].map(c => (
                    <div key={c} className={`lp-stat-mini lp-stat-${c}`}>
                      <div className="lp-stat-mini-val"></div>
                      <div className="lp-stat-mini-lbl"></div>
                    </div>
                  ))}
                </div>
                <div className="lp-mockup-chart">
                  {[40,70,50,90,60,80,55,95].map((h, i) => (
                    <div key={i} className="lp-chart-bar" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="lp-mockup-table-row">
                  <div className="lp-table-mock-line"></div>
                  <div className="lp-table-badge success"></div>
                </div>
                <div className="lp-mockup-table-row">
                  <div className="lp-table-mock-line short"></div>
                  <div className="lp-table-badge pending"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Band ── */}
      <section className="lp-stats-band">
        <div className="lp-stats-inner">
          {[
            { val: '₹500Cr+', lbl: 'Transactions Processed' },
            { val: '99.9%', lbl: 'API Uptime' },
            { val: '2 min', lbl: 'Integration Time' },
            { val: '10,000+', lbl: 'Happy Merchants' },
          ].map(s => (
            <div key={s.lbl} className="lp-stat-item">
              <span className="lp-stat-val">{s.val}</span>
              <span className="lp-stat-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment Partners Marquee ── */}
      <section className="lp-partners">
        <div className="lp-section-inner">
          <p className="lp-partners-label">WORKS WITH ALL MAJOR PAYMENT METHODS</p>
        </div>
        <div className="lp-marquee-outer">
          <div className="lp-marquee-fade lp-marquee-fade-left"></div>
          <div className="lp-marquee-track">
            {PARTNERS.map((p, i) => (
              <span key={i} className="lp-marquee-chip">{p}</span>
            ))}
          </div>
          <div className="lp-marquee-fade lp-marquee-fade-right"></div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">FEATURES</p>
            <h2 className="lp-section-title">Everything you need to grow</h2>
            <p className="lp-section-sub">Powerful tools built for modern businesses. Simple to integrate, impossible to outgrow.</p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className={`lp-feature-card lp-fc-${f.color}`}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-how" id="how-it-works">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">HOW IT WORKS</p>
            <h2 className="lp-section-title">Get started in 3 simple steps</h2>
            <p className="lp-section-sub">From signup to your first payment in less than an hour.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-arrow"><FiArrowRight /></div>}
              </div>
            ))}
          </div>
          <div className="lp-how-cta">
            <Link to="/signup" className="lp-btn-primary">Create Free Account <FiArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* ── Process Flow: Business → Zetto → Partners ── */}
      <section className="lp-flow-section">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">ARCHITECTURE</p>
            <h2 className="lp-section-title">We build the technology.<br /><span className="lp-gradient-text">You run the business.</span></h2>
            <p className="lp-section-sub">Zetto Pay sits between your application and the payment rails — handling all the complexity so you don't have to.</p>
          </div>
          <div className="lp-flow-row">
            <div className="lp-flow-box lp-flow-outline">
              <div className="lp-flow-icon"><FiUsers /></div>
              <h4>Your Business</h4>
              <p>Website, app, or ops team collecting payments</p>
            </div>
            <div className="lp-flow-arrow"><FiArrowRight /><div className="lp-flow-line"></div></div>
            <div className="lp-flow-box lp-flow-solid">
              <div className="lp-brand-icon" style={{margin: '0 auto 0.75rem'}}>Z</div>
              <h4>Zetto Pay</h4>
              <p>APIs, dashboard, webhooks & integration layer</p>
            </div>
            <div className="lp-flow-arrow"><FiArrowRight /><div className="lp-flow-line"></div></div>
            <div className="lp-flow-box lp-flow-outline">
              <div className="lp-flow-icon"><FiLock /></div>
              <h4>Payment Rails</h4>
              <p>Secure banking infrastructure for acceptance & settlement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries ── */}
      <section className="lp-industries" id="industries">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">INDUSTRIES</p>
            <h2 className="lp-section-title">Built for every industry</h2>
            <p className="lp-section-sub">From education and healthcare to logistics and D2C — Zetto Pay adapts to how your sector operates.</p>
          </div>
        </div>
        <div className="lp-ind-marquee-outer">
          <div className="lp-ind-marquee-fade lp-ind-fade-left"></div>
          <div className="lp-ind-marquee-track">
            {[...INDUSTRIES, ...INDUSTRIES].map((ind, i) => (
              <div key={i} className={`lp-ind-card ${ind.color}`}>
                <div className="lp-ind-overlay"></div>
                <div className="lp-ind-content">
                  <p className="lp-ind-tag">INDUSTRY</p>
                  <h3>{ind.label}</h3>
                  <p>{ind.desc}</p>
                  <span className="lp-ind-explore">Explore <FiArrowRight /></span>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-ind-marquee-fade lp-ind-fade-right"></div>
        </div>
      </section>

      {/* ── Developer Section ── */}
      <section className="lp-dev-section">
        <div className="lp-section-inner lp-dev-inner">
          <div className="lp-dev-text">
            <p className="lp-section-kicker">FOR DEVELOPERS</p>
            <h2 className="lp-section-title">Integrate in minutes,<br /><span className="lp-gradient-text">not days.</span></h2>
            <p className="lp-section-sub">Our clean REST API, detailed documentation, and Postman collection make integration a breeze. Test in sandbox, deploy to production.</p>
            <ul className="lp-dev-list">
              <li><FiCheckCircle /> REST API with JSON responses</li>
              <li><FiCheckCircle /> HMAC-signed webhook callbacks</li>
              <li><FiCheckCircle /> Sandbox & production environments</li>
              <li><FiCheckCircle /> Real-time transaction logs</li>
            </ul>
            <div className="lp-dev-actions">
              <Link to="/signup" className="lp-btn-primary">Start Building <FiArrowRight /></Link>
            </div>
          </div>
          <div className="lp-dev-code">
            <div className="lp-code-window">
              <div className="lp-code-bar">
                <span className="lp-dot lp-dot-red"></span>
                <span className="lp-dot lp-dot-yellow"></span>
                <span className="lp-dot lp-dot-green"></span>
                <span className="lp-code-title">create_order.js</span>
              </div>
              <pre className="lp-code-body"><code>{`const response = await fetch(
  'https://api.zetto.in/api/orders',
  {
    method: 'POST',
    headers: {
      'x-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 5000,
      currency: 'INR',
      orderId: 'ORD_12345',
      callbackUrl: 'https://yoursite.com/webhook'
    })
  }
);

const order = await response.json();
// ✅ { status: true, paymentUrl: '...' }`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="lp-why" id="why-us">
        <div className="lp-section-inner lp-why-inner">
          <div className="lp-why-text">
            <p className="lp-section-kicker">WHY ZETTO PAY</p>
            <h2 className="lp-section-title">Built different.<br/>Designed to win.</h2>
            <p className="lp-section-sub">We've built the infrastructure that lets you focus on your product, not payments.</p>
            <ul className="lp-reasons">
              {REASONS.map(r => (
                <li key={r}>
                  <FiCheckCircle className="lp-reason-icon" />{r}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="lp-btn-primary lp-mt-lg">
              Get Started Today <FiArrowRight />
            </Link>
          </div>
          <div className="lp-why-visual">
            <div className="lp-why-card lp-why-card-main">
              <div className="lp-wc-label">Total Revenue</div>
              <div className="lp-wc-val">₹12,48,500</div>
              <div className="lp-wc-bar-row">
                {[40,60,50,90,70,85,55,95].map((h, i) => (
                  <div key={i} className="lp-wc-bar" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="lp-wc-growth">↑ 24% this month</div>
            </div>
            <div className="lp-why-card lp-why-card-small lp-why-card-a">
              <div className="lp-ws-icon success"><FiCheckCircle /></div>
              <div>
                <div className="lp-ws-title">Payment Successful</div>
                <div className="lp-ws-sub">₹25,000 — just now</div>
              </div>
            </div>
            <div className="lp-why-card lp-why-card-small lp-why-card-b">
              <div className="lp-ws-icon blue"><FiBell /></div>
              <div>
                <div className="lp-ws-title">Webhook Delivered</div>
                <div className="lp-ws-sub">Instant callback sent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="lp-testimonials">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">TESTIMONIALS</p>
            <h2 className="lp-section-title">Loved by merchants across India</h2>
            <p className="lp-section-sub">Join thousands of businesses who trust Zetto Pay every day.</p>
          </div>
          <div className="lp-testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testi-card">
                <div className="lp-testi-stars">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <FiStar key={s} className="lp-star-icon" />
                  ))}
                </div>
                <p className="lp-testi-text">"{t.text}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-avatar">{t.name[0]}</div>
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Teaser ── */}
      <section className="lp-pricing-teaser">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">PRICING</p>
            <h2 className="lp-section-title">Simple, transparent pricing</h2>
            <p className="lp-section-sub">No hidden charges. No monthly minimums. Pay only for successful transactions.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-pricing-card">
              <div className="lp-pricing-badge">Most Popular</div>
              <h3>Payin Gateway</h3>
              <div className="lp-pricing-rate">1.5% <span>per transaction</span></div>
              <ul className="lp-pricing-list">
                <li><FiCheckCircle /> UPI, Cards, Net Banking</li>
                <li><FiCheckCircle /> Real-time webhooks</li>
                <li><FiCheckCircle /> Instant payment links</li>
                <li><FiCheckCircle /> Settlement in T+1 days</li>
              </ul>
              <Link to="/signup" className="lp-btn-primary" style={{width:'100%', justifyContent:'center'}}>Get Started <FiArrowRight /></Link>
            </div>
            <div className="lp-pricing-card">
              <h3>Smart Payouts</h3>
              <div className="lp-pricing-rate">₹5 <span>per transaction</span></div>
              <ul className="lp-pricing-list">
                <li><FiCheckCircle /> IMPS, NEFT, UPI payouts</li>
                <li><FiCheckCircle /> Bulk payout support</li>
                <li><FiCheckCircle /> API-driven automation</li>
                <li><FiCheckCircle /> Real-time status updates</li>
              </ul>
              <Link to="/signup" className="lp-btn-outline" style={{width:'100%', justifyContent:'center'}}>Get Started <FiArrowRight /></Link>
            </div>
            <div className="lp-pricing-card">
              <h3>Enterprise</h3>
              <div className="lp-pricing-rate">Custom <span>pricing</span></div>
              <ul className="lp-pricing-list">
                <li><FiCheckCircle /> Volume discounts</li>
                <li><FiCheckCircle /> Dedicated support manager</li>
                <li><FiCheckCircle /> Custom SLAs & uptime</li>
                <li><FiCheckCircle /> White-label options</li>
              </ul>
              <a href="mailto:sales@zetto.in" className="lp-btn-outline" style={{width:'100%', justifyContent:'center', display:'flex'}}>Contact Sales <FiArrowRight /></a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq" id="faq">
        <div className="lp-section-inner">
          <div className="lp-section-head">
            <p className="lp-section-kicker">FAQ</p>
            <h2 className="lp-section-title">Frequently asked questions</h2>
            <p className="lp-section-sub">Everything you need to know about Zetto Pay.</p>
          </div>
          <div className="lp-faq-list">
            {FAQS.map((f, i) => (
              <div key={i} className={`lp-faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  <FiChevronDown className="lp-faq-chevron" />
                </button>
                <div className="lp-faq-a">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="lp-cta-banner">
        <div className="lp-cta-inner">
          <div className="lp-cta-icon-row">
            <FiGlobe className="lp-cta-icon" />
          </div>
          <h2>Ready to start accepting payments?</h2>
          <p>Join thousands of merchants who trust Zetto Pay to power their business. No setup fee, no monthly charges.</p>
          <div className="lp-cta-actions">
            <Link to="/signup" className="lp-btn-white">
              Create Free Account <FiArrowRight />
            </Link>
            <Link to="/login" className="lp-btn-ghost-white">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-brand">
              <div className="lp-brand-icon sm">Z</div>
              <span className="lp-brand-name">Zetto<span className="lp-brand-dot">Pay</span></span>
            </div>
            <p>Next-generation payment infrastructure for India's growing businesses. Fast, secure, and developer-first.</p>
            <div className="lp-footer-contact">
              <a href="mailto:support@zetto.in">support@zetto.in</a>
            </div>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#industries">Industries</a>
            <Link to="/login">Merchant Login</Link>
          </div>
          <div className="lp-footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/signup">Create Account</Link>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Refund Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="lp-footer-col">
            <h4>Support</h4>
            <a href="mailto:support@zetto.in">Contact Us</a>
            <a href="#">Documentation</a>
            <a href="#">API Reference</a>
            <a href="#">Status Page</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Zetto Pay. All rights reserved.</p>
          <div className="lp-footer-legal">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
