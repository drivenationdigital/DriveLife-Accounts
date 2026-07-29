"use client";

import { useClubEdit } from "@/context/ClubEditContext";
import { textareaCls } from "../shared";

/**
 * Step 4 — questions applicants answer when requesting to join.
 * Repeater backed by membership_questions.
 */
export function MembershipQuestionsPanel() {
  const { club, addQuestion, updateQuestion, removeQuestion } = useClubEdit();
  const questions = club.membershipQuestions;

  return (
    <div className="mb-8 space-y-5">
      {questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white px-6 py-8 text-center text-sm text-ink-500">
          No questions yet.
        </div>
      )}

      {questions.map((q, i) => (
        <div
          key={q.key}
          className="rounded-xl border border-ink-200 bg-white p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Question {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(q.key)}
              className="text-xs font-semibold text-ink-500 transition hover:text-red-500"
            >
              Remove
            </button>
          </div>
          <textarea
            className={`${textareaCls} min-h-[80px]`}
            value={q.question}
            onChange={(e) => updateQuestion(q.key, e.target.value)}
            placeholder="e.g. What car do you drive?"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="inline-flex items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-4 py-2.5 text-sm font-semibold text-gold-700 transition hover:bg-gold-100"
      >
        <i className="fa-solid fa-plus text-xs" aria-hidden />
        Add question
      </button>
    </div>
  );
}
