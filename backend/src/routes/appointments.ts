import { Hono } from 'hono';
import { db } from '../db/index.js';
import { doctorAppointments, doctors } from '../db/schema.js';
import { authMiddleware, requireStudent } from '../middleware/auth.js';
import { eq, desc } from 'drizzle-orm';
import { isPastIst } from '../lib/istTime.js';

export const appointmentsRoutes = new Hono();

appointmentsRoutes.use('/*', authMiddleware);
appointmentsRoutes.use('/*', requireStudent);

appointmentsRoutes.get('/me', async (c) => {
  const user = c.get('user');

  const rows = await db
    .select({
      id: doctorAppointments.id,
      doctorId: doctorAppointments.doctorId,
      doctorName: doctors.name,
      studentId: doctorAppointments.studentId,
      appointmentDate: doctorAppointments.appointmentDate,
      startTime: doctorAppointments.startTime,
      endTime: doctorAppointments.endTime,
      status: doctorAppointments.status,
      createdAt: doctorAppointments.createdAt,
      cancelledAt: doctorAppointments.cancelledAt,
    })
    .from(doctorAppointments)
    .leftJoin(doctors, eq(doctors.id, doctorAppointments.doctorId))
    .where(eq(doctorAppointments.studentId, user.id))
    .orderBy(desc(doctorAppointments.appointmentDate), desc(doctorAppointments.startTime));

  return c.json({ success: true, data: rows });
});

appointmentsRoutes.post('/:id/cancel', async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const user = c.get('user');

  const [appointment] = await db.select().from(doctorAppointments).where(eq(doctorAppointments.id, id));
  if (!appointment) return c.json({ success: false, error: 'Appointment not found' }, 404);

  if (appointment.studentId !== user.id) {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }

  if (appointment.status === 'cancelled') {
    return c.json({ success: false, error: 'Appointment is already cancelled' }, 400);
  }

  if (isPastIst(appointment.appointmentDate, appointment.startTime)) {
    return c.json({ success: false, error: 'Cannot cancel a past appointment' }, 400);
  }

  const [updated] = await db
    .update(doctorAppointments)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(eq(doctorAppointments.id, id))
    .returning();

  return c.json({ success: true, data: updated });
});
