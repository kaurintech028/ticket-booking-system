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
    await resend.emails.send({
      from: "Ticket Booking <onboarding@resend.dev>",
      to,
      subject: `Booking Confirmed - ${bookingRef}`,
      html: `
        <h2>Hi ${name}, your booking is confirmed! 🎉</h2>
        <p><b>Booking Ref:</b> ${bookingRef}</p>
        <p><b>Seats:</b> ${seatLabels.join(", ")}</p>
        <p>Show your QR code at the venue entrance.</p>
        <img src="data:image/png;base64,${qrCodeDataUrl.split(",")[1]}" alt="QR Code" width="200" />
      `,
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
        <h2>Hi ${name}!</h2>
        <p>Seat <b>${seatLabel}</b> is now available from the waitlist.</p>
        <p>Complete booking within <b>${expiresInMinutes} minutes</b>.</p>
        <p><a href="${offerLink}">Click here to complete your booking</a></p>
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
      html: `<p>Hi ${name}, your booking <b>${bookingRef}</b> has been cancelled.</p>`,
    });
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }
}
