import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BillingContent } from '@/components/billing/BillingContent';
import { prisma } from '@/lib/prisma';

async function getClaims() {
  const claims = await prisma.claim.findMany({
    select: {
      id: true,
      status: true,
      amountBilled: true,
      amountPaid: true,
      serviceDate: true,
      cptCodes: true,
      icdCodes: true,
      createdAt: true,
      updatedAt: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      therapist: {
        select: {
          name: true,
        },
      },
      policy: {
        select: {
          policyNumber: true,
          payer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert dates and decimals to proper format for client component
  return claims.map((claim) => ({
    ...claim,
    amountBilled: Number(claim.amountBilled),
    amountPaid: Number(claim.amountPaid),
    serviceDate: claim.serviceDate.toISOString(),
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
  }));
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const claims = await getClaims();

  return (
    <DashboardLayout>
      <BillingContent claims={claims} />
    </DashboardLayout>
  );
}
