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
    // Create sample health record matching the example in the Excel
    await db.insert(healthRecords).values({
        studentId: student.id,
        date: '2026-07-18',
        height: 152,
        weight: 41,
        undernutritionClass: 'Normal',
        overweightClass: 'Caution',
        hb: 10.8,
        anaemiaClass: 'High-risk',
        systolic: 108,
        diastolic: 70,
        bpClass: 'Normal',
        waistCircumference: 68,
        familyHxCount: 1,
        metabolicRiskClass: 'Caution',
        rightEyeAcuity: 1.0,
        leftEyeAcuity: 0.67,
        decayedTeethCount: 1,
        wheezeSymptom: 'No',
        measuredPefr: 260,
        predictedPefr: 300,
        tbCough: 'No',
        tbFever: 'No',
        tbNightSweats: 'No',
        tbWeightLoss: 'No',
        mentalWellbeingResult: 'Clear',
    });
    console.log('Database seeded successfully!');
    process.exit(0);
}
main().catch((err) => {
    console.error('Seeding failed');
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map