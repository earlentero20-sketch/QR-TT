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
  return JSON.stringify({
    v: 1,
    event: input.eventId,
    title: input.title,
    start: input.start,
    end: input.end,
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
