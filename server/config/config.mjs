import 'dotenv/config';
import mongoose from 'mongoose';
import { createClient } from 'redis';

//MongoDB Connection

let mongoReady = false;

const connectMongoDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('❌ MONGO_URI is missing in .env');
        }

        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: Number(process.env.MONGO_POOL_SIZE) || 200,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 60000,
            heartbeatFrequencyMS: 10000,
            compressors: ['snappy', 'zlib']
        });

        mongoReady = true;
        console.log('✅ MongoDB connected');
    } catch (error) {
        // console.error('❌ MongoDB connection failed:', error.message);
        setTimeout(connectMongoDB, 5000); // auto retry
    }
};

mongoose.connection.on('disconnected', () => {
    // console.warn('⚠️ MongoDB disconnected');
    if (mongoReady) {
        connectMongoDB();
    }
});

mongoose.connection.on('error', (err) => {
    // console.error('❌ MongoDB runtime error:', err.message);
});

//Redis Connection

let redisClient;

const connectRedis = async () => {
    try {
        if (!process.env.REDIS_URL) {
            throw new Error('❌ REDIS_URL is missing in .env');
        }

        redisClient = createClient({
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                connectTimeout: 10000,
                keepAlive: 5000,
                reconnectStrategy: (retries) => {
                    if (retries > 20) {
                        // console.error('❌ Redis max retries reached');
                        return new Error('Retry attempts exhausted');
                    }
                    return Math.min(retries * 200, 5000);
                }
            }
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        redisClient.on('ready', () => {
            // console.log('🚀 Redis ready');
        });

        redisClient.on('error', (err) => {
            // console.error('❌ Redis error:', err.message);
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });

        await redisClient.connect();

    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
        setTimeout(connectRedis, 5000);
    }
};

//Initialize Services

const initConnections = async () => {
    await Promise.all([
        connectMongoDB(),
        connectRedis()
    ]);
};

//Graceful Shutdown

const shutdown = async () => {
    // console.log('🛑 Gracefully shutting down...');

    try {
        await mongoose.connection.close(false);

        if (redisClient?.isOpen) {
            await redisClient.quit();
        }

        // console.log('✅ All connections closed');
    } catch (err) {
        console.error('Shutdown error:', err.message);
    }

    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

//Exports

export default initConnections;
export { redisClient };
