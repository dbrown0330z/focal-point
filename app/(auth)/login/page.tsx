import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; reset?: string }>
}) {
  const { error, pending, reset } = await searchParams
  return <LoginForm errorParam={error} pendingParam={pending} resetParam={reset} />
}
