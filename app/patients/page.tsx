import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientsContent } from '@/components/patients/PatientsContent';
import { prisma } from '@/lib/prisma';

async function getPatients() {
  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      sex: true,
      phone: true,
      email: true,
      primaryDiagnosis: true,
      _count: {
        select: {
          appointments: true,
          sessionNotes: true,
        },
      },
    },
    orderBy: {
      lastName: 'asc',
    },
  });

  // Convert dates to strings for client component
  return patients.map((patient) => ({
    ...patient,
    dateOfBirth: patient.dateOfBirth.toISOString(),
  }));
}

export default async function PatientsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const patients = await getPatients();

  return (
    <DashboardLayout>
      <PatientsContent patients={patients} />
    </DashboardLayout>
  );
}
