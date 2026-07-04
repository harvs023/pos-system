import { NextResponse } from 'next/server';
const prisma = require('../../../lib/prisma');
const { getUserFromRequest } = require('../../../lib/auth');
const { createGcashSource, createCardPaymentIntent } = require('../../../lib/paymongo');

const VAT_RATE = 0.12; // Philippines standard VAT

function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `ORD-${stamp}-${rand}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');

  if (orderNumber) {
    const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order });
  }

  const limit = Number(searchParams.get('limit') || 50);

  const orders = await prisma.order.findMany({
    include: { items: true, cashier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json({ orders });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  const body = await request.json();
  const { items, discount = 0, paymentMethod, amountTendered, taxInclusive = true } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  if (!['CASH', 'GCASH', 'CARD'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }

  // Look up live product prices/stock server-side — never trust client-sent prices
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  let subtotal = 0;
  const orderItemsData = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${product.name}` }, { status: 400 });
    }
    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;
    orderItemsData.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const discountedSubtotal = subtotal - Number(discount);
  // Prices are treated as VAT-inclusive (typical PH retail display price)
  const taxAmount = taxInclusive ? discountedSubtotal - discountedSubtotal / (1 + VAT_RATE) : discountedSubtotal * VAT_RATE;
  const total = taxInclusive ? discountedSubtotal : discountedSubtotal + taxAmount;

  const orderNumber = generateOrderNumber();

  // --- Online payment branch (GCash / Card) ---
  if (paymentMethod === 'GCASH' || paymentMethod === 'CARD') {
    const onlineEnabled = process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS === 'true';
    if (!onlineEnabled) {
      return NextResponse.json(
        { error: 'Online payments are currently disabled for testing. Use Cash, or enable NEXT_PUBLIC_ENABLE_ONLINE_PAYMENTS in .env.' },
        { status: 503 }
      );
    }

    // Create the order first as PENDING, decrement stock only after payment confirms (via webhook)
    const order = await prisma.order.create({
      data: {
        orderNumber,
        subtotal,
        discount,
        taxAmount,
        total,
        paymentMethod,
        status: 'PENDING',
        cashierId: user?.id,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    try {
      if (paymentMethod === 'GCASH') {
        const source = await createGcashSource(total, orderNumber);
        await prisma.order.update({ where: { id: order.id }, data: { paymentRef: source.id } });
        return NextResponse.json({ order, checkoutUrl: source.checkoutUrl }, { status: 201 });
      } else {
        const intent = await createCardPaymentIntent(total, orderNumber);
        await prisma.order.update({ where: { id: order.id }, data: { paymentRef: intent.id } });
        return NextResponse.json({ order, clientKey: intent.clientKey }, { status: 201 });
      }
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  // --- Cash branch (default, works with no external setup) ---
  if (amountTendered !== undefined && Number(amountTendered) < total) {
    return NextResponse.json({ error: 'Amount tendered is less than the total' }, { status: 400 });
  }
  const changeDue = amountTendered !== undefined ? Number(amountTendered) - total : 0;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        subtotal,
        discount,
        taxAmount,
        total,
        amountTendered: amountTendered ?? total,
        changeDue,
        paymentMethod: 'CASH',
        status: 'PAID',
        cashierId: user?.id,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of orderItemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return NextResponse.json({ order }, { status: 201 });
}
