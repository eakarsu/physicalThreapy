import { PrismaClient, UserRole, Sex, AppointmentStatus, BodyRegion, ExerciseDifficulty, ProgressMetricType, ClaimStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.insurancePayer.deleteMany();
  await prisma.progressMetric.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.sessionNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ptflow.ai',
      hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const therapist1 = await prisma.user.create({
    data: {
      email: 'therapist1@ptflow.ai',
      hashedPassword,
      name: 'Dr. Sarah Johnson',
      role: UserRole.THERAPIST,
    },
  });

  const therapist2 = await prisma.user.create({
    data: {
      email: 'therapist2@ptflow.ai',
      hashedPassword,
      name: 'Dr. Michael Chen',
      role: UserRole.THERAPIST,
    },
  });

  const therapist3 = await prisma.user.create({
    data: {
      email: 'therapist3@ptflow.ai',
      hashedPassword,
      name: 'Dr. Emily Rodriguez',
      role: UserRole.THERAPIST,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'frontdesk1@ptflow.ai',
      hashedPassword,
      name: 'Jessica Smith',
      role: UserRole.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'frontdesk2@ptflow.ai',
      hashedPassword,
      name: 'David Williams',
      role: UserRole.STAFF,
    },
  });

  console.log('✅ Created users');

  // Create Exercises
  const exercises = await Promise.all([
    prisma.exercise.create({
      data: {
        name: 'Straight Leg Raise',
        description: 'Lie on back, keep one knee bent with foot flat on floor. Tighten thigh muscle of straight leg and slowly lift to height of opposite knee. Hold 3-5 seconds, slowly lower.',
        bodyRegion: BodyRegion.KNEE,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Clamshells',
        description: 'Lie on side with hips and knees bent. Keep feet together, lift top knee while keeping hips still. Slowly lower. Great for hip abductors.',
        bodyRegion: BodyRegion.HIP,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Bridging',
        description: 'Lie on back with knees bent, feet flat. Tighten glutes and lift hips off floor, creating straight line from shoulders to knees. Hold 5-10 seconds.',
        bodyRegion: BodyRegion.LOWER_BACK,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Wall Slides',
        description: 'Stand with back against wall. Slowly slide down until knees bent at 45-60 degrees. Hold 5-10 seconds, slide back up. Excellent for knee strengthening.',
        bodyRegion: BodyRegion.KNEE,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Hamstring Stretch - Supine',
        description: 'Lie on back. Use towel or strap around foot, keep knee straight and gently pull leg toward chest until stretch felt in back of thigh. Hold 30 seconds.',
        bodyRegion: BodyRegion.HIP,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist3.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Pendulum Exercise',
        description: 'Lean forward, let affected arm hang down. Gently swing arm in small circles, forward/back, side to side. Helps shoulder mobility post-surgery.',
        bodyRegion: BodyRegion.SHOULDER,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'External Rotation with Band',
        description: 'Stand with elbow bent 90 degrees, resistance band in hand. Keep elbow at side, rotate arm outward against resistance. For rotator cuff strength.',
        bodyRegion: BodyRegion.SHOULDER,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Ankle Pumps',
        description: 'Point toes down (plantarflexion), then pull toes up toward shin (dorsiflexion). Repeat rhythmically. Helps reduce swelling and maintain ankle mobility.',
        bodyRegion: BodyRegion.ANKLE,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Single Leg Balance',
        description: 'Stand on one leg, maintain balance for 30 seconds. Progress by closing eyes or standing on unstable surface. Improves proprioception.',
        bodyRegion: BodyRegion.ANKLE,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Cat-Cow Stretch',
        description: 'On hands and knees, alternate arching back (cow) and rounding spine (cat). Move slowly and smoothly. Excellent for spinal mobility.',
        bodyRegion: BodyRegion.LOWER_BACK,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist3.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Dead Bug',
        description: 'Lie on back, arms up, knees bent 90 degrees. Slowly lower opposite arm and leg while keeping back flat. Alternates sides. Core stability exercise.',
        bodyRegion: BodyRegion.CORE,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist3.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Heel Slides',
        description: 'Lie on back or sit. Slowly slide heel toward buttocks, bending knee as far as comfortable. Slide back out. For knee flexion after surgery.',
        bodyRegion: BodyRegion.KNEE,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Standing Calf Raises',
        description: 'Stand with feet shoulder-width apart. Rise up on toes, hold 2-3 seconds, slowly lower. Can progress to single leg. Strengthens gastrocnemius/soleus.',
        bodyRegion: BodyRegion.ANKLE,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Scapular Retraction',
        description: 'Sit or stand with arms at sides. Squeeze shoulder blades together, hold 5 seconds, release. Improves posture and shoulder stability.',
        bodyRegion: BodyRegion.UPPER_BACK,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Monster Walk',
        description: 'Place resistance band around knees or ankles. Maintain semi-squat position, walk forward/backward/sideways maintaining tension. Great for hip stability.',
        bodyRegion: BodyRegion.HIP,
        difficulty: ExerciseDifficulty.HARD,
        createdByUserId: therapist3.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Prone Knee Flexion',
        description: 'Lie face down. Bend knee, bringing heel toward buttocks. Hold 5 seconds, slowly lower. Strengthens hamstrings post-ACL surgery.',
        bodyRegion: BodyRegion.KNEE,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist1.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Quadruped Arm/Leg Raise',
        description: 'On hands and knees, simultaneously raise opposite arm and leg parallel to floor. Hold 5-10 seconds. Challenges core stability and balance.',
        bodyRegion: BodyRegion.CORE,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist3.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Seated Row with Band',
        description: 'Sit with legs extended, band around feet. Pull band to sides of torso, squeezing shoulder blades. Strengthens upper/mid back muscles.',
        bodyRegion: BodyRegion.UPPER_BACK,
        difficulty: ExerciseDifficulty.MODERATE,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Step-Ups',
        description: 'Step up onto 6-8 inch platform with affected leg, bring other leg up, step down. Control movement in both directions. Functional strength for knee/hip.',
        bodyRegion: BodyRegion.KNEE,
        difficulty: ExerciseDifficulty.HARD,
        createdByUserId: therapist2.id,
      },
    }),
    prisma.exercise.create({
      data: {
        name: 'Piriformis Stretch',
        description: 'Lie on back, cross affected ankle over opposite knee. Pull thigh toward chest until stretch felt in buttocks. Hold 30 seconds. Relieves sciatic pain.',
        bodyRegion: BodyRegion.HIP,
        difficulty: ExerciseDifficulty.EASY,
        createdByUserId: therapist3.id,
      },
    }),
  ]);

  console.log('✅ Created 20 exercises');

  // Create Patients with diverse conditions
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: 'John',
        lastName: 'Anderson',
        dateOfBirth: new Date('1985-03-15'),
        sex: Sex.MALE,
        phone: '555-0101',
        email: 'john.anderson@email.com',
        address: '123 Main St, Boston, MA 02101',
        primaryDiagnosis: 'Post-operative ACL reconstruction (right knee)',
        medicalHistory: 'Recreational soccer player. Injury occurred during game 8 weeks ago. Surgical reconstruction performed 6 weeks ago by Dr. Smith. Previous history of ankle sprain (2018).',
        emergencyContactName: 'Jane Anderson (spouse)',
        emergencyContactPhone: '555-0102',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Maria',
        lastName: 'Garcia',
        dateOfBirth: new Date('1972-11-08'),
        sex: Sex.FEMALE,
        phone: '555-0201',
        email: 'maria.garcia@email.com',
        address: '456 Oak Ave, Cambridge, MA 02138',
        primaryDiagnosis: 'Chronic low back pain with radiculopathy',
        medicalHistory: 'Onset 3 years ago, conservative management attempted. MRI shows L4-L5 disc bulge. Pain radiates down left leg. No surgery planned. Works as office manager (sedentary).',
        emergencyContactName: 'Carlos Garcia (son)',
        emergencyContactPhone: '555-0202',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Robert',
        lastName: 'Johnson',
        dateOfBirth: new Date('1956-07-22'),
        sex: Sex.MALE,
        phone: '555-0301',
        email: 'rob.johnson@email.com',
        address: '789 Elm St, Somerville, MA 02144',
        primaryDiagnosis: 'Status post right rotator cuff repair',
        medicalHistory: 'Full-thickness tear of supraspinatus and partial infraspinatus tear. Surgical repair 4 weeks ago. Retired teacher. Right hand dominant. History of hypertension (controlled).',
        emergencyContactName: 'Susan Johnson (spouse)',
        emergencyContactPhone: '555-0302',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Lisa',
        lastName: 'Thompson',
        dateOfBirth: new Date('1990-05-30'),
        sex: Sex.FEMALE,
        phone: '555-0401',
        email: 'lisa.thompson@email.com',
        address: '321 Pine St, Brookline, MA 02445',
        primaryDiagnosis: 'Grade II lateral ankle sprain (left)',
        medicalHistory: 'Injury occurred 2 weeks ago during trail running. Significant swelling and bruising initially. X-rays negative for fracture. Active runner (30 miles/week pre-injury).',
        emergencyContactName: 'Mark Thompson (spouse)',
        emergencyContactPhone: '555-0402',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'William',
        lastName: 'Davis',
        dateOfBirth: new Date('1948-12-10'),
        sex: Sex.MALE,
        phone: '555-0501',
        email: 'william.davis@email.com',
        address: '654 Birch Rd, Newton, MA 02458',
        primaryDiagnosis: 'Status post left total knee replacement',
        medicalHistory: 'Severe osteoarthritis left knee. TKR performed 3 weeks ago. History includes: type 2 diabetes (controlled), right TKR 5 years ago (excellent outcome), retired accountant.',
        emergencyContactName: 'Patricia Davis (spouse)',
        emergencyContactPhone: '555-0502',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Martinez',
        dateOfBirth: new Date('1983-09-18'),
        sex: Sex.FEMALE,
        phone: '555-0601',
        email: 'jennifer.martinez@email.com',
        address: '987 Maple Dr, Watertown, MA 02472',
        primaryDiagnosis: 'Frozen shoulder (adhesive capsulitis) - right',
        medicalHistory: 'Insidious onset 6 months ago. Severe restriction in all planes of motion, particularly external rotation. Pain at night. No history of trauma. Works as graphic designer.',
        emergencyContactName: 'Luis Martinez (spouse)',
        emergencyContactPhone: '555-0602',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        dateOfBirth: new Date('1995-02-14'),
        sex: Sex.MALE,
        phone: '555-0701',
        email: 'michael.brown@email.com',
        address: '147 Cedar Ln, Arlington, MA 02474',
        primaryDiagnosis: 'Plantar fasciitis - bilateral',
        medicalHistory: 'Pain with first steps in morning for past 4 months. Works as construction foreman (on feet 8-10 hours/day). Failed conservative treatment including rest, ice, stretching, OTC orthotics.',
        emergencyContactName: 'Sarah Brown (sister)',
        emergencyContactPhone: '555-0702',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Patricia',
        lastName: 'Wilson',
        dateOfBirth: new Date('1965-08-25'),
        sex: Sex.FEMALE,
        phone: '555-0801',
        email: 'patricia.wilson@email.com',
        address: '258 Spruce St, Medford, MA 02155',
        primaryDiagnosis: 'Cervical radiculopathy (C6-C7)',
        medicalHistory: 'Onset 6 weeks ago with neck pain radiating to right arm. Numbness in thumb and index finger. MRI shows moderate foraminal stenosis. Conservative management preferred. Office worker.',
        emergencyContactName: 'James Wilson (spouse)',
        emergencyContactPhone: '555-0802',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'David',
        lastName: 'Lee',
        dateOfBirth: new Date('1978-04-07'),
        sex: Sex.MALE,
        phone: '555-0901',
        email: 'david.lee@email.com',
        address: '369 Willow Way, Quincy, MA 02169',
        primaryDiagnosis: 'Patellar tendinopathy (jumper\'s knee) - bilateral',
        medicalHistory: 'Amateur volleyball player. Gradual onset over 8 months. Pain inferior pole of patella, worse with jumping/stairs. Previous PT episode 2 years ago with good response.',
        emergencyContactName: 'Amy Lee (spouse)',
        emergencyContactPhone: '555-0902',
      },
    }),
    prisma.patient.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Taylor',
        dateOfBirth: new Date('1992-10-12'),
        sex: Sex.FEMALE,
        phone: '555-1001',
        email: 'sarah.taylor@email.com',
        address: '741 Aspen Ct, Waltham, MA 02451',
        primaryDiagnosis: 'Status post Achilles tendon repair (left)',
        medicalHistory: 'Complete rupture 10 weeks ago during basketball. Surgical repair performed 8 weeks ago. Currently in walking boot. Nurse at local hospital.',
        emergencyContactName: 'Kevin Taylor (spouse)',
        emergencyContactPhone: '555-1002',
      },
    }),
  ]);

  console.log('✅ Created 10 patients');

  // Create Insurance Payers
  const blueCross = await prisma.insurancePayer.create({
    data: {
      name: 'BlueCross BlueShield',
      contactPhone: '1-800-555-2583',
      contactEmail: 'provider@bcbs.com',
      address: '100 Summer Street, Boston, MA 02110',
    },
  });

  const aetna = await prisma.insurancePayer.create({
    data: {
      name: 'Aetna',
      contactPhone: '1-800-555-2386',
      contactEmail: 'providerservices@aetna.com',
      address: '151 Farmington Ave, Hartford, CT 06156',
    },
  });

  const medicare = await prisma.insurancePayer.create({
    data: {
      name: 'Medicare',
      contactPhone: '1-800-633-4227',
      contactEmail: 'medicare@cms.gov',
      address: '7500 Security Blvd, Baltimore, MD 21244',
    },
  });

  console.log('✅ Created insurance payers');

  // Create Insurance Policies for each patient
  const policies = await Promise.all(
    patients.map((patient, index) => {
      const payer = [blueCross, aetna, medicare, blueCross, medicare, aetna, blueCross, medicare, aetna, blueCross][index];
      return prisma.insurancePolicy.create({
        data: {
          patientId: patient.id,
          payerId: payer.id,
          policyNumber: `POL-${1000 + index}`,
          groupNumber: `GRP-${2000 + index}`,
          coverageNotes: 'Standard PT coverage: 20 visits per year, $30 copay per visit. Pre-authorization not required.',
          isPrimary: true,
        },
      });
    })
  );

  console.log('✅ Created insurance policies');

  // Helper function to create date offsets
  const daysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const daysFromNow = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Create Appointments (mix of past completed and upcoming scheduled)
  const appointments = [];

  // John Anderson (ACL) - appointments with therapist1
  appointments.push(
    await prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        therapistId: therapist1.id,
        startTime: daysAgo(14),
        endTime: new Date(daysAgo(14).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.COMPLETED,
        location: 'Room 1',
        notes: 'Initial evaluation post-ACL reconstruction',
      },
    }),
    await prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        therapistId: therapist1.id,
        startTime: daysAgo(7),
        endTime: new Date(daysAgo(7).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.COMPLETED,
        location: 'Room 1',
      },
    }),
    await prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        therapistId: therapist1.id,
        startTime: daysFromNow(2),
        endTime: new Date(daysFromNow(2).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.SCHEDULED,
        location: 'Room 1',
      },
    })
  );

  // Maria Garcia (low back) - appointments with therapist3
  appointments.push(
    await prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        therapistId: therapist3.id,
        startTime: daysAgo(10),
        endTime: new Date(daysAgo(10).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.COMPLETED,
        location: 'Room 3',
      },
    }),
    await prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        therapistId: therapist3.id,
        startTime: daysFromNow(1),
        endTime: new Date(daysFromNow(1).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.SCHEDULED,
        location: 'Room 3',
      },
    })
  );

  // Robert Johnson (rotator cuff) - with therapist1
  appointments.push(
    await prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        therapistId: therapist1.id,
        startTime: daysAgo(21),
        endTime: new Date(daysAgo(21).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.COMPLETED,
        location: 'Room 1',
      },
    }),
    await prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        therapistId: therapist1.id,
        startTime: daysAgo(14),
        endTime: new Date(daysAgo(14).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.COMPLETED,
        location: 'Room 1',
      },
    }),
    await prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        therapistId: therapist1.id,
        startTime: daysFromNow(3),
        endTime: new Date(daysFromNow(3).getTime() + 60 * 60 * 1000),
        status: AppointmentStatus.SCHEDULED,
        location: 'Room 1',
      },
    })
  );

  // More appointments for other patients...
  for (let i = 3; i < patients.length; i++) {
    const therapist = [therapist1, therapist2, therapist3][i % 3];
    appointments.push(
      await prisma.appointment.create({
        data: {
          patientId: patients[i].id,
          therapistId: therapist.id,
          startTime: daysAgo(7),
          endTime: new Date(daysAgo(7).getTime() + 60 * 60 * 1000),
          status: AppointmentStatus.COMPLETED,
          location: `Room ${(i % 3) + 1}`,
        },
      }),
      await prisma.appointment.create({
        data: {
          patientId: patients[i].id,
          therapistId: therapist.id,
          startTime: daysFromNow(i % 5 + 1),
          endTime: new Date(daysFromNow(i % 5 + 1).getTime() + 60 * 60 * 1000),
          status: AppointmentStatus.SCHEDULED,
          location: `Room ${(i % 3) + 1}`,
        },
      })
    );
  }

  console.log('✅ Created appointments');

  // Create Session Notes with exercises for completed appointments
  const sessionNotes = [];

  // John Anderson session 1
  const johnSession1 = await prisma.sessionNote.create({
    data: {
      patientId: patients[0].id,
      therapistId: therapist1.id,
      appointmentId: appointments[0].id,
      subjective: 'Patient reports moderate pain (5/10) in right knee, especially with stairs. Some swelling noted. Able to walk without assistive device but with slight limp. Sleep disrupted by pain 2-3 nights per week.',
      objective: 'ROM: Knee flexion 95°, extension -5° (lacking full extension). Quad strength 3/5, hamstring 3+/5. Moderate effusion present. Gait antalgic with decreased stance phase on right. Surgical incisions well-healed.',
      assessment: '6 weeks post-op ACL reconstruction progressing appropriately. ROM and strength deficits expected at this stage. Need to focus on achieving full extension and quad activation.',
      plan: 'Continue 2x/week PT. Focus on: quad strengthening (SLR, quad sets), ROM exercises (heel slides, prone hangs), edema management. Progress weight-bearing as tolerated. HEP provided.',
      sessionExercises: {
        create: [
          {
            exerciseId: exercises[0].id, // Straight Leg Raise
            sets: 3,
            reps: 10,
            painScore: 3,
            comments: 'Good quad contraction, minimal substitution',
          },
          {
            exerciseId: exercises[11].id, // Heel Slides
            sets: 3,
            reps: 15,
            painScore: 4,
            comments: 'Achieving 95° flexion, work on going further',
          },
          {
            exerciseId: exercises[7].id, // Ankle Pumps
            sets: 3,
            reps: 20,
            painScore: 0,
            comments: 'For circulation and edema management',
          },
        ],
      },
    },
  });
  sessionNotes.push(johnSession1);

  // John Anderson session 2
  const johnSession2 = await prisma.sessionNote.create({
    data: {
      patientId: patients[0].id,
      therapistId: therapist1.id,
      appointmentId: appointments[1].id,
      subjective: 'Patient reports decreased pain (3/10), less swelling. Walking improved, still some discomfort with stairs. Sleep better, only 1 night of pain this week.',
      objective: 'ROM: Flexion 105°, extension 0° (full extension achieved!). Quad strength 3+/5, hamstring 4-/5. Minimal effusion. Gait improved, less antalgic. Able to perform mini squats to 45° with good form.',
      assessment: 'Excellent progress. Full extension achieved is major milestone. Ready to progress strengthening exercises. Continue working on flexion to reach 120°.',
      plan: 'Progress to wall slides and step-downs. Add single-leg balance work. Continue HEP with increased repetitions. Next visit will assess for gym equipment introduction.',
      sessionExercises: {
        create: [
          {
            exerciseId: exercises[0].id, // Straight Leg Raise
            sets: 3,
            reps: 15,
            painScore: 2,
            comments: 'Progressed reps, excellent form',
          },
          {
            exerciseId: exercises[3].id, // Wall Slides
            sets: 3,
            reps: 10,
            painScore: 3,
            comments: 'New exercise, patient tolerated well',
          },
          {
            exerciseId: exercises[11].id, // Heel Slides
            sets: 3,
            reps: 15,
            painScore: 2,
            comments: 'Now achieving 105° flexion',
          },
        ],
      },
    },
  });
  sessionNotes.push(johnSession2);

  // Maria Garcia session (low back)
  const mariaSession = await prisma.sessionNote.create({
    data: {
      patientId: patients[1].id,
      therapistId: therapist3.id,
      appointmentId: appointments[3].id,
      subjective: 'Patient reports constant low back pain (6/10) with intermittent shooting pain down left leg (4/10). Pain worse with prolonged sitting at work. Morning stiffness lasting 30-45 minutes. Taking ibuprofen daily.',
      objective: 'Posture: forward head, increased thoracic kyphosis. ROM: Flexion limited to 70% with pain, extension limited to 50%. SLR positive left at 40°. Deep tendon reflexes intact. Core strength 2+/5. Poor hip hinge pattern.',
      assessment: 'Chronic low back pain with radicular symptoms consistent with L4-L5 involvement. Weak core and poor movement patterns contributing. Would benefit from McKenzie-based approach and core stabilization.',
      plan: 'Start with gentle spinal mobility, core activation, hip hinge training. Educate on sitting posture and workstation ergonomics. 2x/week PT for 4 weeks, then reassess. HEP critical for success.',
      sessionExercises: {
        create: [
          {
            exerciseId: exercises[9].id, // Cat-Cow
            sets: 2,
            reps: 10,
            painScore: 2,
            comments: 'Good for mobility, patient found relief',
          },
          {
            exerciseId: exercises[2].id, // Bridging
            sets: 3,
            reps: 8,
            painScore: 3,
            comments: 'Difficulty with glute activation, needs cueing',
          },
          {
            exerciseId: exercises[10].id, // Dead Bug
            sets: 2,
            reps: 5,
            painScore: 4,
            comments: 'Challenging, regressed to partial range',
          },
        ],
      },
    },
  });
  sessionNotes.push(mariaSession);

  // Robert Johnson session (shoulder)
  const robertSession = await prisma.sessionNote.create({
    data: {
      patientId: patients[2].id,
      therapistId: therapist1.id,
      appointmentId: appointments[5].id,
      subjective: 'Patient reports pain (4/10) with overhead activities. Difficulty reaching behind back (can\'t tuck in shirt). Sleep okay if stays off right side. Concerned about stiffness.',
      objective: 'ROM: Flexion 110°, abduction 95°, ER 20°, IR to L5. All limited by pain and stiffness. Rotator cuff strength not tested (too early post-op). Scapular dyskinesis noted. Incisions healed.',
      assessment: '4 weeks post-op rotator cuff repair. ROM limitations expected due to surgical protocol (protective phase). Focus on passive ROM and pendulum exercises. No active ROM above 90° per MD protocol.',
      plan: 'Gentle passive ROM, pendulum exercises, scapular setting. Ice after exercises. Progress per physician protocol. Will begin active-assisted ROM at 6 weeks post-op. HEP emphasized.',
      sessionExercises: {
        create: [
          {
            exerciseId: exercises[5].id, // Pendulum
            sets: 3,
            durationSeconds: 60,
            painScore: 2,
            comments: 'Patient performing correctly, good relaxation',
          },
          {
            exerciseId: exercises[13].id, // Scapular Retraction
            sets: 3,
            reps: 12,
            painScore: 1,
            comments: 'Helps with posture, no shoulder movement',
          },
        ],
      },
    },
  });
  sessionNotes.push(robertSession);

  console.log('✅ Created session notes with exercises');

  // Create Progress Metrics for patients showing improvement over time

  // John Anderson - Knee ROM improvement
  await prisma.progressMetric.createMany({
    data: [
      {
        patientId: patients[0].id,
        type: ProgressMetricType.ROM,
        label: 'Knee Flexion - Right',
        valueNumeric: 85,
        unit: 'degrees',
        measuredAt: daysAgo(21),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[0].id,
        type: ProgressMetricType.ROM,
        label: 'Knee Flexion - Right',
        valueNumeric: 95,
        unit: 'degrees',
        measuredAt: daysAgo(14),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[0].id,
        type: ProgressMetricType.ROM,
        label: 'Knee Flexion - Right',
        valueNumeric: 105,
        unit: 'degrees',
        measuredAt: daysAgo(7),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[0].id,
        type: ProgressMetricType.PAIN,
        label: 'Pain Level',
        valueNumeric: 6,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(21),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[0].id,
        type: ProgressMetricType.PAIN,
        label: 'Pain Level',
        valueNumeric: 5,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(14),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[0].id,
        type: ProgressMetricType.PAIN,
        label: 'Pain Level',
        valueNumeric: 3,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(7),
        createdByUserId: therapist1.id,
      },
    ],
  });

  // Maria Garcia - Pain and functional improvement
  await prisma.progressMetric.createMany({
    data: [
      {
        patientId: patients[1].id,
        type: ProgressMetricType.PAIN,
        label: 'Low Back Pain',
        valueNumeric: 7,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(30),
        createdByUserId: therapist3.id,
      },
      {
        patientId: patients[1].id,
        type: ProgressMetricType.PAIN,
        label: 'Low Back Pain',
        valueNumeric: 6,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(10),
        createdByUserId: therapist3.id,
      },
      {
        patientId: patients[1].id,
        type: ProgressMetricType.FUNCTIONAL_SCORE,
        label: 'Oswestry Disability Index',
        valueNumeric: 52,
        unit: 'score',
        measuredAt: daysAgo(30),
        createdByUserId: therapist3.id,
      },
      {
        patientId: patients[1].id,
        type: ProgressMetricType.FUNCTIONAL_SCORE,
        label: 'Oswestry Disability Index',
        valueNumeric: 44,
        unit: 'score',
        measuredAt: daysAgo(10),
        createdByUserId: therapist3.id,
      },
    ],
  });

  // Robert Johnson - Shoulder ROM
  await prisma.progressMetric.createMany({
    data: [
      {
        patientId: patients[2].id,
        type: ProgressMetricType.ROM,
        label: 'Shoulder Flexion - Right',
        valueNumeric: 90,
        unit: 'degrees',
        measuredAt: daysAgo(21),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[2].id,
        type: ProgressMetricType.ROM,
        label: 'Shoulder Flexion - Right',
        valueNumeric: 110,
        unit: 'degrees',
        measuredAt: daysAgo(14),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[2].id,
        type: ProgressMetricType.PAIN,
        label: 'Shoulder Pain',
        valueNumeric: 5,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(21),
        createdByUserId: therapist1.id,
      },
      {
        patientId: patients[2].id,
        type: ProgressMetricType.PAIN,
        label: 'Shoulder Pain',
        valueNumeric: 4,
        unit: 'VAS 0-10',
        measuredAt: daysAgo(14),
        createdByUserId: therapist1.id,
      },
    ],
  });

  console.log('✅ Created progress metrics');

  // Create Claims
  const claims = [];

  // Create claims for completed appointments
  for (let i = 0; i < 5; i++) {
    const patient = patients[i];
    const policy = policies[i];
    const therapist = [therapist1, therapist2, therapist3][i % 3];

    claims.push(
      await prisma.claim.create({
        data: {
          patientId: patient.id,
          policyId: policy.id,
          therapistId: therapist.id,
          status: [ClaimStatus.PAID, ClaimStatus.SUBMITTED, ClaimStatus.PAID, ClaimStatus.DRAFT, ClaimStatus.PAID][i],
          serviceDate: daysAgo(14 - i * 2),
          amountBilled: 150,
          amountPaid: i !== 3 ? 120 : 0, // Draft claim not paid yet
          cptCodes: ['97110', '97112', '97140'],
          icdCodes: ['M25.561', 'S83.511A'],
        },
      }),
      await prisma.claim.create({
        data: {
          patientId: patient.id,
          policyId: policy.id,
          therapistId: therapist.id,
          status: [ClaimStatus.PAID, ClaimStatus.PAID, ClaimStatus.SUBMITTED, ClaimStatus.DENIED, ClaimStatus.DRAFT][i],
          serviceDate: daysAgo(7 - i),
          amountBilled: 150,
          amountPaid: i === 0 || i === 1 ? 120 : 0,
          cptCodes: ['97110', '97112'],
          icdCodes: ['M25.561'],
        },
      })
    );
  }

  console.log('✅ Created claims');

  // Create Message Threads and Messages
  const messageThreads = [];

  // Thread 1: Appointment rescheduling
  const thread1 = await prisma.messageThread.create({
    data: {
      patientId: patients[0].id,
      subject: 'Request to reschedule Friday appointment',
      createdByUserId: therapist1.id,
      messages: {
        create: [
          {
            senderUserId: therapist1.id,
            content: 'Hi John, I see you have an appointment scheduled for Friday at 2 PM. Is this still a good time for you?',
            sentAt: daysAgo(3),
            readAt: daysAgo(3),
          },
        ],
      },
    },
  });
  messageThreads.push(thread1);

  // Thread 2: Home exercise questions
  const thread2 = await prisma.messageThread.create({
    data: {
      patientId: patients[1].id,
      subject: 'Questions about home exercises',
      createdByUserId: staff1.id,
      messages: {
        create: [
          {
            senderUserId: staff1.id,
            content: 'Hi Maria, Dr. Rodriguez asked me to follow up with you. How are your home exercises going?',
            sentAt: daysAgo(5),
            readAt: daysAgo(4),
          },
          {
            senderUserId: therapist3.id,
            content: 'Hi Maria! I wanted to check in - are you able to do the exercises 2x per day as we discussed? Any questions about proper form?',
            sentAt: daysAgo(4),
            readAt: daysAgo(4),
          },
        ],
      },
    },
  });
  messageThreads.push(thread2);

  // Thread 3: Progress update
  const thread3 = await prisma.messageThread.create({
    data: {
      patientId: patients[2].id,
      subject: 'Great progress on shoulder mobility!',
      createdByUserId: therapist1.id,
      messages: {
        create: [
          {
            senderUserId: therapist1.id,
            content: 'Robert, I wanted to send you a quick note - you\'re making excellent progress! Your shoulder flexion has improved from 90 to 110 degrees in just 2 weeks. Keep up the great work with your home exercises!',
            sentAt: daysAgo(2),
            readAt: daysAgo(1),
          },
        ],
      },
    },
  });
  messageThreads.push(thread3);

  console.log('✅ Created message threads');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${6} users created`);
  console.log(`   - ${patients.length} patients created`);
  console.log(`   - ${exercises.length} exercises created`);
  console.log(`   - ${appointments.length} appointments created`);
  console.log(`   - ${sessionNotes.length} session notes created`);
  console.log(`   - ${3} insurance payers created`);
  console.log(`   - ${policies.length} insurance policies created`);
  console.log(`   - ${claims.length} claims created`);
  console.log(`   - ${messageThreads.length} message threads created`);
  console.log('\n🔐 Login credentials:');
  console.log('   Email: admin@ptflow.ai | Password: password123');
  console.log('   Email: therapist1@ptflow.ai | Password: password123');
  console.log('   Email: therapist2@ptflow.ai | Password: password123');
  console.log('   Email: therapist3@ptflow.ai | Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
