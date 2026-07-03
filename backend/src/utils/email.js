import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmationEmail({
  to,
  name,
  seatLabels,
  bookingRef,
  qrCodeDataUrl,
}) {
  try {
    const qrBase64 = qrCodeDataUrl.split(",")[1];
    await resend.emails.send({
      from: "Ticket Booking <onboarding@resend.dev>",
      to,
      subject: `Booking Confirmed - ${bookingRef}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c63ff;">Hi ${name}, your booking is confirmed! 🎉</h2>
          <p><b>Booking Ref:</b> ${bookingRef}</p>
          <p><b>Seats:</b> ${seatLabels.join(", ")}</p>
          <p>Your QR code ticket is attached to this email. Show it at the venue entrance.</p>
          <p style="color: #888; font-size: 12px;">Thank you for booking with Ticket App!</p>
        </div>
      `,
      attachments: [
        {
          filename: `ticket-${bookingRef}.png`,
          content: qrBase64,
        },
      ],
    });
    console.log("✅ Booking confirmation email sent to", to);
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
    await resend.emails.send({
      from: "Ticket Booking <onboarding@resend.dev>",
      to,
      subject: `A seat just opened up! Claim it within ${expiresInMinutes} minutes`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hi ${name}!</h2>
          <p>Seat <b>${seatLabel}</b> is now available from the waitlist.</p>
          <p>Complete booking within <b>${expiresInMinutes} minutes</b>.</p>
          <a href="${offerLink}" style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Complete Booking</a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Waitlist email failed:", err.message);
  }
}

export async function sendCancellationEmail({ to, name, bookingRef }) {
  try {
    await resend.emails.send({
      from: "Ticket Booking <onboarding@resend.dev>",
      to,
      subject: `Booking Cancelled - ${bookingRef}`,
      html: `<p>Hi ${name}, your booking <b>${bookingRef}</b> has been cancelled successfully.</p>`,
    });
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }
}
