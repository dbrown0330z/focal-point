import LoginForm from './LoginForm'
import FpAdminLoginForm from './FpAdminLoginForm'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; reset?: string; next?: string; fp?: string }>
}) {
  const { error, pending, reset, next, fp } = await searchParams

  if (fp) {
    return <FpAdminLoginForm errorParam={error} nextParam={next ?? '/fp-admin'} />
  }

  return <LoginForm errorParam={error} pendingParam={pending} resetParam={reset} nextParam={next} />
}
