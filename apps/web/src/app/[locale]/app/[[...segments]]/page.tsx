import { ConsoleApplication } from '@/features/platform/console'
export const metadata = { robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params
  return (
    <ConsoleApplication
      workspaceId={segments[0] === 'w' ? segments[1] : undefined}
      section={segments[0] === 'settings' ? ['account'] : segments.slice(2)}
    />
  )
}
