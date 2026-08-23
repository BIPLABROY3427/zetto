import { useState } from 'react';
import { FiBox, FiCheck, FiCode, FiCopy } from 'react-icons/fi';
import { useAuth } from '../../../../context/AuthContext';
import './ApiDocumentation.css';

const API_BASE = import.meta.env.VITE_SERVER || 'http://localhost:5872';

const payinSnippets = {
  JSON: `{
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}`,
  PHP: `<?php
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => '${API_BASE}/api/v1/gateway/payment',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}',
  CURLOPT_HTTPHEADER => array(
    'x-api-key: YOUR_API_KEY_HERE',
    'Content-Type: application/json'
  ),
));
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
  'Node.js': `const axios = require('axios');
let data = JSON.stringify({
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
});

let config = {
  method: 'post',
  url: '${API_BASE}/api/v1/gateway/payment',
  headers: {
    'x-api-key': 'YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  },
  data : data
};

axios.request(config)
.then((response) => console.log(JSON.stringify(response.data)))
.catch((error) => console.log(error));`,
  Python: `import requests
import json

url = "${API_BASE}/api/v1/gateway/payment"
payload = json.dumps({
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
})
headers = {
  'x-api-key': 'YOUR_API_KEY_HERE',
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)
print(response.text)`,
  Go: `package main

import (
  "fmt"
  "strings"
  "net/http"
  "io"
)

func main() {
  url := "${API_BASE}/api/v1/gateway/payment"
  method := "POST"
  payload := strings.NewReader("{\\"amount\\": 500, \\"description\\": \\"Order #12345\\", \\"customerDetails\\": { \\"name\\": \\"John Doe\\", \\"email\\": \\"john@example.com\\", \\"phone\\": \\"9876543210\\" } }")

  client := &http.Client { }
  req, err := http.NewRequest(method, url, payload)
  if err != nil { fmt.Println(err); return }

  req.Header.Add("x-api-key", "YOUR_API_KEY_HERE")
  req.Header.Add("Content-Type", "application/json")

  res, err := client.Do(req)
  if err != nil { fmt.Println(err); return }
  defer res.Body.Close()
  body, err := io.ReadAll(res.Body)
  if err != nil { fmt.Println(err); return }
  fmt.Println(string(body))
}`
};

const payoutSnippets = {
  JSON: `{
  "amount": 1000,
  "description": "Vendor Payout",
  "bankDetails": {
    "accountNumber": "000000123456789",
    "ifscCode": "SBIN0001234",
    "accountName": "Vendor Name",
    "mobile": "9876543210"
  }
}`,
  PHP: `<?php
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => '${API_BASE}/api/v1/gateway/payout',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
  "amount": 1000,
  "description": "Vendor Payout",
  "bankDetails": {
    "accountNumber": "000000123456789",
    "ifscCode": "SBIN0001234",
    "accountName": "Vendor Name",
    "mobile": "9876543210"
  }
}',
  CURLOPT_HTTPHEADER => array(
    'x-api-key: YOUR_API_KEY_HERE',
    'Content-Type: application/json'
  ),
));
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
  'Node.js': `const axios = require('axios');
let data = JSON.stringify({
  "amount": 1000,
  "description": "Vendor Payout",
  "bankDetails": {
    "accountNumber": "000000123456789",
    "ifscCode": "SBIN0001234",
    "accountName": "Vendor Name",
    "mobile": "9876543210"
  }
});

let config = {
  method: 'post',
  url: '${API_BASE}/api/v1/gateway/payout',
  headers: {
    'x-api-key': 'YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  },
  data : data
};

axios.request(config)
.then((response) => console.log(JSON.stringify(response.data)))
.catch((error) => console.log(error));`,
  Python: `import requests
import json

url = "${API_BASE}/api/v1/gateway/payout"
payload = json.dumps({
  "amount": 1000,
  "description": "Vendor Payout",
  "bankDetails": {
    "accountNumber": "000000123456789",
    "ifscCode": "SBIN0001234",
    "accountName": "Vendor Name",
    "mobile": "9876543210"
  }
})
headers = {
  'x-api-key': 'YOUR_API_KEY_HERE',
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)
print(response.text)`
};

