CREATE TABLE "ai_provider_receipts" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "provider" VARCHAR(32) NOT NULL,
  "provider_request_id" VARCHAR(255) NOT NULL,
  "model" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_provider_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_provider_receipts_prompt_length" CHECK (char_length("prompt") BETWEEN 1 AND 4000),
  CONSTRAINT "ai_provider_receipts_content_nonempty" CHECK (char_length("content") > 0),
  CONSTRAINT "ai_provider_receipts_provider_openrouter" CHECK ("provider" = 'openrouter')
);

CREATE INDEX "ai_provider_receipts_user_id_created_at_idx"
  ON "ai_provider_receipts"("user_id", "created_at" DESC);

ALTER TABLE "ai_provider_receipts"
  ADD CONSTRAINT "ai_provider_receipts_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
