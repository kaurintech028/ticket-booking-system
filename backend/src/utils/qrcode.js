import QRCode from "qrcode";

// Encodes the booking reference into a QR code as a base64 data URL.
export async function generateQrCode(bookingRef) {
  const dataUrl = await QRCode.toDataURL(bookingRef, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
  });
  return dataUrl;
}
