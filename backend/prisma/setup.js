/**
 * Database Setup Script
 * Run this to initialize the database with tables and seed data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Push Prisma schema to database (creates tables)
    console.log('📋 Creating database tables...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('✅ Tables created successfully!');

    // Seed database with initial data
    console.log('🌱 Seeding database with initial data...');
    const seedScript = require('./seed.js');
    await seedScript();
    console.log('✅ Database seeded successfully!');

    console.log('✨ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
