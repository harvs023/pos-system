const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // --- Users ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      name: 'Juan Cashier',
      username: 'cashier',
      password: cashierPassword,
      role: 'CASHIER',
    },
  });

  // --- Categories ---
  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages' },
  });

  const snacks = await prisma.category.upsert({
    where: { name: 'Snacks' },
    update: {},
    create: { name: 'Snacks' },
  });

  const meals = await prisma.category.upsert({
    where: { name: 'Meals' },
    update: {},
    create: { name: 'Meals' },
  });

  // --- Sample products ---
  const products = [
    { name: 'Iced Coffee', sku: 'BEV-001', price: 85.0, cost: 35.0, stock: 100, categoryId: beverages.id },
    { name: 'Bottled Water', sku: 'BEV-002', price: 20.0, cost: 8.0, stock: 200, categoryId: beverages.id },
    { name: 'Softdrink (Can)', sku: 'BEV-003', price: 45.0, cost: 20.0, stock: 150, categoryId: beverages.id },
    { name: 'Chicharon', sku: 'SNK-001', price: 35.0, cost: 15.0, stock: 80, categoryId: snacks.id },
    { name: 'Siopao', sku: 'SNK-002', price: 40.0, cost: 18.0, stock: 60, categoryId: snacks.id },
    { name: 'Chicken Rice Meal', sku: 'MEL-001', price: 120.0, cost: 60.0, stock: 40, categoryId: meals.id },
    { name: 'Beef Rice Meal', sku: 'MEL-002', price: 135.0, cost: 70.0, stock: 40, categoryId: meals.id },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log('Seed complete.');
  console.log('Login with: admin / admin123  (or) cashier / cashier123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