const webhookSnippets = {
  PHP: `<?php
// 1. Get your Webhook Secret from Zetto Dashboard -> Basic Settings
$mySecret = "YOUR_WEBHOOK_SECRET_HERE";

// 2. Read the JSON payload
$data = json_decode(file_get_contents('php://input'), true);

// 3. Verify the secret directly
if (isset($data['secret']) && $data['secret'] === $mySecret) {
    // SUCCESS: The webhook is genuine!
    $orderNo = $data['transactionId'];
    $status = $data['status']; // "completed" or "failed"

    if ($status === 'completed') {
        // TODO: Update your database, mark user order as Paid!
    }

    // Always return HTTP 200 OK so we know you received it
    http_response_code(200);
    echo "Webhook Processed";
} else {
    // FAILED: Fake webhook or wrong secret!
    http_response_code(400);
    echo "Invalid Secret";
}
?>`,
  'Node.js': `const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const { transactionId, status, secret } = req.body;
  const mySecret = 'YOUR_WEBHOOK_SECRET_HERE';

  if (secret !== mySecret) {
    return res.status(400).send('Invalid Secret');
  }

  // Webhook is genuine, process order...
  if (status === 'completed') {
      // Update Database
  }

  res.status(200).send('OK');
});

app.listen(3000, () => console.log('Listening on port 3000'));`,
  Python: `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    my_secret = 'YOUR_WEBHOOK_SECRET_HERE'

    if data.get('secret') != my_secret:
        return "Invalid Secret", 400

    status = data.get('status')
    if status == 'completed':
        # Update database
        pass

    return "OK", 200

if __name__ == '__main__':
    app.run(port=3000)`
};

const balanceSnippets = {
  PHP: `<?php
$curl = curl_init();
curl_setopt_array($curl, array(
  CURLOPT_URL => '${API_BASE}/api/v1/gateway/balance',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'x-api-key: YOUR_API_KEY_HERE'
  ),
));
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`,
  'Node.js': `const axios = require('axios');

let config = {
  method: 'get',
  url: '${API_BASE}/api/v1/gateway/balance',
  headers: {
    'x-api-key': 'YOUR_API_KEY_HERE'
  }
};

axios.request(config)
.then((response) => console.log(JSON.stringify(response.data)))
.catch((error) => console.log(error));`,
  Python: `import requests

url = "${API_BASE}/api/v1/gateway/balance"
headers = {
  'x-api-key': 'YOUR_API_KEY_HERE'
}

response = requests.request("GET", url, headers=headers)
print(response.text)`
};

