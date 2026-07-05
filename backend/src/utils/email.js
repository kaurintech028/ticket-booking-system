import fetch from "node-fetch";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
async function sendBrevoEmail({ to, subject, html, attachments = [] }) {
  const body = {
    sender: { name: "Ticket Booking", email: "b0f92f001@smtp-brevo.com" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };
  if (attachments.length) body.attachment = attachments;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

export async function sendBookingConfirmationEmail({
  to,
  name,
  seatLabels,
  bookingRef,
  qrCodeDataUrl,
}) {
  try {
    const qrBase64 = qrCodeDataUrl.split(",")[1];
    await sendBrevoEmail({
      to,
      subject: `Booking Confirmed - ${bookingRef}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c63ff;">Hi ${name}, your booking is confirmed! 🎉</h2>
          <p><b>Booking Ref:</b> ${bookingRef}</p>
          <p><b>Seats:</b> ${seatLabels.join(", ")}</p>
          <p>Your QR code ticket is attached. Show it at the venue entrance.</p>
        </div>
      `,
      attachments: [{ name: `ticket-${bookingRef}.png`, content: qrBase64 }],
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
}

export async function sendWaitlistOfferEmail({
  to,
  name,
  seatLabel,
  offerLink,
  expiresInMinutes,
}) {
  try {
    await sendBrevoEmail({
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
    await sendBrevoEmail({
      to,
      subject: `Booking Cancelled - ${bookingRef}`,
      html: `<p>Hi ${name}, your booking <b>${bookingRef}</b> has been cancelled.</p>`,
    });
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }
}
