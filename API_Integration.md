# Zetto Payment Gateway - API Integration Guide

This document explains how to integrate the Zetto Payment Gateway (Payin & Payout) into your other projects. 

## Base URL & Authentication

**Base URL:** `https://api.zetto.in/api/v1/gateway`

All requests to the merchant API require authentication via an API Key.

**Header:**
```http
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

---

## 1. Create Payment Intent (Pay-In)

Use this endpoint to generate a payment link for a user to pay you.

- **Endpoint:** `POST /payment`
- **Headers:** `x-api-key`

**Request Body:**
```json
{
  "amount": 500,
  "description": "Order #12345",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```
*(Note: Minimum amount is 200 INR. `customerDetails` is optional but recommended).*

**Success Response:**
```json
{
  "success": true,
  "message": "Payment intent created",
  "paymentUrl": "https://gateway.url/pay/...",
  "transactionId": "PAY_1694212345678_abcd1"
}
```
*(Redirect the user to `paymentUrl` to complete the payment).*

---

## 2. Create Payout Intent (Withdrawal / Transfer)

Use this endpoint to transfer money from your Zetto wallet to a bank account.

- **Endpoint:** `POST /payout`
- **Headers:** `x-api-key`

**Request Body:**
```json
{
  "amount": 1000,
  "description": "Vendor Payout #99",
  "bankDetails": {
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234"
  }
}
```
*(Note: Minimum withdrawal is 100 INR. Ensure sufficient balance including commission).*

**Success Response:**
```json
{
  "success": true,
  "message": "Payout initiated successfully",
  "transactionId": "POUT_1694212345678_xyz98"
}
```

---

## 3. Query Order Status

You can explicitly check the status of any Payin or Payout transaction.

### Query Payin
- **Endpoint:** `GET /payin/query?orderNo={transactionId}`
- **Headers:** `x-api-key`

### Query Payout
- **Endpoint:** `GET /payout/query?orderNo={transactionId}`
- **Headers:** `x-api-key`

**Response Format:**
```json
{
  "success": true,
  "status": "completed", 
  "amount": 500
}
```
*(Possible statuses: `pending`, `completed`, `failed`, `refunded`, `queued`)*

---

## 4. Check Wallet Balance

- **Endpoint:** `GET /balance`
- **Headers:** `x-api-key`

**Response:**
```json
{
  "success": true,
  "balance": 15000.50,
  "currency": "INR"
}
```

---

## 5. Webhooks (Callbacks)

When a transaction (Payin or Payout) reaches a final state (`completed` or `failed`), Zetto Pay will send a `POST` request to the `callbackUrl` configured in your Merchant Dashboard.

**Webhook Payload Example:**
```json
{
  "transactionId": "PAY_1694212345678_abcd1",
  "status": "completed",
  "amount": 500,
  "type": "payment",
  "timestamp": "2023-09-08T12:34:56.789Z"
}
```
*(Note: `type` can be `"payment"` for payins or `"withdrawal"` for payouts).*

**Important:** Your webhook receiver endpoint must respond with a `200 OK` HTTP status to acknowledge receipt. If it fails, Zetto Pay will retry up to 3 times automatically.
