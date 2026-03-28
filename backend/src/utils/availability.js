const { 
  format, 
  parse, 
  addMinutes, 
  isAfter, 
  isBefore, 
  startOfDay, 
  getDay,
  parseISO
} = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } = require('date-fns-tz');

/**
 * Generate available time slots for a given date
 */
function generateTimeSlots(eventType, date, bookerTimezone, existingBookings = []) {
  const slots = [];
  const schedule = eventType.schedule;
  
  if (!schedule) {
    return slots;
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const dayOfWeek = getDay(dateObj);
  
  // Check for date override
  const dateStr = format(dateObj, 'yyyy-MM-dd');
  const override = schedule.dateOverrides?.find(o => 
    format(new Date(o.date), 'yyyy-MM-dd') === dateStr
  );

  if (override?.isBlocked) {
    return slots;
  }

  // Get hours for this day
  let startTime, endTime;
  
  if (override && !override.isBlocked) {
    startTime = override.startTime;
    endTime = override.endTime;
  } else {
    const weeklyHour = schedule.weeklyHours?.find(wh => 
      wh.dayOfWeek === dayOfWeek && wh.isEnabled
    );
    
    if (!weeklyHour) {
      return slots;
    }
    
    startTime = weeklyHour.startTime;
    endTime = weeklyHour.endTime;
  }

  // Parse times in the schedule's timezone
  const scheduleTimezone = schedule.timezone;
  const slotInterval = eventType.slotInterval || eventType.duration;
  
  // Create datetime objects for start and end of availability
  const dayStart = parse(
    `${dateStr} ${startTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );
  const dayEnd = parse(
    `${dateStr} ${endTime}`,
    'yyyy-MM-dd HH:mm',
    new Date()
  );

  // Convert to UTC for comparison
  const startUTC = zonedTimeToUtc(dayStart, scheduleTimezone);
  const endUTC = zonedTimeToUtc(dayEnd, scheduleTimezone);
  
  const now = new Date();
  const minimumNoticeTime = addMinutes(now, eventType.minimumNotice);

  // Generate slots
  let currentSlot = startUTC;
  
  while (isBefore(currentSlot, endUTC)) {
    const slotEnd = addMinutes(currentSlot, eventType.duration);
    
    // Check if slot ends before availability ends
    if (isAfter(slotEnd, endUTC)) {
      break;
    }
    
    // Check minimum notice
    if (isBefore(currentSlot, minimumNoticeTime)) {
      currentSlot = addMinutes(currentSlot, slotInterval);
      continue;
    }

    // Check buffer times
    const bufferStart = addMinutes(currentSlot, -eventType.bufferTimeBefore);
    const bufferEnd = addMinutes(slotEnd, eventType.bufferTimeAfter);

    // Check for conflicts with existing bookings
    const hasConflict = existingBookings.some(booking => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      return (
        (isAfter(bufferEnd, bookingStart) && isBefore(bufferStart, bookingEnd))
      );
    });

    if (!hasConflict) {
      // Convert to booker's timezone for display
      const displayTime = formatInTimeZone(currentSlot, bookerTimezone, 'HH:mm');
      
      slots.push({
        time: displayTime,
        datetime: currentSlot.toISOString()
      });
    }

    currentSlot = addMinutes(currentSlot, slotInterval);
  }

  return slots;
}

/**
 * Parse date and time into start and end times
 */
function parseDateTime(date, time, timezone, duration) {
  const dateTimeStr = `${date} ${time}`;
  const localDateTime = parse(dateTimeStr, 'yyyy-MM-dd HH:mm', new Date());
  const startTime = zonedTimeToUtc(localDateTime, timezone);
  const endTime = addMinutes(startTime, duration);
  
  return { startTime, endTime };
}

/**
 * Check if a slot is available based on schedule
 */
async function isSlotAvailable(eventType, startTime, timezone) {
  const schedule = eventType.schedule;
  
  if (!schedule) {
    return false;
  }

  const scheduleTimezone = schedule.timezone;
  const localTime = utcToZonedTime(startTime, scheduleTimezone);
  const dayOfWeek = getDay(localTime);
  const timeStr = format(localTime, 'HH:mm');
  const dateStr = format(localTime, 'yyyy-MM-dd');

  // Check date override
  const override = schedule.dateOverrides?.find(o =>
    format(new Date(o.date), 'yyyy-MM-dd') === dateStr
  );

  if (override?.isBlocked) {
    return false;
  }

  let availStart, availEnd;

  if (override && !override.isBlocked) {
    availStart = override.startTime;
    availEnd = override.endTime;
  } else {
    const weeklyHour = schedule.weeklyHours?.find(wh =>
      wh.dayOfWeek === dayOfWeek && wh.isEnabled
    );

    if (!weeklyHour) {
      return false;
    }

    availStart = weeklyHour.startTime;
    availEnd = weeklyHour.endTime;
  }

  // Check if time is within available hours
  return timeStr >= availStart && timeStr < availEnd;
}

/**
 * Format datetime for display
 */
function formatDateTime(date, timezone, formatStr = 'PPP p') {
  return formatInTimeZone(date, timezone, formatStr);
}

module.exports = {
  generateTimeSlots,
  parseDateTime,
  isSlotAvailable,
  formatDateTime
};
