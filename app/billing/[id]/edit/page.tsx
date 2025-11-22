import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BillingEditContent } from '@/components/billing/BillingEditContent';
import { prisma } from '@/lib/prisma';

async function getClaimForEdit(id: string) {
  const claim = await prisma.claim.findUnique({
    where: { id },
    select: { id: true, patientId: true, therapistId: true, policyId: true, status: true, serviceDate: true, amountBilled: true, amountPaid: true, cptCodes: true, icdCodes: true },
  });

  if (!claim) return null;

  const patients = await prisma.patient.findMany({ select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: 'asc' } });
  const therapists = await prisma.user.findMany({ where: { role: 'THERAPIST' }, select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const policies = await prisma.insurancePolicy.findMany({ include: { payer: true, patient: true } });

  return {
    claim: {
      ...claim,
      serviceDate: claim.serviceDate.toISOString().split('T')[0],
      amountBilled: Number(claim.amountBilled),
      amountPaid: Number(claim.amountPaid),
    },
    patients,
    therapists,
    policies,
  };
}

export default async function BillingEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getClaimForEdit(params.id);
  if (!data) notFound();

  return (
    <DashboardLayout>
      <BillingEditContent claim={data.claim} patients={data.patients} therapists={data.therapists} policies={data.policies} />
    </DashboardLayout>
  );
}
