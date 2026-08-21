import React, { useState } from 'react';
import './ApiDocumentation.css';
import { FiCopy, FiCheck, FiCode, FiBox } from 'react-icons/fi';
import { useAuth } from '../../../../context/AuthContext';

const ApiDocumentation = () => {
  const [copiedText, setCopiedText] = useState(null);
  const { user } = useAuth();
  const merchantApiKey = 'YOUR_API_KEY_HERE'; // In a real app, fetch from user data

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const CodeBlock = ({ code, id }) => (
    <div className="code-block-wrapper">
      <div className="code-header">
        <span className="code-lang">JSON</span>
        <button className="copy-btn" onClick={() => handleCopy(code, id)}>
          {copiedText === id ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy</>}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="api-docs-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2><FiCode style={{ marginRight: '8px' }} /> API Documentation</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Integrate Zetto.in into your application with our powerful REST APIs.</p>
      </div>

      <div className="api-card mb-6">
        <div className="api-card-header">
          <h3>Authentication</h3>
        </div>
        <div className="api-card-body">
          <p>All API requests must be authenticated using your unique API Key. Pass the API Key in the headers of your HTTP request.</p>
          <div className="auth-header-example">
            <code>x-api-key: {merchantApiKey}</code>
          </div>
          <p className="text-warning mt-3" style={{ fontSize: '13px', color: '#eab308' }}>
            <strong>Warning:</strong> Keep your API key secret! Do not expose it in client-side code (like frontend apps).
          </p>
        </div>
      </div>

      {/* PAYIN API */}
      <div className="api-card mb-6">
        <div className="api-card-header">
          <span className="badge-post">POST</span>
          <h3>Create Payin Intent</h3>
        </div>
        <div className="api-card-body">
          <p>Generate a payment link for your customer to pay you via UPI or other supported methods.</p>
          
          <div className="endpoint-url">
            <span className="method">POST</span>
            <span className="url">https://api.zetto.in/api/v1/gateway/payment</span>
          </div>

          <h4 className="section-title">Request Body</h4>
          <table className="params-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>amount</code></td>
                <td>Number</td>
                <td><span className="badge-required">Yes</span></td>
                <td>The transaction amount in INR (Min: 200).</td>
              </tr>
              <tr>
                <td><code>description</code></td>
                <td>String</td>
                <td>No</td>
                <td>A short description of the payment.</td>
              </tr>
              <tr>
                <td><code>customerDetails</code></td>
                <td>Object</td>
                <td>No</td>
                <td>Customer information (e.g. <code>{"{ name: 'John', email: 'john@example.com' }"}</code>).</td>
              </tr>
            </tbody>
          </table>

          <h4 className="section-title mt-4">Example Request</h4>
          <CodeBlock id="payin-req" code={`{
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}`} />

          <h4 className="section-title mt-4">Success Response</h4>
          <CodeBlock id="payin-res" code={`{
  "success": true,
  "message": "Payment intent created",
  "paymentUrl": "https://pay.aeropay.in/checkout?token=abcxyz123",
  "transactionId": "PAY_1715423000_xxxxx"
}`} />
        </div>
      </div>

      {/* PAYOUT API */}
      <div className="api-card mb-6">
        <div className="api-card-header">
          <span className="badge-post">POST</span>
          <h3>Create Payout (Withdrawal)</h3>
        </div>
        <div className="api-card-body">
          <p>Withdraw funds from your wallet directly to a bank account.</p>
          
          <div className="endpoint-url">
            <span className="method">POST</span>
            <span className="url">https://api.zetto.in/api/v1/gateway/payout</span>
          </div>

          <h4 className="section-title">Request Body</h4>
          <table className="params-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>amount</code></td>
                <td>Number</td>
                <td><span className="badge-required">Yes</span></td>
                <td>The withdrawal amount in INR (Min: 100).</td>
              </tr>
              <tr>
                <td><code>bankDetails</code></td>
                <td>Object</td>
                <td><span className="badge-required">Yes</span></td>
                <td>Contains <code>accountNumber</code>, <code>ifscCode</code>, <code>accountName</code>.</td>
              </tr>
              <tr>
                <td><code>description</code></td>
                <td>String</td>
                <td>No</td>
                <td>Reason for payout.</td>
              </tr>
            </tbody>
          </table>

          <h4 className="section-title mt-4">Example Request</h4>
          <CodeBlock id="payout-req" code={`{
  "amount": 1000,
  "description": "Vendor Payout",
  "bankDetails": {
    "accountNumber": "000000123456789",
    "ifscCode": "SBIN0001234",
    "accountName": "Vendor Name"
  }
}`} />

          <h4 className="section-title mt-4">Success Response</h4>
          <CodeBlock id="payout-res" code={`{
  "success": true,
  "message": "Payout initiated successfully",
  "transactionId": "POUT_1715423000_xxxxx"
}`} />
        </div>
      </div>

      {/* WEBHOOKS */}
      <div className="api-card mb-6">
        <div className="api-card-header" style={{ background: '#f8fafc' }}>
          <h3><FiBox style={{ marginRight: '8px' }} /> Webhooks (Callbacks)</h3>
        </div>
        <div className="api-card-body">
          <p>Once a Payin or Payout transaction is completed or failed, our system will send an HTTP POST request to your pre-configured Callback URL.</p>
          
          <h4 className="section-title mt-4">Webhook Payload Format</h4>
          <CodeBlock id="webhook-req" code={`{
  "orderNo": "PAY_1715423000_xxxxx",
  "amount": 500,
  "status": "completed", // or "failed"
  "type": "payment",
  "timestamp": "2026-08-21T10:00:00Z"
}`} />

          <h4 className="section-title mt-4">Security (X-Signature)</h4>
          <p>
            To verify the webhook originated from us, we include an <code>X-Signature</code> header.
            This is an HMAC-SHA256 hash of the JSON payload body using your <strong>Webhook Secret</strong>.
          </p>
          
          <CodeBlock id="webhook-verify" code={`// Node.js example to verify signature
const crypto = require('crypto');

function verifyWebhook(payload, signatureHeader, webhookSecret) {
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
    
  return hash === signatureHeader;
}`} />
        </div>
      </div>

    </div>
  );
};

export default ApiDocumentation;
