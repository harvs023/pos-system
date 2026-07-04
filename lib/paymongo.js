/**
 * Thin wrapper around the PayMongo API (https://developers.paymongo.com).
 * PayMongo is the most widely used PH payment gateway and supports both
 * GCash (as an e-wallet "source") and Credit/Debit Cards (as a "payment intent").
 *
 * IMPORTANT: Online payments are OFF by default in this project
 * (NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS="false" in .env). These functions are
 * only called if that flag is turned on AND a real/test secret key is set.
 * Cash payments never touch this file.
 */

const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

function getAuthHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey || secretKey.includes('xxxxxxxx')) {
    throw new Error(
      'PayMongo secret key is not configured. Add a real PAYMONGO_SECRET_KEY to .env before enabling online payments.'
    );
  }
  const encoded = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Creates a GCash "source". The customer is redirected to `checkoutUrl` to
 * authorize the payment in the GCash app/web flow, then redirected back to
 * success_url / failed_url, which your webhook (or a status poll) confirms.
 * amount is in PESOS (e.g. 150.50) and gets converted to centavos for the API.
 */
async function createGcashSource(amount, orderNumber) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${PAYMONGO_BASE_URL}/sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          redirect: {
            success: `${baseUrl}/pos?payment=success&order=${orderNumber}`,
            failed: `${baseUrl}/pos?payment=failed&order=${orderNumber}`,
          },
          type: 'gcash',
          currency: 'PHP',
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.detail || 'Failed to create GCash source');
  }

  return {
    id: data.data.id,
    checkoutUrl: data.data.attributes.redirect.checkout_url,
    status: data.data.attributes.status,
  };
}

/**
 * Creates a Card payment intent. In production you'd pair this with
 * PayMongo.js / a hosted card element on the frontend to tokenize the card
 * details securely (never send raw card numbers through your own server).
 */
async function createCardPaymentIntent(amount, orderNumber) {
  const res = await fetch(`${PAYMONGO_BASE_URL}/payment_intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: 'PHP',
          payment_method_allowed: ['card'],
          description: `Order ${orderNumber}`,
          capture_type: 'automatic',
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.errors?.[0]?.detail || 'Failed to create card payment intent');
  }

  return {
    id: data.data.id,
    clientKey: data.data.attributes.client_key,
    status: data.data.attributes.status,
  };
}

async function retrieveSource(sourceId) {
  const res = await fetch(`${PAYMONGO_BASE_URL}/sources/${sourceId}`, {
    headers: { Authorization: getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.errors?.[0]?.detail || 'Failed to retrieve source');
  return data.data;
}

module.exports = { createGcashSource, createCardPaymentIntent, retrieveSource };
