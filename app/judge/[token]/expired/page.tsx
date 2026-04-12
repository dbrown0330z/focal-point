export default function ExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm">
        <h1 className="text-2xl font-semibold text-content-primary">Link unavailable</h1>
        <p className="mt-3 text-content-secondary">
          This judging link is no longer valid. The competition may not be open for judging,
          or the link may have been revoked. Contact the club admin if you think this is a mistake.
        </p>
      </div>
    </div>
  )
}
