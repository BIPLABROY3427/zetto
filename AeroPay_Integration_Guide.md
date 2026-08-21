# AeroPay Integration Guide

This document explains the complete integration process for the AeroPay payment gateway (Pay-in and Pay-out), as implemented in the backend server.

## 1. Overview and Configuration
The integration uses the `axios` library to communicate with the AeroPay API endpoints.
All configurations are defined in the `Aeropay.mjs` controller.

**Configuration Variables:**
- `API_BASE`: `https://api.aeropay11.live/api`
- `API_KEY`: `4Ls142Y10CuV57e56881`
- `MERCH_NO`: `xbat`
- `NOTIFY_URL_PAYIN`: `https://api.xbat.in/api/aeropay/callback`
- `NOTIFY_URL_PAYOUT`: `https://api.xbat.in/api/aeropay/payoutcallback`

## 2. Signature Generation (Security)
AeroPay requires an MD5 signature for all requests to ensure data integrity.
The signature is generated using the following logic:
1. All payload parameters (excluding null/undefined) are sorted alphabetically by key.
2. The parameters are concatenated into a string like `key1=value1&key2=value2`.
3. The `API_KEY` is appended to the string.
4. An MD5 hash is generated from this combined string and sent as the `sign` parameter.

```javascript
const generateSign = (payload, key) => {
    const str = Object.keys(payload)
        .filter((k) => payload[k] !== undefined && payload[k] !== null)
        .sort()
        .map((k) => `${k}=${payload[k]}`)
        .join("&");
    return crypto.createHash("md5").update(str + key).digest("hex");
};
```

## 3. Pay-in System (Recharge)

### Initiation (`/api/aeropay/payin`)
1. **Validation**: The system verifies the user ID and checks if the recharge amount meets the minimum requirement (`MIN_RECHARGE = 200`).
2. **Order Creation**: Generates a unique order number (`ORD...`).
3. **API Request**: Sends a POST request to `/payIn` with `amount`, `orderNo`, `merchNo`, `currency: "INR"`, and `notifyUrl`.
4. **Database Record**: If the gateway responds successfully (`code === 0`), it creates a pending record (`status: "P"`) in the `Aeropay` database collection with the returned payment URL and business number.
5. **Response**: Returns the `paymentUrl` to the client so the user can complete the payment.

### Callback Handling (`/api/aeropay/callback`)
This is the webhook triggered by AeroPay when a user completes a payment.
1. **Verification**: Looks up the `orderNo` in the database. Checks if the order is already completed to prevent duplicate processing (Idempotency check).
2. **Status Update**: Updates the order status based on the gateway's `orderState`.
   - `1` = `C` (Completed/Success)
   - `0, 3, 6` = `P` (Pending/Processing)
   - `2, 4` = `F` (Failed/Closed)
   - `5` = `R` (Refunded)
3. **Wallet Credit**: If the new status is `C` (Completed), it executes an atomic transaction:
   - Increments the user's `recharge_balance` by the real amount.
   - Creates a `RechargeTransaction` record (credit).
   - Creates a `RechargeRecord` for history.

## 4. Pay-out System (Withdrawal)

### Initiation (`/api/aeropay/payout`)
1. **Validation**: Checks user ID, verifies bank details (Name, IFSC, Account, Mobile), and ensures the withdrawal amount is valid (minimum 100).
2. **Account Checks**: Verifies user account is approved (`account_status === 1`), withdrawal is enabled (`withdraw_status === true`), and user has sufficient `balance`.
3. **Payload Prep**: Generates a payout order number (`PO...`).
4. **API Request**: Sends a POST request to `/payOut` with all banking details, amount, order number, and webhook URL.
5. **Database Transaction**:
   - Immediately deducts the amount from the user's wallet (`balance`).
   - Creates a pending record in the `Payout` collection.

### Callback Handling (`/api/aeropay/payoutcallback`)
This webhook receives updates on the withdrawal status.
1. **Lookup**: Finds the payout order in the database via `orderNo`.
2. **Idempotency**: Skips processing if already marked as Completed (`C`).
3. **Status Update**: Updates the payout status (`C` for Success, `F` for Failed).
4. **Refund on Failure**: If the status from the gateway indicates failure (`F`), the system **refunds** the deducted amount back to the user's `balance`.

## 5. Explicit API Routes Summary

Here is the complete list of all AeroPay routes registered in `server/Routes/Routes.mjs`:

**Pay-in (Recharge) Routes:**
- `POST /api/aeropay/payin` (Protected by `LoginCheck`): Initiates recharge.
- `POST /api/aeropay/callback` (Public Webhook): Receives payment success/failure.
- `GET /api/aeropay/querypayinorder`: Checks real-time pay-in status.

**Pay-out (Withdrawal) Routes:**
- `POST /api/aeropay/payout` (Protected by `LoginCheck`): Initiates withdrawal.
- `POST /api/aeropay/payoutcallback` (Public Webhook): Receives withdrawal status.
- `POST /api/aeropay/querypayout`: Checks real-time payout status.

**Utility Routes:**
- `GET /api/aeropay/balance`: Queries the merchant's available balance in the AeroPay gateway.
- `GET /api/aeropay/utrcheck`: Verifies if a given UTR (Unique Transaction Reference) is valid.
- `GET /api/aeropay/upicheck`: Checks if a UPI ID is valid via the gateway.
