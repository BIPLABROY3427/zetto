import { upstreamBalance } from './server/services/aeropayService.mjs';

(async () => {
    try {
        const result = await upstreamBalance();
        console.log("Success:", result);
    } catch (e) {
        console.error("Caught error:", e.message);
    }
})();
