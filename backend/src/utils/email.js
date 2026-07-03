import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendBookingConfirmationEmail({ to, name, show, seatLabels, bookingRef, qrCodeDataUrl }) {
  const qrBase64 = qrCodeDataUrl.split(",")[1];
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Booking Confirmed - ${bookingRef}`,
    html: `
      <h2>Hi ${name}, your booking is confirmed! 🎉</h2>
      <p><b>Booking Ref:</b> ${bookingRef}</p>
      <p><b>Seats:</b> ${seatLabels.join(", ")}</p>
      <p>Show your QR code at the venue entrance.</p>
      <img src="cid:qrcode" alt="QR Code" />
    `,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qrBase64,
        encoding: "base64",
        cid: "qrcode",
      },
    ],
  });
}

export async function sendWaitlistOfferEmail({ to, name, show, seatLabel, offerLink, expiresInMinutes }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `A seat just opened up! Claim it within ${expiresInMinutes} minutes`,
    html: `
      <h2>Hi ${name}, good news!</h2>
      <p>Seat <b>${seatLabel}</b> is now available for you from the waitlist.</p>
      <p>Complete your booking within <b>${expiresInMinutes} minutes</b> or it will be offered to the next person in line.</p>
      <p><a href="${offerLink}">Click here to complete your booking</a></p>
    `,
  });
}

export async function sendCancellationEmail({ to, name, bookingRef }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Booking Cancelled - ${bookingRef}`,
    html: `<p>Hi ${name}, your booking <b>${bookingRef}</b> has been cancelled successfully.</p>`,
  });
}
