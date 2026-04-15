/** EP-07 — Link type picker at drop point + Cause & Effect reasoning step. */

export function ConnectorPickerEP07({
  canvasX,
  canvasY,
  phase,
  reasoningDraft,
  onReasoningChange,
  onPickRelationship,
  onPickContrast,
  onPickCauseEffect,
  onSubmitCauseToAi,
  onDismiss,
  causeSubmitBusy,
}: {
  canvasX: number;
  canvasY: number;
  phase: 'pick' | 'cause_effect';
  reasoningDraft: string;
  onReasoningChange: (v: string) => void;
  onPickRelationship: () => void;
  onPickContrast: () => void;
  onPickCauseEffect: () => void;
  onSubmitCauseToAi: () => void;
  onDismiss: () => void;
  causeSubmitBusy?: boolean;
}) {
  return (
    <div
      data-picker-popup
      className="absolute z-[60] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/12 bg-[#0d1f33]/98 p-3 shadow-[0_24px_60px_rgba(10,25,41,0.45)]"
      style={{ left: canvasX, top: canvasY }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {phase === 'pick' ? (
        <>
          <p className="mb-2 text-xs font-semibold text-white/80">Link type</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              data-relationship-option
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-sm font-medium text-white transition hover:border-[#e8825a]/45 hover:bg-[#e8825a]/10"
              onClick={onPickRelationship}
            >
              Relationship
            </button>
            <button
              type="button"
              data-contrast-option
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-sm font-medium text-white transition hover:border-[#e8825a]/45 hover:bg-[#e8825a]/10"
              onClick={onPickContrast}
            >
              Contrast
            </button>
            <button
              type="button"
              data-cause-effect-option
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-sm font-medium text-white transition hover:border-[#e8825a]/45 hover:bg-[#e8825a]/10"
              onClick={onPickCauseEffect}
            >
              Cause &amp; Effect
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-white/80">Cause &amp; effect — your reasoning</p>
          <textarea
            data-reasoning-textarea
            value={reasoningDraft}
            onChange={(e) => onReasoningChange(e.target.value)}
            rows={4}
            placeholder="Describe the cause → effect you see…"
            className="mb-2 w-full resize-none rounded-xl border border-white/10 bg-[#091523] px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/35 focus:border-[#e8825a]/40"
          />
          <button
            type="button"
            data-submit-to-ai-btn
            disabled={!reasoningDraft.trim() || causeSubmitBusy}
            onClick={onSubmitCauseToAi}
            className="mb-2 w-full rounded-xl bg-[#e8825a] py-2 text-xs font-bold text-white disabled:opacity-45"
          >
            {causeSubmitBusy ? '…' : 'Submit to AI'}
          </button>
          <p data-2-credit-deduction-label className="mb-2 text-[10px] text-white/45">
            2 credits for AI analysis
          </p>
          <p data-source-citation-on-response className="mb-2 text-[10px] text-emerald-200/90">
            Response will cite document context when available.
          </p>
        </>
      )}
      <button
        type="button"
        data-dismiss-without-linking
        className="mt-1 w-full text-center text-[11px] font-medium text-white/50 underline-offset-2 hover:text-white hover:underline"
        onClick={onDismiss}
      >
        Dismiss without linking
      </button>
    </div>
  );
}