const ApiDocumentation = () => {
  const [copiedText, setCopiedText] = useState(null);
  const [activeTab, setActiveTab] = useState('auth');
  const { user } = useAuth();
  const merchantApiKey = 'YOUR_API_KEY_HERE';

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const MultiLangCodeBlock = ({ snippets, id }) => {
    const [activeLang, setActiveLang] = useState(Object.keys(snippets)[0]);
    const code = snippets[activeLang];
    const uniqueId = `${id}-${activeLang}`;

    return (
      <div className="code-block-wrapper" style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
        <div className="code-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '8px 12px' }}>
          <div className="lang-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {Object.keys(snippets).map(lang => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                style={{
                  background: activeLang === lang ? '#334155' : 'transparent',
                  color: activeLang === lang ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
              >
                {lang}
              </button>
            ))}
          </div>
          <button className="copy-btn" onClick={() => handleCopy(code, uniqueId)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            {copiedText === uniqueId ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy</>}
          </button>
        </div>
        <pre className="code-block" style={{ margin: 0, padding: '16px', background: '#0f172a', color: '#e2e8f0', fontSize: '13px', overflowX: 'auto', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <code style={{ fontFamily: 'monospace' }}>{code}</code>
        </pre>
      </div>
    );
  };

  return (
    <div className="api-docs-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2><FiCode style={{ marginRight: '8px' }} /> API Documentation</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Integrate Zetto.in into your application with our powerful REST APIs.</p>
      </div>

      <div className="api-tabs">
        <button className={`api-tab-btn ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>Authentication</button>
        <button className={`api-tab-btn ${activeTab === 'payin' ? 'active' : ''}`} onClick={() => setActiveTab('payin')}>Payin API</button>
        <button className={`api-tab-btn ${activeTab === 'payout' ? 'active' : ''}`} onClick={() => setActiveTab('payout')}>Payout API</button>
        <button className={`api-tab-btn ${activeTab === 'query' ? 'active' : ''}`} onClick={() => setActiveTab('query')}>Query Order</button>
        <button className={`api-tab-btn ${activeTab === 'balance' ? 'active' : ''}`} onClick={() => setActiveTab('balance')}>Balance Check</button>
        <button className={`api-tab-btn ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>Tools & Utils</button>
        <button className={`api-tab-btn ${activeTab === 'webhooks' ? 'active' : ''}`} onClick={() => setActiveTab('webhooks')}>Webhooks</button>
      </div>

      {activeTab === 'auth' && (
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
      )}

      {activeTab === 'payin' && (
        <div className="api-card mb-6">
          <div className="api-card-header">
            <span className="badge-post">POST</span>
            <h3>Create Payin Intent</h3>
          </div>
          <div className="api-card-body">
            <p>Generate a payment link for your customer to pay you via UPI or other supported methods.</p>

            <div className="endpoint-url">
              <span className="method">POST</span>
              <span className="url">{API_BASE}/api/v1/gateway/payment</span>
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

            <h4 className="section-title mt-4">Code Examples</h4>
            <MultiLangCodeBlock id="payin-req" snippets={payinSnippets} />

            <h4 className="section-title mt-4">Success Response</h4>
            <MultiLangCodeBlock id="payin-res" snippets={{
              JSON: `{
  "success": true,
  "message": "Payment intent created",
  "paymentUrl": "https://pay.zetto.in/checkout?token=abcxyz123",
  "transactionId": "PAY_1715423000_xxxxx"
}`}} />
          </div>
        </div>
      )}

      {activeTab === 'payout' && (
        <div className="api-card mb-6">
          <div className="api-card-header">
            <span className="badge-post">POST</span>
            <h3>Create Payout (Withdrawal)</h3>
          </div>
          <div className="api-card-body">
            <p>Withdraw funds from your wallet directly to a bank account.</p>

            <div className="endpoint-url">
              <span className="method">POST</span>
              <span className="url">{API_BASE}/api/v1/gateway/payout</span>
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
                  <td>Contains <code>accountNumber</code>, <code>ifscCode</code>, <code>accountName</code>, and <code>mobile</code> (optional).</td>
                </tr>
                <tr>
                  <td><code>description</code></td>
                  <td>String</td>
                  <td>No</td>
                  <td>Reason for payout.</td>
                </tr>
              </tbody>
            </table>

            <h4 className="section-title mt-4">Code Examples</h4>
            <MultiLangCodeBlock id="payout-req" snippets={payoutSnippets} />

            <h4 className="section-title mt-4">Success Response</h4>
            <MultiLangCodeBlock id="payout-res" snippets={{
              JSON: `{
  "success": true,
  "message": "Payout initiated successfully",
  "transactionId": "POUT_1715423000_xxxxx"
}`}} />
          </div>
        </div>
      )}

      {activeTab === 'query' && (
        <>
          {/* Query Payin */}
          <div className="api-card mb-6">
            <div className="api-card-header">
              <span className="badge-post" style={{ background: '#3b82f6' }}>GET</span>
              <h3>Query Pay-In Order</h3>
            </div>
            <div className="api-card-body">
              <p>Check the current status of a Pay-In transaction.</p>

              <div className="endpoint-url">
                <span className="method" style={{ background: '#3b82f6' }}>GET</span>
                <span className="url">{API_BASE}/api/v1/gateway/payin/query?orderNo=YOUR_ORDER_NO</span>
              </div>

              <h4 className="section-title mt-4">Success Response</h4>
              <MultiLangCodeBlock id="query-payin-res" snippets={{
                JSON: `{
  "success": true,
  "status": "completed",
  "amount": 500
}`}} />
            </div>
          </div>

          {/* Query Payout */}
          <div className="api-card mb-6">
            <div className="api-card-header">
              <span className="badge-post" style={{ background: '#3b82f6' }}>GET</span>
              <h3>Query Pay-Out Order</h3>
            </div>
            <div className="api-card-body">
              <p>Check the current status of a Pay-Out (Withdrawal) transaction.</p>

              <div className="endpoint-url">
                <span className="method" style={{ background: '#3b82f6' }}>GET</span>
                <span className="url">{API_BASE}/api/v1/gateway/payout/query?orderNo=YOUR_ORDER_NO</span>
              </div>

              <h4 className="section-title mt-4">Success Response</h4>
              <MultiLangCodeBlock id="query-payout-res" snippets={{
                JSON: `{
  "success": true,
  "status": "pending",
  "amount": 1000
}`}} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'balance' && (
        <div className="api-card mb-6">
          <div className="api-card-header">
            <span className="badge-post" style={{ background: '#3b82f6' }}>GET</span>
            <h3>Check Wallet Balance</h3>
          </div>
          <div className="api-card-body">
            <p>Retrieve your current wallet balance to ensure sufficient funds before initiating a payout.</p>

            <div className="endpoint-url">
              <span className="method" style={{ background: '#3b82f6' }}>GET</span>
              <span className="url">{API_BASE}/api/v1/gateway/balance</span>
            </div>

            <h4 className="section-title mt-4">Code Examples</h4>
            <MultiLangCodeBlock id="balance-req" snippets={balanceSnippets} />

            <h4 className="section-title mt-4">Success Response</h4>
            <MultiLangCodeBlock id="balance-res" snippets={{
              JSON: `{
  "success": true,
  "balance": 15050.00
}`}} />
          </div>
        </div>
      )}

      {activeTab === 'tools' && (
        <>
          {/* UTR Check */}
          <div className="api-card mb-6">
            <div className="api-card-header">
              <span className="badge-post">POST</span>
              <h3>Check UTR Validity</h3>
            </div>
            <div className="api-card-body">
              <p>Verify if a given UTR (Unique Transaction Reference) is valid and recognized by the gateway.</p>

              <div className="endpoint-url">
                <span className="method">POST</span>
                <span className="url">{API_BASE}/api/v1/gateway/utrcheck</span>
              </div>

              <h4 className="section-title mt-4">Request Body</h4>
              <MultiLangCodeBlock id="utr-req" snippets={{
                JSON: `{
  "utr": "YOUR_12_DIGIT_UTR"
}`}} />
            </div>
          </div>

          {/* UPI Check */}
          <div className="api-card mb-6">
            <div className="api-card-header">
              <span className="badge-post">POST</span>
              <h3>Check UPI Validity</h3>
            </div>
            <div className="api-card-body">
              <p>Verify if a given UPI ID is valid.</p>

              <div className="endpoint-url">
                <span className="method">POST</span>
                <span className="url">{API_BASE}/api/v1/gateway/upicheck</span>
              </div>

              <h4 className="section-title mt-4">Request Body</h4>
              <MultiLangCodeBlock id="upi-req" snippets={{
                JSON: `{
  "upi": "example@okbank"
}`}} />
            </div>
          </div>
          
          {/* Force Bind */}
          <div className="api-card mb-6">
            <div className="api-card-header">
              <span className="badge-post">POST</span>
              <h3>Force Bind UTR</h3>
            </div>
            <div className="api-card-body">
              <p>Force bind a UTR to an existing Pay-In order manually.</p>

              <div className="endpoint-url">
                <span className="method">POST</span>
                <span className="url">{API_BASE}/api/v1/gateway/payin/bind</span>
              </div>

              <h4 className="section-title mt-4">Request Body</h4>
              <MultiLangCodeBlock id="bind-req" snippets={{
                JSON: `{
  "orderNo": "YOUR_ORDER_NO",
  "utr": "YOUR_12_DIGIT_UTR",
  "amount": 500
}`}} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'webhooks' && (
        <div className="api-card mb-6">
          <div className="api-card-header" style={{ background: '#f8fafc' }}>
            <h3><FiBox style={{ marginRight: '8px' }} /> Webhooks (Callbacks)</h3>
          </div>
          <div className="api-card-body">
            <p>Once a Payin or Payout transaction is completed or failed, our system will send an HTTP POST request to your pre-configured Callback URL.</p>

            <h4 className="section-title mt-4">Webhook Payload Format</h4>
            <MultiLangCodeBlock id="webhook-req" snippets={{
              JSON: `{
  "transactionId": "PAY_1715423000_xxxxx",
  "amount": 500,
  "status": "completed", // or "failed"
  "type": "payment",
  "secret": "YOUR_WEBHOOK_SECRET_HERE",
  "timestamp": "2026-08-21T10:00:00Z"
}`}} />

            <h4 className="section-title mt-4">Security (Simple Secret Verification)</h4>
            <p>
              To verify the webhook originated from us, we inject your <strong>Webhook Secret</strong> directly into the JSON payload as the <code>secret</code> key.
              You simply need to check if it matches the secret shown in your Zetto Dashboard.
            </p>

            <h4 className="section-title mt-4">Code Examples (Verification)</h4>
            <MultiLangCodeBlock id="webhook-verify" snippets={webhookSnippets} />
          </div>
        </div>
      )}

    </div>
  );
};

export default ApiDocumentation;
