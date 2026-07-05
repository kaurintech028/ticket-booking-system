import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBookingConfirmationEmail({ to, name, seatLabels, bookingRef, qrCodeDataUrl }) {
  try {
    const qrBase64 = qrCodeDataUrl.split(",")[1];
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Booking Confirmed - ${bookingRef}`,
      html: `
        <h2>Hi ${name}, your booking is confirmed! 🎉</h2>
        <p><b>Booking Ref:</b> ${bookingRef}</p>
        <p><b>Seats:</b> ${seatLabels.join(", ")}</p>
        <p>Your QR code ticket is attached. Show it at the venue entrance.</p>
      `,
      attachments: [{
        filename: `ticket-${bookingRef}.png`,
        content: qrBase64,
        encoding: "base64",
      }],
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

export async function sendWaitlistOfferEmail({ to, name, seatLabel, offerLink, expiresInMinutes }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Seat available! Claim within ${expiresInMinutes} minutes`,
      html: `
        <h2>Hi ${name}!</h2>
        <p>Seat <b>${seatLabel}</b> is now available from the waitlist.</p>
        <p>Complete booking within <b>${expiresInMinutes} minutes</b>.</p>
        <a href="${offerLink}">Click here to complete your booking</a>
      `,
    });
  } catch (err) {
    console.error("Waitlist email failed:", err.message);
  }
}

export async function sendCancellationEmail({ to, name, bookingRef }) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `Booking Cancelled - ${bookingRef}`,
      html: `<p>Hi ${name}, your booking <b>${bookingRef}</b> has been cancelled.</p>`,
    });
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }
}