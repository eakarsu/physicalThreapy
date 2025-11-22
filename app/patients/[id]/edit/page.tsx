import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientEditContent } from '@/components/patients/PatientEditContent';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

async function getPatientForEdit(id: string) {
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
    },
  });

  if (!patient) {
    return null;
  }

  return {
    ...patient,
    dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0], // Format for date input
  };
}

export default async function PatientEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const patient = await getPatientForEdit(params.id);

  if (!patient) {
    notFound();
  }

  return (
    <DashboardLayout>
      <PatientEditContent patient={patient} />
    </DashboardLayout>
  );
}
