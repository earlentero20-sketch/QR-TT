export type QRPayload = {
  v: 1;
  event: string;
  title?: string;
  start?: string;
  end?: string;
};

export type ParseQRResult =
  | { ok: true; payload: QRPayload }
  | { ok: false; message: string };

export function buildQRPayload(input: {
  eventId: string;
  title?: string;
  start?: string;
  end?: string;
}): string {
  // Keep the QR tiny: only the version and event code go in the code.
  // registerAttendance() looks the event up in the database by this code and
  // takes the title and time window from there, so title/start/end here were
  // never used. Fewer characters = a much simpler QR that a phone camera can
  // read reliably off another phone's screen. (parseQRPayload still accepts
  // older, longer codes.)
  return JSON.stringify({
    v: 1,
    event: input.eventId,
  });
}

export function parseQRPayload(raw: string): ParseQRResult {
  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, message: 'Invalid QR code.' };
    }

    const eventId = parsed.event ?? parsed.eventId;

    if (parsed.v !== 1 || !eventId || typeof eventId !== 'string') {
      return { ok: false, message: 'Not an attendance QR code.' };
    }

    return {
      ok: true,
      payload: {
        v: 1,
        event: eventId,
        title: typeof parsed.title === 'string' ? parsed.title : undefined,
        start: typeof parsed.start === 'string' ? parsed.start : undefined,
        end: typeof parsed.end === 'string' ? parsed.end : undefined,
      },
    };
  } catch {
    return { ok: false, message: 'Invalid QR code.' };
  }
}