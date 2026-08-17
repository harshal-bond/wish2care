import { Hono } from 'hono';
import { db } from '../db/index.js';
import { doctors, doctorAvailability, doctorAppointments } from '../db/schema.js';
import { authMiddleware, requireStudent } from '../middleware/auth.js';
import { bookAppointmentSchema } from '@wish2care/shared';
import type { DoctorSlot } from '@wish2care/shared';
import { eq, and } from 'drizzle-orm';
import { getDayOfWeek, isPastIst } from '../lib/istTime.js';

export const doctorsRoutes = new Hono();

doctorsRoutes.use('/*', authMiddleware);

function generateSlotsForDay(
  startTime: string,
  endTime: string,
  slotMinutes: number
): Array<{ startTime: string; endTime: string }> {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const endTotal = endH * 60 + endM;
  const fmt = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const slots: Array<{ startTime: string; endTime: string }> = [];
  for (let cur = startH * 60 + startM; cur + slotMinutes <= endTotal; cur += slotMinutes) {
    slots.push({ startTime: fmt(cur), endTime: fmt(cur + slotMinutes) });
  }
  return slots;
}

doctorsRoutes.get('/', async (c) => {
  const list = await db
    .select({ id: doctors.id, name: doctors.name, specialization: doctors.specialization, createdAt: doctors.createdAt })
    .from(doctors)
    .orderBy(doctors.name);
  return c.json({ success: true, data: list });
});

doctorsRoutes.get('/:id/slots', async (c) => {
  const doctorId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(doctorId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const date = c.req.query('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ success: false, error: 'date query param required (YYYY-MM-DD)' }, 400);
  }

  const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, doctorId));
  if (!doctor) return c.json({ success: false, error: 'Doctor not found' }, 404);

  const [availability] = await db
    .select()
    .from(doctorAvailability)
    .where(and(eq(doctorAvailability.doctorId, doctorId), eq(doctorAvailability.dayOfWeek, getDayOfWeek(date))));

  if (!availability) {
    return c.json({ success: true, data: [] });
  }

  const templateSlots = generateSlotsForDay(availability.startTime, availability.endTime, availability.slotMinutes);

  const booked = await db
    .select({ startTime: doctorAppointments.startTime })
    .from(doctorAppointments)
    .where(
      and(
        eq(doctorAppointments.doctorId, doctorId),
        eq(doctorAppointments.appointmentDate, date),
        eq(doctorAppointments.status, 'booked')
      )
    );
  const bookedTimes = new Set(booked.map((b) => b.startTime));

  const slots: DoctorSlot[] = templateSlots
    .filter((s) => !isPastIst(date, s.startTime))
    .map((s) => ({ ...s, available: !bookedTimes.has(s.startTime) }));

  return c.json({ success: true, data: slots });
});

doctorsRoutes.post('/:id/appointments', requireStudent, async (c) => {
  const doctorId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(doctorId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    const result = bookAppointmentSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }
    const { date, startTime } = result.data;

    const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, doctorId));
    if (!doctor) return c.json({ success: false, error: 'Doctor not found' }, 404);

    if (isPastIst(date, startTime)) {
      return c.json({ success: false, error: 'Cannot book a slot in the past' }, 400);
    }

    const [availability] = await db
      .select()
      .from(doctorAvailability)
      .where(and(eq(doctorAvailability.doctorId, doctorId), eq(doctorAvailability.dayOfWeek, getDayOfWeek(date))));
    if (!availability) {
      return c.json({ success: false, error: 'Doctor is not available on this date' }, 400);
    }

    const matched = generateSlotsForDay(availability.startTime, availability.endTime, availability.slotMinutes).find(
      (s) => s.startTime === startTime
    );
    if (!matched) {
      return c.json({ success: false, error: 'Not a valid slot time for this doctor' }, 400);
    }

    const user = c.get('user');

    const [appointment] = await db
      .insert(doctorAppointments)
      .values({
        doctorId,
        studentId: user.id,
        appointmentDate: date,
        startTime: matched.startTime,
        endTime: matched.endTime,
        status: 'booked',
      })
      .returning();

    return c.json({ success: true, data: appointment });
  } catch (err: any) {
    if (err.code === '23505') {
      return c.json({ success: false, error: 'This slot was just booked by someone else' }, 409);
    }
    return c.json({ success: false, error: err.message }, 500);
  }
});
