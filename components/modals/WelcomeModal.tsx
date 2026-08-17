"use client";

import { useEffect, useState } from "react";

import { useAccount, useUpdateAccount } from "@/lib/account";
import { lockBodyScroll } from "@/lib/bodyScrollLock";
import { PROFILE_TYPE_OPTIONS } from "@/lib/profileTypes";
import { useAction } from "@/context/ActionContext";
import { LogoMarkLight } from "@/components/layout/Logo";
import {
  BookmarkIcon,
  CalendarIcon,
  SparkleIcon,
  TicketIcon,
} from "@/components/ui/Icons";

/**
 * First-run welcome flow.
 *
 * Shown once, to new accounts only: the server sets `needs_onboarding`
 * while `ce_user_meta.about_contents` is empty, which is true until the
 * user picks what describes them here. Saving writes that index, so the
 * modal never comes back - on this dashboard or in the app.
 *
 * Deliberately not dismissible (no close button, no backdrop click, no
 * Escape). An answer is the only way out, otherwise `about_contents`
 * stays empty and it would just reappear on the next visit.
 */

const FEATURES = [
  {
    icon: <BookmarkIcon />,
    title: "Save events",
    desc: "Bookmark shows and meets you don't want to miss",
  },
  {
    icon: <TicketIcon />,
    title: "Manage your tickets",
    desc: "All your tickets in one place, ready on event day",
  },
  {
    icon: <CalendarIcon />,
    title: "Create new events",
    desc: "Set up shows, sell tickets and manage applications",
  },
  {
    icon: <SparkleIcon />,
    title: "And much more",
    desc: "Run car clubs, book venues and grow your community",
  },
];

export function WelcomeModal() {
  const { data } = useAccount();
  const updateAccount = useUpdateAccount();
  const runAction = useAction();

  const [step, setStep] = useState<1 | 2>(1);
  // Single choice - `about_contents` stays an array for the app's sake,
  // but only ever holds the one profile type picked here.
  const [picked, setPicked] = useState<number | null>(null);

  // Only a loaded account can tell us this; older WP deployments omit
  // the flag entirely, in which case nobody sees the flow.
  const open = data?.account?.needs_onboarding === true;

  // Lock the page behind the modal for as long as it's up.
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (!open) return null;

  const finish = async () => {
    if (picked === null) return;
    // No confirm step - picking and pressing "Get started" is already
    // the deliberate action. The account cache updates on success, which
    // flips needs_onboarding and unmounts this.
    await runAction({
      loadingLabel: "Setting up your dashboard...",
      successTitle: "You're all set",
      successMessage: "We'll tailor your dashboard to how you use CarEvents.",
      errorTitle: "Couldn't save your choices",
      run: () =>
        updateAccount.mutateAsync({
          about_contents: [picked],
        }),
    });
  };

  return (
    <div className="modal-backdrop open">
      <div
        className="modal welcome-modal"
        role="dialog"
        aria-labelledby="welcomeModalTitle"
        aria-modal="true"
      >
        {step === 1 ? (
          <div className="welcome-step">
            <div className="welcome-hero">
              <LogoMarkLight className="logo-mark-lg" />
              <div className="welcome-title" id="welcomeModalTitle">
                Welcome to your new dashboard
              </div>
              <div className="welcome-sub">
                Everything for your events, tickets and clubs - all in one
                place.
              </div>
            </div>
            <div className="welcome-body">
              {FEATURES.map((feature) => (
                <div className="welcome-feature" key={feature.title}>
                  <div className="welcome-feature-icon">{feature.icon}</div>
                  <div className="welcome-feature-text">
                    <div className="welcome-feature-title">{feature.title}</div>
                    <div className="welcome-feature-desc">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="welcome-footer">
              <button type="button" className="btn" onClick={() => setStep(2)}>
                Next
              </button>
              <div className="welcome-dots">
                <span className="welcome-dot active" />
                <span className="welcome-dot" />
              </div>
            </div>
          </div>
        ) : (
          <div className="welcome-step">
            <div className="welcome-hero compact">
              <div className="welcome-title" id="welcomeModalTitle">
                Which best describes you?
              </div>
              <div className="welcome-sub">
                Pick the one that fits best - we&apos;ll tailor your dashboard
                to how you use CarEvents.
              </div>
            </div>
            <div className="welcome-body">
              <div className="welcome-choices">
                {PROFILE_TYPE_OPTIONS.map((option) => (
                  <label className="welcome-choice" key={option.value}>
                    <input
                      type="radio"
                      name="welcome-role"
                      value={option.value}
                      checked={picked === option.value}
                      onChange={() => setPicked(option.value)}
                    />
                    <span className="welcome-check" aria-hidden="true" />
                    <span className="welcome-choice-text">
                      <span className="welcome-choice-label">
                        {option.label}
                      </span>
                      <span className="welcome-choice-desc">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="welcome-footer">
              <button
                type="button"
                className="btn"
                onClick={finish}
                disabled={picked === null}
              >
                Get started
              </button>
              <div className="welcome-footer-row">
                <button
                  type="button"
                  className="welcome-back"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <div className="welcome-dots">
                  <span className="welcome-dot" />
                  <span className="welcome-dot active" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
