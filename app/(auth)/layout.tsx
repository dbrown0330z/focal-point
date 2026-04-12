export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-content-primary">Focal Point</h1>
        <p className="mt-1 text-sm text-content-secondary">Your camera club, online.</p>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface-2 p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
