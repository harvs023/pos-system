import { NextResponse } from 'next/server';
const prisma = require('../../../lib/prisma');
export const dynamic = 'force-dynamic';
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = startOfDay(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // includes today = 7 days

  const paidStatus = { in: ['PAID'] };

  const [todayOrders, weekOrders, topProductsRaw, lowStockProducts, totalProducts] = await Promise.all([
    prisma.order.findMany({
      where: { status: paidStatus, createdAt: { gte: todayStart } },
      select: { total: true, paymentMethod: true },
    }),
    prisma.order.findMany({
      where: { status: paidStatus, createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 10 } },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.product.count({ where: { isActive: true } }),
  ]);

  const todaySalesTotal = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const todayOrderCount = todayOrders.length;
  const todayAvgTicket = todayOrderCount ? todaySalesTotal / todayOrderCount : 0;

  const byMethod = { CASH: 0, GCASH: 0, CARD: 0 };
  for (const o of todayOrders) byMethod[o.paymentMethod] += Number(o.total);

  // Build a 7-day series with zero-filled days
  const series = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(now);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayTotal = weekOrders
      .filter((o) => o.createdAt >= day && o.createdAt < nextDay)
      .reduce((sum, o) => sum + Number(o.total), 0);
    series.push({
      date: day.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      sales: Math.round(dayTotal * 100) / 100,
    });
  }

  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    name: p.name,
    quantitySold: p._sum.quantity || 0,
    revenue: Number(p._sum.lineTotal || 0),
  }));

  return NextResponse.json({
    todaySalesTotal,
    todayOrderCount,
    todayAvgTicket,
    byMethod,
    weekSeries: series,
    topProducts,
    lowStockProducts,
    totalProducts,
  });
}
