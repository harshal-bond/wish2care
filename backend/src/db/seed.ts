import 'dotenv/config';
import { db } from './index.js';
import { schools, workers, students, healthRecords } from './schema.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@wish2care.org';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  // Create default school
  const [school] = await db.insert(schools).values({
    name: 'Green Valley Public School',
  }).returning();

  console.log(`Created school: ${school.name}`);

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const [admin] = await db.insert(workers).values({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: 'admin',
  }).returning();

  console.log(`Created admin user: ${admin.email}`);
  
  // Create fieldworker user
  const fwPasswordHash = await bcrypt.hash('worker123', 10);
  const [worker] = await db.insert(workers).values({
    name: 'Field Worker 1',
    email: 'worker@wish2care.org',
    passwordHash: fwPasswordHash,
    role: 'fieldworker',
    assignedSchoolId: school.id,
  }).returning();
  
  console.log(`Created field worker: ${worker.email}`);

  // Create a sample student
  const [student] = await db.insert(students).values({
    studentCode: 'STU-0001',
    name: 'Sample Student',
    age: 13,
    gender: 'F',
    schoolId: school.id,
  }).returning();

  console.log(`Created sample student: ${student.studentCode}`);

  // Sample health record matching STUDENT SCREENING example (Aarav Shah row)
  await db.insert(healthRecords).values({
    studentId: student.id,
    date: '2026-07-01',
    height: 155,
    weight: 45,
    muac: 22,
    waistCircumference: 60,
    breakfast: 'Always',
    fruitIntake: 'Daily',
    vegetables: 'Daily',
    proteinIntake: 'Daily',
    junkFood: 'Never',
    sugaryDrinks: 'Never',
    waterIntake: 'More than 2L',
    physicalActivity: 'Daily',
    screenTime: 'Less than 2 hrs',
    outdoorPlay: 'Daily',
    sleepHours: '8+ hrs',
    smoking: 'Not Applicable',
    alcohol: 'Not Applicable',
    chronicDisease: 'No',
    frequentFever: 'No',
    weightLoss: 'No',
    poorAppetite: 'No',
    repeatedInfection: 'No',
    hospitalisation: 'No',
    medication: 'No',
    stress: 'Low',
    mood: 'Happy',
    concentration: 'Good',
    bullying: 'No',
    pallor: 'No',
    dentalCaries: 'No',
    poorOralHygiene: 'No',
    visionProblem: 'No',
    hairChanges: 'No',
    skinChanges: 'No',
    vaccinationComplete: 'Yes',
    deworming: 'Yes',
    handHygiene: 'Good',
    dentalCheckup: 'Yes',
    visionScreening: 'Yes',
  });

  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed');
  console.error(err);
  process.exit(1);
});
