-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(128) NOT NULL,
    "last_name" VARCHAR(128) NOT NULL,
    "email" VARCHAR(128) NOT NULL,
    "phone" VARCHAR(128) NOT NULL,
    "service" VARCHAR(128) NOT NULL,
    "other" VARCHAR(255) NOT NULL,
    "message" VARCHAR(600) NOT NULL,
    "check" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);
