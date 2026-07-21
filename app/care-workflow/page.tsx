import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Alert, Box, Card, CardContent, Chip, Container, Stack, Typography } from '@mui/material';
import { authOptions } from '@/lib/auth';

const stages = [
  ['1. FHIR intake', 'Trusted FHIR R4 Patient and Consent resources are staged; two distinct identifiers are mandatory.'],
  ['2. Identity review', 'A clinician or administrator explicitly verifies or rejects every newly staged identity.'],
  ['3. Care-team and consent', 'Only assigned clinicians may draft, and active verified treatment/data-use consent is enforced.'],
  ['4. Safety screen', 'Red flags, missing evidence, and low confidence force escalation and block approval.'],
  ['5. Independent review', 'A second assigned therapist must attest and approve; the creator cannot self-approve.'],
];

export default async function CareWorkflowPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box><Typography variant="h3" component="h1">Controlled care workflow</Typography><Typography color="text.secondary">Signed in as {session.user.email}</Typography></Box>
        <Alert severity="warning">Legacy unscoped pages and AI generation are disabled. No draft is authoritative until independent clinician approval.</Alert>
        {stages.map(([title, description]) => <Card key={title} variant="outlined"><CardContent><Stack direction="row" spacing={2} alignItems="center"><Chip label="Required" color="primary" size="small"/><Box><Typography variant="h6">{title}</Typography><Typography color="text.secondary">{description}</Typography></Box></Stack></CardContent></Card>)}
        <Alert severity="info">This release exposes the governed workflow through <code>/api/clinical</code>. Production onboarding, jurisdiction-specific consent policy, representative-user validation, and external integration approval remain deployment gates.</Alert>
      </Stack>
    </Container>
  );
}
