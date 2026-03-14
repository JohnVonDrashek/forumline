-- Citus migration (idempotent) — runs on every deploy via CI.
-- The citusdata/citus Docker image provides shared_preload_libraries='citus'.
-- This script creates the extension and distributes tenant schemas.

-- 1. Create the Citus extension
CREATE EXTENSION IF NOT EXISTS citus;

-- 2. Enable schema-based sharding persistently
ALTER SYSTEM SET citus.enable_schema_based_sharding = on;
SELECT pg_reload_conf();

-- 3. Register all existing tenant schemas as distributed.
-- On a single-node setup (no workers yet) this is a no-op in terms of
-- data movement, but it registers the schemas so Citus will distribute
-- them across worker nodes when workers are added later.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT schema_name FROM platform_tenants WHERE active = true LOOP
    BEGIN
      EXECUTE format('SELECT citus_schema_distribute(%L)', rec.schema_name);
      RAISE NOTICE 'distributed schema: %', rec.schema_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skipped schema % (already distributed or error: %)', rec.schema_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

SELECT 'Citus migration complete!' AS status;
