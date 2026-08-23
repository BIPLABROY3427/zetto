import * as tf from '@tensorflow/tfjs';
import * as nsfw from 'nsfwjs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallbacks for thresholds if env vars are missing
const DEFAULT_PORN_THRESHOLD = 0.70;
const DEFAULT_HENTAI_THRESHOLD = 0.70;
const DEFAULT_SEXY_THRESHOLD = 0.85;

let nsfwModel = null;
let isModelLoading = false;
let modelLoadPromise = null;

/**
 * Loads the NSFWJS model from the internet and caches it in memory.
 */
const getModel = async () => {
    if (nsfwModel) return nsfwModel;

    if (isModelLoading) {
        return modelLoadPromise;
    }

    isModelLoading = true;
    modelLoadPromise = (async () => {
        try {
            const model = await nsfw.load();
            nsfwModel = model;
            return model;
        } catch (err) {
            isModelLoading = false;
            console.error('[Moderation] Failed to load NSFWJS model:', err.message);
            throw err;
        }
    })();

    return modelLoadPromise;
};

/**
 * Local NSFW image moderation using NSFWJS.
 * Fails closed on any error to ensure safety.
 */
export const moderateImage = async (filePath) => {
    let imageTensor = null;
    try {
        const model = await getModel();

        // Normalize image to raw RGB for TensorFlow and scale to 299x299
        const { data, info } = await sharp(filePath)
            .resize(299, 299, { fit: 'inside' })
            .removeAlpha() // Ensure exactly 3 channels
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Construct Tensor directly from raw pixels
        imageTensor = tf.tensor3d(new Int32Array(data), [info.height, info.width, info.channels], 'int32');

        // Run inference
        const predictions = await model.classify(imageTensor);

        // Clean up memory
        imageTensor.dispose();

        const pornThreshold = Number(process.env.NSFW_PORN_THRESHOLD) || DEFAULT_PORN_THRESHOLD;
        const hentaiThreshold = Number(process.env.NSFW_HENTAI_THRESHOLD) || DEFAULT_HENTAI_THRESHOLD;
        const sexyThreshold = Number(process.env.NSFW_SEXY_THRESHOLD) || DEFAULT_SEXY_THRESHOLD;

        let isUnsafe = false;
        const rejectedReasons = [];

        for (const prediction of predictions) {
            const className = prediction.className.toLowerCase();
            const probability = prediction.probability;

            if (className === 'porn' && probability >= pornThreshold) {
                isUnsafe = true;
                rejectedReasons.push(`Porn: ${(probability * 100).toFixed(1)}%`);
            }
            if (className === 'hentai' && probability >= hentaiThreshold) {
                isUnsafe = true;
                rejectedReasons.push(`Hentai: ${(probability * 100).toFixed(1)}%`);
            }
            if (className === 'sexy' && probability >= sexyThreshold) {
                isUnsafe = true;
                rejectedReasons.push(`Sexy: ${(probability * 100).toFixed(1)}%`);
            }
        }

        if (isUnsafe) {
            console.warn('[Moderation] Rejected unsafe KYC image:', rejectedReasons.join(', '));
            throw new Error('Image moderation failed. Document was flagged as unsafe. Please try a valid KYC document.');
        }

        return true;
    } catch (error) {
        if (imageTensor && !imageTensor.isDisposedInternal) {
            imageTensor.dispose();
        }
        if (!error.message.includes('unsafe')) {
            console.error('[Moderation] Inference Error:', error.message);
        }
        throw new Error(error.message.includes('Image moderation failed') ? error.message : 'Image validation failed due to system error.');
    }
};
