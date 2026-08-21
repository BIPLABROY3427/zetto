import { Queue, Worker } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import IORedis from 'ioredis';
import Transaction from '../models/Transaction.mjs';
import Merchant from '../models/Merchant.mjs';
import 'dotenv/config';

// BullMQ requires IORedis connection
const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

export const webhookQueue = new Queue('webhook-queue', { connection });

const worker = new Worker('webhook-queue', async (job) => {
    const { transactionId, merchantId, payload, attempt } = job.data;
    
    // Fetch merchant details to get callback URL and secret
    const merchant = await Merchant.findById(merchantId);
    if (!merchant || !merchant.callbackUrl) {
        throw new Error('Merchant or callback URL not found');
    }

    // Create a signature using the merchant's webhook secret
    const signature = crypto.createHmac('sha256', merchant.webhookSecret || 'default_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

    try {
        const response = await axios.post(merchant.callbackUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature
            },
            timeout: 5000 // 5 seconds timeout
        });

        // On success, update the transaction
        await Transaction.findByIdAndUpdate(transactionId, {
            webhookStatus: 'sent',
            webhookResponse: response.data
        });
        
        return response.data;
    } catch (error) {
        // If it's a timeout or 5xx error, we throw to let BullMQ retry
        const errMessage = error.response?.data || error.message;
        
        // Update transaction as failed for this specific attempt
        await Transaction.findByIdAndUpdate(transactionId, {
            webhookStatus: 'failed',
            webhookResponse: errMessage
        });
        
        throw new Error(`Webhook failed: ${JSON.stringify(errMessage)}`);
    }
}, { 
    connection,
    concurrency: 5 // Process 5 webhooks concurrently
});

// Listen to worker events for logging or additional handling
worker.on('completed', (job) => {
    console.log(`✅ Webhook Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.log(`❌ Webhook Job ${job.id} failed with error: ${err.message}`);
});
