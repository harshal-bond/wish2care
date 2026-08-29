import { sql } from 'drizzle-orm';
import { healthRecords, students } from '../db/schema.js';

/** 8 screening domains completed in SQL so list endpoints don't ship 50 HR columns. */
export const completedDomainsSql = sql<number>`(
  CASE WHEN ${healthRecords.height} IS NOT NULL
        AND ${healthRecords.weight} IS NOT NULL
        AND ${healthRecords.muac} IS NOT NULL
        AND ${healthRecords.waistCircumference} IS NOT NULL THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.systolic} IS NOT NULL
         AND ${healthRecords.diastolic} IS NOT NULL
         AND ${healthRecords.bpClass} IS NOT NULL AND ${healthRecords.bpClass} <> ''
         AND ${healthRecords.randomBloodSugar} IS NOT NULL THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.breakfast} IS NOT NULL AND ${healthRecords.breakfast} <> ''
         AND ${healthRecords.fruitIntake} IS NOT NULL AND ${healthRecords.fruitIntake} <> ''
         AND ${healthRecords.vegetables} IS NOT NULL AND ${healthRecords.vegetables} <> ''
         AND ${healthRecords.proteinIntake} IS NOT NULL AND ${healthRecords.proteinIntake} <> ''
         AND ${healthRecords.junkFood} IS NOT NULL AND ${healthRecords.junkFood} <> ''
         AND ${healthRecords.sugaryDrinks} IS NOT NULL AND ${healthRecords.sugaryDrinks} <> ''
         AND ${healthRecords.waterIntake} IS NOT NULL AND ${healthRecords.waterIntake} <> '' THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.physicalActivity} IS NOT NULL AND ${healthRecords.physicalActivity} <> ''
         AND ${healthRecords.screenTime} IS NOT NULL AND ${healthRecords.screenTime} <> ''
         AND ${healthRecords.outdoorPlay} IS NOT NULL AND ${healthRecords.outdoorPlay} <> ''
         AND ${healthRecords.sleepHours} IS NOT NULL AND ${healthRecords.sleepHours} <> ''
         AND ${healthRecords.smoking} IS NOT NULL AND ${healthRecords.smoking} <> ''
         AND ${healthRecords.alcohol} IS NOT NULL AND ${healthRecords.alcohol} <> '' THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.chronicDisease} IS NOT NULL AND ${healthRecords.chronicDisease} <> ''
         AND ${healthRecords.frequentFever} IS NOT NULL AND ${healthRecords.frequentFever} <> ''
         AND ${healthRecords.weightLoss} IS NOT NULL AND ${healthRecords.weightLoss} <> ''
         AND ${healthRecords.poorAppetite} IS NOT NULL AND ${healthRecords.poorAppetite} <> ''
         AND ${healthRecords.repeatedInfection} IS NOT NULL AND ${healthRecords.repeatedInfection} <> ''
         AND ${healthRecords.hospitalisation} IS NOT NULL AND ${healthRecords.hospitalisation} <> ''
         AND ${healthRecords.medication} IS NOT NULL AND ${healthRecords.medication} <> '' THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.stress} IS NOT NULL AND ${healthRecords.stress} <> ''
         AND ${healthRecords.mood} IS NOT NULL AND ${healthRecords.mood} <> ''
         AND ${healthRecords.concentration} IS NOT NULL AND ${healthRecords.concentration} <> ''
         AND ${healthRecords.bullying} IS NOT NULL AND ${healthRecords.bullying} <> '' THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.pallor} IS NOT NULL AND ${healthRecords.pallor} <> ''
         AND ${healthRecords.dentalCaries} IS NOT NULL AND ${healthRecords.dentalCaries} <> ''
         AND ${healthRecords.poorOralHygiene} IS NOT NULL AND ${healthRecords.poorOralHygiene} <> ''
         AND ${healthRecords.visionProblem} IS NOT NULL AND ${healthRecords.visionProblem} <> ''
         AND ${healthRecords.hairChanges} IS NOT NULL AND ${healthRecords.hairChanges} <> ''
         AND ${healthRecords.skinChanges} IS NOT NULL AND ${healthRecords.skinChanges} <> ''
         AND ${healthRecords.clubbing} IS NOT NULL AND ${healthRecords.clubbing} <> '' THEN 1 ELSE 0 END
  + CASE WHEN ${healthRecords.vaccinationComplete} IS NOT NULL AND ${healthRecords.vaccinationComplete} <> ''
         AND ${healthRecords.deworming} IS NOT NULL AND ${healthRecords.deworming} <> ''
         AND ${healthRecords.handHygiene} IS NOT NULL AND ${healthRecords.handHygiene} <> ''
         AND ${healthRecords.dentalCheckup} IS NOT NULL AND ${healthRecords.dentalCheckup} <> ''
         AND ${healthRecords.visionScreening} IS NOT NULL AND ${healthRecords.visionScreening} <> '' THEN 1 ELSE 0 END
)`.mapWith(Number);

export const screeningCompleteSql = sql<boolean>`(
  COALESCE(${healthRecords.assessmentComplete}, false) = true OR (${completedDomainsSql}) = 8
)`.mapWith(Boolean);

export const mentalCompleteSql = sql<boolean>`exists (
  select 1 from student_mental_health_assessments mh
  where mh.student_id = ${students.id}
)`.mapWith(Boolean);
