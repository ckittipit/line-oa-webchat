-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('RECEIVED', 'PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "line_users" (
    "id" TEXT NOT NULL,
    "line_user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "picture_url" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "line_message_id" TEXT,
    "webhook_event_id" TEXT,
    "contact_id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "text" TEXT NOT NULL,
    "error_message" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "line_users_line_user_id_key" ON "line_users"("line_user_id");

-- CreateIndex
CREATE INDEX "line_users_last_message_at_idx" ON "line_users"("last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "messages_line_message_id_key" ON "messages"("line_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_webhook_event_id_key" ON "messages"("webhook_event_id");

-- CreateIndex
CREATE INDEX "messages_contact_id_occurred_at_idx" ON "messages"("contact_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "line_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
