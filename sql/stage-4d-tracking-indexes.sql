-- Optional index untuk mempercepat /account/tracking di Railway PostgreSQL.
-- Jalankan hanya jika tabelnya sudah ada.

create index if not exists idx_event_joins_user_id on event_joins(user_id);
create index if not exists idx_event_joins_event_id on event_joins(event_id);
create index if not exists idx_training_results_user_event on training_results(user_id, event_id);
create index if not exists idx_personal_trainings_user_id on personal_trainings(user_id);
create index if not exists idx_live_tracking_positions_user_id on live_tracking_positions(user_id);
