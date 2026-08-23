import crypto from 'crypto';
import axios from 'axios';
import WebhookLog from '../models/WebhookLog.mjs';

const MAX_RETRIES = 3;


export const dispatchWebhook = async (merchant, order, transactionStatus) => {
  if (!merchant.callbackUrl) {
    console.log(`Webhook skipped: No callbackUrl defined for merchant ${merchant._id}`);
    return;
  }

  // 1. Build Standardized Payload
  const payload = {
    orderId: order.orderId,
    status: transactionStatus, // e.g., 'success' or 'failed'
    amount: order.amount,
    currency: order.currency,
    timestamp: new Date().toISOString()
  };

  const payloadString = JSON.stringify(payload);

  // 2. Generate HMAC Signature if WebhookSecret exists
  let signature = '';
  if (merchant.webhookSecret) {
    signature = crypto
      .createHmac('sha256', merchant.webhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  // 3. Create Audit Log initially 'pending'
  const logEntry = await WebhookLog.create({
    merchantId: merchant._id,
    orderId: order.orderId,
    payload,
    endpoint: merchant.callbackUrl,
    status: 'pending',
    attempts: 0
  });

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Getway-Webhook-Service/1.0',
    ...(signature && { 'x-webhook-signature': signature })
  };

  // 4. Implement Retry Loop Engine
  let attempt = 0;
  let success = false;
  let lastError = null;
  let statusCode = null;

  while (attempt < MAX_RETRIES && !success) {
    attempt++;
    logEntry.attempts = attempt;

    try {
      const response = await axios.post(merchant.callbackUrl, payloadString, {
        headers,
        timeout: 5000 // 5-sec hard timeout per request
      });

      // 2xx response means Merchant successfully consumed the Webhook
      if (response.status >= 200 && response.status < 300) {
        success = true;
        statusCode = response.status;
        logEntry.status = 'success';
        logEntry.responseCode = statusCode;
        console.log(`[Webhook] ✅ Successfully delivered ${order.orderId} to ${merchant.callbackUrl} on attempt ${attempt}`);
      } else {
        statusCode = response.status;
        lastError = `Unexpected status code: ${statusCode}`;
      }

    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code outside 2xx
        statusCode = error.response.status;
        lastError = `HTTP ${statusCode} - ${error.response.data ? JSON.stringify(error.response.data) : error.message}`;
      } else if (error.request) {
        // Request made but no response received (timeout, DNS issue)
        lastError = 'No response received from merchant server (Timeout/Network Error)';
      } else {
        lastError = error.message;
      }

      console.error(`[Webhook] ⚠️ Attempt ${attempt} failed for ${order.orderId}: ${lastError}`);
    }

    // Wait before retrying (Exponential backoff: 2s, 4s, 8s)
    if (!success && attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(res => setTimeout(res, delay));
    }
  }

  // 5. Finalize Log if all retries exhausted
  if (!success) {
    logEntry.status = 'failed';
    logEntry.responseCode = statusCode || 500;
    logEntry.errorLog = lastError;
    console.log(`[Webhook] ❌ Exhausted all ${MAX_RETRIES} retries for ${order.orderId}. Flagged as failed.`);
  }

  await logEntry.save();
};
