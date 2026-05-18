import LoginForm from './LoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; reset?: string; next?: string }>
}) {
  const { error, pending, reset, next } = await searchParams
  return <LoginForm errorParam={error} pendingParam={pending} resetParam={reset} nextParam={next} />
}
