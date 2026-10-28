import { InvitePage } from '@/features/platform/invite-page'
export const metadata = { robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <InvitePage token={token} />
}
