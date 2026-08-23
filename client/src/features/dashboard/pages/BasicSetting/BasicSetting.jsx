import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiCopy,
  FiEdit3,
  FiGlobe,
  FiKey,
  FiRefreshCw,
  FiSave,
  FiShield,
  FiZap,
  FiCode,
  FiArrowRight
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../../../components/ui/ConfirmDialog/ConfirmDialog';
import useConfirm from '../../../../components/ui/ConfirmDialog/useConfirm';
import api from '../../../../services/apiClient';
import './BasicSetting.css';

const BasicSetting = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payInUrl, setPayInUrl] = useState('');
  const [payOutUrl, setPayOutUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { confirm, confirmProps } = useConfirm();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/dashboard/stats');
      if (data.settings) {
        setPayInUrl(data.settings.callbackUrl || '');
        setPayOutUrl(data.settings.callbackUrl || '');
        setApiKey(data.settings.activeApiKey || '');
      }
    } catch {
      toast.error('Failed to load developer settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleResetApiKey = async () => {
    const ok = await confirm({
      title: 'Reset API Key?',
      message: 'This will immediately invalidate your current API key. Any active integrations using the old key will stop working.',
      confirmText: 'Yes, Reset Key',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      setResetting(true);
      await api.post('/dashboard/settings/apikey/reset');
      toast.success('API Key reset successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to reset API key');
    } finally {
      setResetting(false);
    }
  };

  const handleUpdateWebhooks = async () => {
    try {
      setSaving(true);
      await api.put('/dashboard/settings/webhooks', { callbackUrl: payInUrl });
      toast.success('Webhook URLs updated successfully');
    } catch {
      toast.error('Failed to update webhooks');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey
    ? apiKey.slice(0, 8) + '•'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.slice(-4)
    : '•'.repeat(36);

  if (loading) {
    return (
      <div className="bs-root">
        <div className="bs-loading-state">
          <FiRefreshCw className="bs-spinner" />
          <span>Loading Settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bs-root">
      <ConfirmDialog {...confirmProps} />

      {/* ─── Header ─── */}
      <div className="bs-header">
        <div className="bs-header-left">
          <div className="bs-header-icon-wrap">
            <FiZap className="bs-header-icon" />
          </div>
          <div>
            <h2 className="bs-title">Developer Settings</h2>
            <p className="bs-subtitle">Manage API keys, webhooks and integration settings</p>
          </div>
        </div>
        <div className="bs-status-pill">
          <span className="bs-status-dot"></span>
          API Active
        </div>
      </div>

      {/* ─── Main Grid ─── */}
      <div className="bs-grid">

        {/* ─── API Key Card ─── */}
        <div className="bs-card bs-card-api">
          <div className="bs-card-glow bs-card-glow-blue"></div>

          <div className="bs-card-top">
            <div className="bs-card-icon-wrap bs-icon-blue">
              <FiKey />
            </div>
            <div>
              <h3 className="bs-card-title">API Key</h3>
              <p className="bs-card-desc">Authenticate your server-side requests to Zetto API</p>
            </div>
          </div>

          {/* Key Display */}
          <div className="bs-key-display">
            <div className="bs-key-header">
              <div className="bs-key-badge">
                <FiShield size={11} /> LIVE SECRET KEY
              </div>
              <button className="bs-key-toggle" onClick={() => setShowKey(s => !s)}>
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
            <div className="bs-key-body">
              <code className="bs-key-value">
                {showKey ? (apiKey || 'No active key') : maskedKey}
              </code>
              <button
                className={`bs-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyKey}
                disabled={!apiKey}
              >
                {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Quick tip */}
          <div className="bs-tip">
            <FiActivity size={13} />
            Use this key in your <code>x-api-key: &lt;key&gt;</code> header
          </div>

          {/* Reset */}
          <div className="bs-key-footer">
            <button
              className="bs-danger-btn"
              onClick={handleResetApiKey}
              disabled={resetting}
            >
              {resetting
                ? <><FiRefreshCw className="bs-spinner-sm" /> Resetting…</>
                : <><FiAlertTriangle size={14} /> Rotate Key</>
              }
            </button>
            <span className="bs-danger-note">Rotating will invalidate the current key immediately</span>
          </div>
        </div>

        {/* ─── Webhooks Card ─── */}
        <div className="bs-card bs-card-webhook">
          <div className="bs-card-glow bs-card-glow-purple"></div>

          <div className="bs-card-top">
            <div className="bs-card-icon-wrap bs-icon-purple">
              <FiGlobe />
            </div>
            <div>
              <h3 className="bs-card-title">Webhook Endpoints</h3>
              <p className="bs-card-desc">Receive real-time transaction status notifications</p>
            </div>
          </div>

          <div className="bs-form">
            <div className="bs-form-field">
              <label className="bs-label">
                <span className="bs-label-dot bs-dot-green"></span>
                PayIn Callback URL
              </label>
              <div className="bs-input-wrap">
                <FiGlobe className="bs-input-icon" />
                <input
                  type="url"
                  className="bs-input"
                  placeholder="https://yourdomain.com/payin-callback"
                  value={payInUrl}
                  onChange={e => setPayInUrl(e.target.value)}
                />
                {payInUrl && <FiCheckCircle className="bs-input-valid" />}
              </div>
            </div>

            <div className="bs-form-field">
              <label className="bs-label">
                <span className="bs-label-dot bs-dot-orange"></span>
                PayOut Callback URL
              </label>
              <div className="bs-input-wrap">
                <FiGlobe className="bs-input-icon" />
                <input
                  type="url"
                  className="bs-input"
                  placeholder="https://yourdomain.com/payout-callback"
                  value={payOutUrl}
                  onChange={e => setPayOutUrl(e.target.value)}
                />
                {payOutUrl && <FiCheckCircle className="bs-input-valid" />}
              </div>
            </div>

            {/* Events list */}
            <div className="bs-events">
              <p className="bs-events-title"><FiEdit3 size={12} /> Events you'll receive</p>
              <div className="bs-events-list">
                {['payment.success', 'payment.failed', 'payout.success', 'payout.failed'].map(e => (
                  <span key={e} className="bs-event-chip">{e}</span>
                ))}
              </div>
            </div>

            <button
              className="bs-save-btn"
              onClick={handleUpdateWebhooks}
              disabled={saving}
            >
              {saving
                ? <><FiRefreshCw className="bs-spinner-sm" /> Saving…</>
                : <><FiSave size={15} /> Save Endpoints</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ─── Security Notice ─── */}
      <div className="bs-notice">
        <FiShield className="bs-notice-icon" />
        <div>
          <strong>Keep your API key secret.</strong> Never expose it in client-side code, version control, or public repositories. All requests are logged and monitored.
        </div>
      </div>
      {/* ─── API Quick Reference ─── */}
      <div className="bs-api-ref">
        <div className="bs-api-ref-header">
          <div className="bs-api-ref-title">
            <FiCode size={15} /> API Quick Reference
          </div>
          <span className="bs-api-ref-base">Base URL: <code>https://yourdomain.com/api/v1/gateway</code></span>
        </div>

        <div className="bs-api-ref-auth">
          <span className="bs-api-ref-auth-label"><FiKey size={12} /> Required Header</span>
          <code className="bs-api-ref-auth-code">x-api-key: YOUR_API_KEY</code>
        </div>

        <div className="bs-api-endpoints">
          {[
            { method: 'POST', path: '/payment', desc: 'Create Pay-In order', body: '{ amount, customerDetails, description }' },
            { method: 'POST', path: '/payout', desc: 'Initiate Pay-Out', body: '{ amount, bankDetails, description }' },
            { method: 'GET',  path: '/payin/query?orderNo=', desc: 'Query Pay-In status', body: null },
            { method: 'GET',  path: '/payout/query?orderNo=', desc: 'Query Pay-Out status', body: null },
            { method: 'POST', path: '/payin/querybatch', desc: 'Batch Query Pay-In (comma separated)', body: '{ orders }' },
            { method: 'POST', path: '/payin/bind', desc: 'Force-bind UTR to Pay-In', body: '{ orderNo, utr, amount }' },
            { method: 'GET',  path: '/balance', desc: 'Get wallet balance', body: null },
            { method: 'POST', path: '/utrcheck', desc: 'Verify UTR number', body: '{ utr }' },
            { method: 'POST', path: '/upicheck', desc: 'Verify UPI ID', body: '{ upi }' },
          ].map(ep => (
            <div key={ep.path} className="bs-api-row">
              <span className={`bs-method bs-method-${ep.method.toLowerCase()}`}>{ep.method}</span>
              <code className="bs-ep-path">{ep.path}</code>
              <span className="bs-ep-desc">{ep.desc}</span>
              {ep.body && <code className="bs-ep-body">{ep.body}</code>}
            </div>
          ))}
        </div>

        <div className="bs-webhook-schema">
          <p className="bs-events-title"><FiActivity size={12} /> Webhook Payload (POST to your callback URL)</p>
          <pre className="bs-code-block">{`{
  "transactionId": "PAY_...",
  "status": "completed" | "failed",
  "amount": 1000,
  "type": "payment" | "withdrawal",
  "timestamp": "2024-01-01T00:00:00.000Z"
}`}</pre>
        </div>
      </div>
    </div>
  );
};

export default BasicSetting;
