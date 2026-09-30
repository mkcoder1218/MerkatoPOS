ALTER TABLE "users" ADD COLUMN "username" TEXT;

UPDATE "users"
SET "username" = LOWER(
  REGEXP_REPLACE(
    SPLIT_PART("email", '@', 1) || '_' || LEFT("id", 6),
    '[^a-zA-Z0-9._-]',
    '',
    'g'
  )
)
WHERE "username" IS NULL;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "users_tenantId_username_key"
  ON "users"("tenantId", "username");
