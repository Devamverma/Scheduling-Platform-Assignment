#!/usr/bin/env node

/**
 * Simple Database Seeder
 * Run: node simple-seed.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  let connection;
  
  try {
    console.log('🚀 Connecting to database...');
    
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL not set in .env');
      process.exit(1);
    }

    // Create connection
    connection = await mysql.createConnection(dbUrl);
    console.log('✅ Connected to database!');

    console.log('📋 Creating tables...');
    
    // Create tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(191) NOT NULL,
        username VARCHAR(191) NOT NULL UNIQUE,
        timezone VARCHAR(191) NOT NULL DEFAULT 'America/New_York',
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS AvailabilitySchedule (
        id VARCHAR(191) NOT NULL,
        name VARCHAR(191) NOT NULL,
        isDefault BOOLEAN NOT NULL DEFAULT false,
        timezone VARCHAR(191) NOT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        userId VARCHAR(191) NOT NULL,
        PRIMARY KEY (id),
        INDEX AvailabilitySchedule_userId_idx (userId),
        FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS EventType (
        id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        slug VARCHAR(191) NOT NULL,
        description LONGTEXT,
        duration INT NOT NULL,
        color VARCHAR(191) NOT NULL DEFAULT '#3B82F6',
        isActive BOOLEAN NOT NULL DEFAULT true,
        requiresConfirmation BOOLEAN NOT NULL DEFAULT false,
        bufferTimeBefore INT NOT NULL DEFAULT 0,
        bufferTimeAfter INT NOT NULL DEFAULT 0,
        minimumNotice INT NOT NULL DEFAULT 60,
        slotInterval INT,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        userId VARCHAR(191) NOT NULL,
        scheduleId VARCHAR(191),
        PRIMARY KEY (id),
        UNIQUE KEY EventType_userId_slug_key (userId, slug),
        INDEX EventType_userId_idx (userId),
        INDEX EventType_slug_idx (slug),
        FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE,
        FOREIGN KEY (scheduleId) REFERENCES AvailabilitySchedule (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS Booking (
        id VARCHAR(191) NOT NULL,
        uid VARCHAR(191) NOT NULL UNIQUE,
        title VARCHAR(191) NOT NULL,
        description LONGTEXT,
        startTime DATETIME(3) NOT NULL,
        endTime DATETIME(3) NOT NULL,
        status VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        bookerName VARCHAR(191) NOT NULL,
        bookerEmail VARCHAR(191) NOT NULL,
        bookerTimezone VARCHAR(191) NOT NULL,
        notes LONGTEXT,
        cancellationReason LONGTEXT,
        rescheduledFromId VARCHAR(191),
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        eventTypeId VARCHAR(191) NOT NULL,
        userId VARCHAR(191) NOT NULL,
        PRIMARY KEY (id),
        INDEX Booking_userId_idx (userId),
        INDEX Booking_eventTypeId_idx (eventTypeId),
        INDEX Booking_startTime_idx (startTime),
        INDEX Booking_status_idx (status),
        FOREIGN KEY (eventTypeId) REFERENCES EventType (id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];

    for (const table of tables) {
      await connection.execute(table);
    }
    console.log('✅ Tables created!');

    console.log('🌱 Seeding demo data...');

    // Insert user
    await connection.execute(
      `INSERT INTO User (id, email, name, username, timezone) VALUES (?, ?, ?, ?, ?)`,
      ['user123', 'demo@example.com', 'John Doe', 'demo', 'America/New_York']
    );

    // Insert schedule
    await connection.execute(
      `INSERT INTO AvailabilitySchedule (id, name, isDefault, timezone, userId) VALUES (?, ?, ?, ?, ?)`,
      ['sched123', 'Working Hours', true, 'America/New_York', 'user123']
    );

    // Insert event types
    await connection.execute(
      `INSERT INTO EventType (id, title, slug, description, duration, color, userId, scheduleId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['event1', '15 Minute Meeting', '15min', 'A quick 15 minute chat', 15, '#22C55E', 'user123', 'sched123']
    );
    await connection.execute(
      `INSERT INTO EventType (id, title, slug, description, duration, color, userId, scheduleId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['event2', '30 Minute Meeting', '30min', 'A 30 minute discussion', 30, '#3B82F6', 'user123', 'sched123']
    );
    await connection.execute(
      `INSERT INTO EventType (id, title, slug, description, duration, color, userId, scheduleId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['event3', '60 Minute Consultation', 'consultation', 'Full hour consultation', 60, '#8B5CF6', 'user123', 'sched123']
    );

    // Insert bookings
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    await connection.execute(
      `INSERT INTO Booking (id, uid, title, startTime, endTime, status, bookerName, bookerEmail, bookerTimezone, eventTypeId, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['book1', 'uid1', 'Meeting with Alice', tomorrow, new Date(tomorrow.getTime() + 30 * 60 * 1000), 'CONFIRMED', 'Alice Johnson', 'alice@example.com', 'America/New_York', 'event2', 'user123']
    );
    await connection.execute(
      `INSERT INTO Booking (id, uid, title, startTime, endTime, status, bookerName, bookerEmail, bookerTimezone, eventTypeId, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['book2', 'uid2', 'Meeting with Bob', tomorrow, new Date(tomorrow.getTime() + 15 * 60 * 1000), 'CONFIRMED', 'Bob Smith', 'bob@example.com', 'America/Chicago', 'event1', 'user123']
    );

    console.log('✅ Demo data inserted!');

    // Verify
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM User');
    const [events] = await connection.execute('SELECT COUNT(*) as count FROM EventType');
    const [bookings] = await connection.execute('SELECT COUNT(*) as count FROM Booking');

    console.log('');
    console.log('📊 Summary:');
    console.log(`   Users: ${users[0].count}`);
    console.log(`   Event Types: ${events[0].count}`);
    console.log(`   Bookings: ${bookings[0].count}`);
    console.log('');
    console.log('✨ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seed();
