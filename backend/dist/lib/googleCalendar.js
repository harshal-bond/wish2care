import { google } from 'googleapis';
import crypto from 'crypto';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
function getClient() {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN)
        return null;
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
    return google.calendar({ version: 'v3', auth: oauth2Client });
}
/** 'YYYY-MM-DD' + 'HH:mm' (IST wall-clock) -> ISO string with an explicit +05:30 offset. */
function istToIsoString(date, time) {
    return `${date}T${time}:00+05:30`;
}
/**
 * Creates a Calendar event with an auto-generated Meet link and emails both
 * attendees a calendar invite. Never throws — booking a slot must succeed
 * even if Google's API is unreachable or credentials aren't configured yet;
 * this just returns null in that case and the appointment is saved without
 * a meetLink for now.
 */
export async function createMeetEvent(input) {
    const calendar = getClient();
    if (!calendar) {
        console.warn('[googleCalendar] Not configured (missing env vars) — skipping Meet link creation.');
        return null;
    }
    const attendees = [{ email: input.studentEmail }];
    if (input.doctorEmail)
        attendees.push({ email: input.doctorEmail });
    try {
        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            requestBody: {
                summary: `Doctor Appointment — ${input.doctorName}`,
                description: 'Booked via the Wish2Care app.',
                start: { dateTime: istToIsoString(input.date, input.startTime), timeZone: 'Asia/Kolkata' },
                end: { dateTime: istToIsoString(input.date, input.endTime), timeZone: 'Asia/Kolkata' },
                attendees,
                conferenceData: {
                    createRequest: {
                        requestId: crypto.randomUUID(),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });
        const meetLink = res.data.hangoutLink;
        const eventId = res.data.id;
        if (!meetLink || !eventId) {
            console.error('[googleCalendar] Event created but no Meet link/ID came back.', res.data);
            return null;
        }
        return { meetLink, eventId };
    }
    catch (err) {
        console.error('[googleCalendar] Failed to create Meet event:', err);
        return null;
    }
}
/** Best-effort cleanup — cancelling an appointment should never fail because this did. */
export async function deleteMeetEvent(eventId) {
    const calendar = getClient();
    if (!calendar)
        return;
    try {
        await calendar.events.delete({ calendarId: CALENDAR_ID, eventId, sendUpdates: 'all' });
    }
    catch (err) {
        console.error('[googleCalendar] Failed to delete Meet event:', err);
    }
}
//# sourceMappingURL=googleCalendar.js.map