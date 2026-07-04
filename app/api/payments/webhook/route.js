import { NextResponse } from 'next/server';
const prisma = require('../../../../lib/prisma');

/**
 * Configure this URL in your PayMongo Dashboard > Developers > Webhooks
 * once you enable online payments, e.g.:
 *   https://yourdomain.com/api/payments/webhook
 * Events to subscribe to: source.chargeable, payment.paid, payment.failed
 *
 * This route intentionally does NOT verify a signature yet — PayMongo signs
 * webhook payloads with a secret you set up in the dashboard. Before going
 * live, verify `paymongo-signature` header against your webhook secret.
 */
export async function POST(request) {
  const event = await request.json();
  const type = event?.data?.attributes?.type;
  const resource = event?.data?.attributes?.data;

  if (!type) {
    return NextResponse.json({ received: true });
  }

  // A GCash source became chargeable -> create the actual payment, or if you're
  // using PayMongo's automatic charge flow, this simply precedes payment.paid.
  if (type === 'payment.paid') {
    const paymentRef = resource?.attributes?.source?.id || resource?.id;
    const order = await prisma.order.findFirst({ where: { paymentRef } });
    if (order && order.status !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
        const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      });
    }
  }

  if (type === 'payment.failed') {
    const paymentRef = resource?.attributes?.source?.id || resource?.id;
    await prisma.order.updateMany({
      where: { paymentRef },
      data: { status: 'CANCELLED' },
    });
  }

  return NextResponse.json({ received: true });
}
