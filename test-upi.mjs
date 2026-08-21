import { upstreamUpiCheck } from './server/services/aeropayService.mjs';

(async () => {
    try {
        const result = await upstreamUpiCheck('test@upi');
        console.log("Success:", result);
    } catch (e) {
        console.error("Caught error:", e.message);
    }
})();
