import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BillingDetailContent } from '@/components/billing/BillingDetailContent';
import { prisma } from '@/lib/prisma';

async function getClaimDetail(id: string) {
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, primaryDiagnosis: true } },
      therapist: { select: { id: true, name: true, email: true } },
      policy: {
        include: {
          payer: { select: { name: true, contactPhone: true, contactEmail: true } },
        },
      },
    },
  });

  if (!claim) return null;

  return {
    ...claim,
    amountBilled: Number(claim.amountBilled),
    amountPaid: Number(claim.amountPaid),
    serviceDate: claim.serviceDate.toISOString(),
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
  };
}

export default async function BillingDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const claim = await getClaimDetail(params.id);
  if (!claim) notFound();

  return (
    <DashboardLayout>
      <BillingDetailContent claim={claim} />
    </DashboardLayout>
  );
}
