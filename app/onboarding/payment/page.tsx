import Link from 'next/link'
import { completePayment } from '../actions'
import { logout } from '@/app/(auth)/actions'

export default function OnboardingPaymentPage() {
  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-status-success-bg border border-status-success">
            <svg className="h-3 w-3 text-status-success" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 5l2.5 2.5 3.5-4" />
            </svg>
          </div>
          <span className="text-sm text-content-secondary">Complete your profile</span>
        </div>
        <div className="flex-1 h-px bg-border-default" />
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-action-primary text-xs font-medium text-white">2</div>
          <span className="text-sm font-medium text-content-primary">Pay membership fee</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-content-primary mb-1">Annual membership fee</h2>
      <p className="text-content-secondary leading-relaxed mb-8">
        A one-off annual fee covers your club membership for the year.
      </p>

      <div className="rounded-xl border border-border-default bg-surface-2 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-content-secondary">Annual membership</span>
          <span className="text-sm font-semibold text-content-primary">$40.00</span>
        </div>
        <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
          <span className="font-medium text-content-primary">Total</span>
          <span className="font-semibold text-content-primary">$40.00</span>
        </div>
      </div>

      <div className="rounded-lg border border-status-warning bg-status-warning-bg px-4 py-3 mb-6">
        <p className="text-sm text-status-warning-text">
          <strong className="font-medium">Demo mode:</strong> No real payment will be taken. Click below to activate your membership.
        </p>
      </div>

      <div className="flex gap-3">
        <form action={completePayment} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-lg bg-action-primary px-4 py-3 text-sm font-medium text-white hover:bg-action-primary-hover transition-colors"
          >
            Activate membership
          </button>
        </form>
        <form action={logout} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-lg border border-border-default px-4 py-3 text-sm font-medium text-content-secondary hover:bg-surface-1 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/onboarding/profile"
          className="text-sm text-content-secondary hover:text-content-primary transition-colors"
        >
          ← Back to profile
        </Link>
      </div>
    </>
  )
}
