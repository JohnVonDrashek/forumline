-- pg_notify trigger for notification SSE stream.
-- Run this on the forum-demo Supabase Postgres database.
-- It fires a NOTIFY on the 'notification_changes' channel whenever
-- a new row is inserted into the 'notifications' table.

CREATE OR REPLACE FUNCTION notify_notification_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('notification_changes', json_build_object(
    'id', NEW.id,
    'user_id', NEW.user_id,
    'type', NEW.type,
    'title', NEW.title,
    'message', NEW.message,
    'link', NEW.link,
    'read', NEW.read,
    'created_at', NEW.created_at
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_insert ON notifications;
CREATE TRIGGER trg_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_notification_insert();
