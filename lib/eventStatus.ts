export type EventStatus = 'upcoming' | 'live' | 'ended';

export type EventStatusInfo = {
    status: EventStatus;
    label: string;
    /** Short countdown, e.g. "starts in 12m" or "ends in 2h 5m" */
    detail: string;
};

function formatDuration(ms: number): string {
    const totalMinutes = Math.max(1, Math.round(ms / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
}

/** Pure function of the current time, so it's easy to re-run on a timer. */
export function getEventStatus(startIso: string, endIso: string, now = Date.now()): EventStatusInfo {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();

    if (now < start) {
        return { status: 'upcoming', label: 'Upcoming', detail: `starts in ${formatDuration(start - now)}` };
    }
    if (now > end) {
        return { status: 'ended', label: 'Ended', detail: `ended ${formatDuration(now - end)} ago` };
    }
    return { status: 'live', label: 'Live', detail: `ends in ${formatDuration(end - now)}` };
}