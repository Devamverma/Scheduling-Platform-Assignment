const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { addDays, addHours, setHours, setMinutes } = require('date-fns');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.bookingResponse.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.dateOverride.deleteMany();
  await prisma.weeklyHours.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'John Doe',
      username: 'demo',
      timezone: 'America/New_York'
    }
  });

  console.log('Created user:', user.username);

  // Create default availability schedule
  const schedule = await prisma.availabilitySchedule.create({
    data: {
      name: 'Working Hours',
      timezone: 'America/New_York',
      isDefault: true,
      userId: user.id,
      weeklyHours: {
        create: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', isEnabled: false },
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isEnabled: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isEnabled: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isEnabled: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isEnabled: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isEnabled: true },
          { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isEnabled: false },
        ]
      },
      dateOverrides: {
        create: [
          // Block a specific date
          {
            date: addDays(new Date(), 7),
            isBlocked: true
          }
        ]
      }
    }
  });

  console.log('Created schedule:', schedule.name);

  // Create event types
  const eventTypes = await Promise.all([
    prisma.eventType.create({
      data: {
        title: '15 Minute Meeting',
        slug: '15min',
        description: 'A quick 15 minute chat to discuss your needs.',
        duration: 15,
        color: '#22C55E',
        userId: user.id,
        scheduleId: schedule.id,
        bufferTimeBefore: 5,
        bufferTimeAfter: 5,
        minimumNotice: 60
      }
    }),
    prisma.eventType.create({
      data: {
        title: '30 Minute Meeting',
        slug: '30min',
        description: 'A 30 minute meeting for more in-depth discussions.',
        duration: 30,
        color: '#3B82F6',
        userId: user.id,
        scheduleId: schedule.id,
        bufferTimeBefore: 5,
        bufferTimeAfter: 10,
        minimumNotice: 120,
        customQuestions: {
          create: [
            {
              question: 'What would you like to discuss?',
              type: 'TEXTAREA',
              isRequired: true,
              order: 0,
              options: []
            },
            {
              question: 'Phone number (optional)',
              type: 'PHONE',
              isRequired: false,
              order: 1,
              options: []
            }
          ]
        }
      }
    }),
    prisma.eventType.create({
      data: {
        title: '60 Minute Consultation',
        slug: 'consultation',
        description: 'A full hour consultation for detailed planning and strategy sessions.',
        duration: 60,
        color: '#8B5CF6',
        userId: user.id,
        scheduleId: schedule.id,
        bufferTimeBefore: 10,
        bufferTimeAfter: 15,
        minimumNotice: 1440, // 24 hours
        requiresConfirmation: true
      }
    })
  ]);

  console.log('Created event types:', eventTypes.map(e => e.title));

  // Create sample bookings
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const nextWeek = addDays(now, 5);

  const bookings = await Promise.all([
    // Upcoming booking
    prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: '30 Minute Meeting with Alice Johnson',
        startTime: setMinutes(setHours(tomorrow, 10), 0),
        endTime: setMinutes(setHours(tomorrow, 10), 30),
        status: 'CONFIRMED',
        bookerName: 'Alice Johnson',
        bookerEmail: 'alice@example.com',
        bookerTimezone: 'America/New_York',
        notes: 'Excited to discuss the new project!',
        eventTypeId: eventTypes[1].id,
        userId: user.id
      }
    }),
    // Another upcoming booking
    prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: '15 Minute Meeting with Bob Smith',
        startTime: setMinutes(setHours(tomorrow, 14), 0),
        endTime: setMinutes(setHours(tomorrow, 14), 15),
        status: 'CONFIRMED',
        bookerName: 'Bob Smith',
        bookerEmail: 'bob@example.com',
        bookerTimezone: 'America/Chicago',
        eventTypeId: eventTypes[0].id,
        userId: user.id
      }
    }),
    // Pending booking
    prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: '60 Minute Consultation with Carol White',
        startTime: setMinutes(setHours(nextWeek, 11), 0),
        endTime: setMinutes(setHours(nextWeek, 12), 0),
        status: 'PENDING',
        bookerName: 'Carol White',
        bookerEmail: 'carol@example.com',
        bookerTimezone: 'Europe/London',
        notes: 'Looking forward to our strategy session.',
        eventTypeId: eventTypes[2].id,
        userId: user.id
      }
    }),
    // Past booking
    prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: '30 Minute Meeting with David Lee',
        startTime: setMinutes(setHours(addDays(now, -3), 15), 0),
        endTime: setMinutes(setHours(addDays(now, -3), 15), 30),
        status: 'COMPLETED',
        bookerName: 'David Lee',
        bookerEmail: 'david@example.com',
        bookerTimezone: 'America/Los_Angeles',
        eventTypeId: eventTypes[1].id,
        userId: user.id
      }
    }),
    // Cancelled booking
    prisma.booking.create({
      data: {
        uid: uuidv4(),
        title: '15 Minute Meeting with Eva Martinez',
        startTime: setMinutes(setHours(addDays(now, -1), 9), 0),
        endTime: setMinutes(setHours(addDays(now, -1), 9), 15),
        status: 'CANCELLED',
        bookerName: 'Eva Martinez',
        bookerEmail: 'eva@example.com',
        bookerTimezone: 'America/New_York',
        cancellationReason: 'Schedule conflict',
        eventTypeId: eventTypes[0].id,
        userId: user.id
      }
    })
  ]);

  console.log('Created bookings:', bookings.length);

  console.log('\n✅ Seed completed successfully!');
  console.log('\nYou can now access:');
  console.log('- Admin dashboard: [localhost](http://localhost:3000)');
  console.log('- Public booking page: [localhost](http://localhost:3000/demo)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
