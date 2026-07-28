ALTER TABLE clip_candidates ADD COLUMN hook_strength REAL;
ALTER TABLE clip_candidates ADD COLUMN emotional_intensity REAL;
ALTER TABLE clip_candidates ADD COLUMN context_completeness REAL;
ALTER TABLE clip_candidates ADD COLUMN replay_value REAL;
ALTER TABLE clip_candidates ADD COLUMN overall_score REAL;
ALTER TABLE clip_candidates ADD COLUMN feedback_note TEXT;
