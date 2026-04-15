alter table public.credit_events drop constraint if exists credit_events_event_type_check;
alter table public.credit_events add constraint credit_events_event_type_check check (
  event_type in (
    'source_upload',
    'library_activation',
    'lens_activation',
    'entity_extract_confirm',
    'evidence_anchor',
    'evidence_micro_search',
    'connector_ai_analysis',
    'mastery_blitz',
    'study_chat',
    'freestyle_prompt',
    'boost_pack_purchase',
    'monthly_renewal',
    'manual_adjustment'
  )
);
