export type MeetEventInput = {
    doctorName: string;
    doctorEmail: string | null;
    studentEmail: string;
    date: string;
    startTime: string;
    endTime: string;
};
export type MeetEventResult = {
    meetLink: string;
    eventId: string;
};
/**
 * Creates a Calendar event with an auto-generated Meet link and emails both
 * attendees a calendar invite. Never throws — booking a slot must succeed
 * even if Google's API is unreachable or credentials aren't configured yet;
 * this just returns null in that case and the appointment is saved without
 * a meetLink for now.
 */
export declare function createMeetEvent(input: MeetEventInput): Promise<MeetEventResult | null>;
/** Best-effort cleanup — cancelling an appointment should never fail because this did. */
export declare function deleteMeetEvent(eventId: string): Promise<void>;
//# sourceMappingURL=googleCalendar.d.ts.map