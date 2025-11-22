import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientDetailContent } from '@/components/patients/PatientDetailContent';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

async function getPatientDetail(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      sex: true,
      phone: true,
      email: true,
      address: true,
      primaryDiagnosis: true,
      medicalHistory: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          appointments: true,
          sessionNotes: true,
          insurancePolicies: true,
        },
      },
      appointments: {
        select: {
          id: true,
          startTime: true,
          status: true,
          therapist: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: 5,
      },
      sessionNotes: {
        select: {
          id: true,
          createdAt: true,
          subjective: true,
          objective: true,
          assessment: true,
          plan: true,
          therapist: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  });

  if (!patient) {
    return null;
  }

  return {
    ...patient,
    dateOfBirth: patient.dateOfBirth.toISOString(),
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
    appointments: patient.appointments.map(apt => ({
      ...apt,
      startTime: apt.startTime.toISOString(),
    })),
    sessionNotes: patient.sessionNotes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
  };
}

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const patient = await getPatientDetail(params.id);

  if (!patient) {
    notFound();
  }

  return (
    <DashboardLayout>
      <PatientDetailContent patient={patient} />
    </DashboardLayout>
  );
}
