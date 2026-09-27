import TripWizard from '@/components/wizard/TripWizard';

export const metadata = { title: 'Draft' };

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TripWizard draftId={id} />;
}
