"use client";

import { useClubEdit } from "@/context/ClubEditContext";

/**
 * Step 4 — questions applicants answer when requesting to join.
 * Repeater backed by membership_questions.
 */
export function MembershipQuestionsPanel() {
  const { club, addQuestion, updateQuestion, removeQuestion } = useClubEdit();
  const questions = club.membershipQuestions;

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-500">
        Ask applicants a few questions when they request to join. Leave this
        empty to accept requests without any questions.
      </p>

      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-8 text-center text-sm text-ink-400">
          No questions yet.
        </div>
      )}

      {questions.map((q, i) => (
        <div
          key={q.key}
          className="rounded-xl border border-ink-100 bg-ink-50/40 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
              Question {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(q.key)}
              className="text-xs font-semibold text-ink-400 transition hover:text-red-500"
            >
              Remove
            </button>
          </div>
          <textarea
            className="min-h-[80px] w-full resize-y rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-300 transition focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            value={q.question}
            onChange={(e) => updateQuestion(q.key, e.target.value)}
            placeholder="e.g. What car do you drive?"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50/60 px-4 py-2.5 text-sm font-bold text-gold-700 transition hover:bg-gold-100"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add question
      </button>
    </div>
  );
}
