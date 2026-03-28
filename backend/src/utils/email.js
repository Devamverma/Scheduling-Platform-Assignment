const nodemailer = require('nodemailer');
const { formatInTimeZone } = require('date-fns-tz');

// Create transporter (configure based on your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendBookingConfirmation(booking) {
  const { bookerEmail, bookerName, bookerTimezone, startTime, endTime, eventType, uid } = booking;
  
  const formattedDate = formatInTimeZone(startTime, bookerTimezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, bookerTimezone, 'h:mm a');
  const formattedEndTime = formatInTimeZone(endTime, bookerTimezone, 'h:mm a');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: bookerEmail,
    subject: `Confirmed: ${eventType.title} with ${eventType.user.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111827;">Your booking is confirmed!</h2>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">${eventType.title}</h3>
          <p style="color: #4b5563; margin: 8px 0;">
            <strong>When:</strong> ${formattedDate}<br>
            ${formattedTime} - ${formattedEndTime} (${bookerTimezone})
          </p>
          <p style="color: #4b5563; margin: 8px 0;">
            <strong>With:</strong> ${eventType.user.name}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Need to make changes? 
          <a href="${process.env.FRONTEND_URL}/booking/${uid}" style="color: #3b82f6;">
            Manage your booking
          </a>
        </p>
      </div>
    `
  };

  if (process.env.SMTP_USER) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('Email would be sent:', mailOptions.subject);
  }
}

async function sendCancellationEmail(booking) {
  const { bookerEmail, bookerName, bookerTimezone, startTime, eventType } = booking;
  
  const formattedDate = formatInTimeZone(startTime, bookerTimezone, 'EEEE, MMMM d, yyyy');
  const formattedTime = formatInTimeZone(startTime, bookerTimezone, 'h:mm a');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: bookerEmail,
    subject: `Cancelled: ${eventType.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111827;">Booking Cancelled</h2>
        <p style="color: #4b5563;">
          Your booking for <strong>${eventType.title}</strong> on 
          ${formattedDate} at ${formattedTime} has been cancelled.
        </p>
        ${booking.cancellationReason ? `
          <p style="color: #4b5563;">
            <strong>Reason:</strong> ${booking.cancellationReason}
          </p>
        ` : ''}
      </div>
    `
  };

  if (process.env.SMTP_USER) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('Email would be sent:', mailOptions.subject);
  }
}

async function sendRescheduleEmail(newBooking, oldBooking) {
  const { bookerEmail, bookerTimezone, startTime, endTime, eventType, uid } = newBooking;
  
  const oldDate = formatInTimeZone(oldBooking.startTime, bookerTimezone, 'EEEE, MMMM d, yyyy');
  const oldTime = formatInTimeZone(oldBooking.startTime, bookerTimezone, 'h:mm a');
  
  const newDate = formatInTimeZone(startTime, bookerTimezone, 'EEEE, MMMM d, yyyy');
  const newTime = formatInTimeZone(startTime, bookerTimezone, 'h:mm a');
  const newEndTime = formatInTimeZone(endTime, bookerTimezone, 'h:mm a');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: bookerEmail,
    subject: `Rescheduled: ${eventType.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #111827;">Booking Rescheduled</h2>
        <p style="color: #4b5563;">
          Your booking has been rescheduled from ${oldDate} at ${oldTime} to:
        </p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #111827;">${eventType.title}</h3>
          <p style="color: #4b5563; margin: 8px 0;">
            <strong>New Time:</strong> ${newDate}<br>
            ${newTime} - ${newEndTime} (${bookerTimezone})
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.FRONTEND_URL}/booking/${uid}" style="color: #3b82f6;">
            View or manage your booking
          </a>
        </p>
      </div>
    `
  };

  if (process.env.SMTP_USER) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('Email would be sent:', mailOptions.subject);
  }
}

module.exports = {
  sendBookingConfirmation,
  sendCancellationEmail,
  sendRescheduleEmail
};
