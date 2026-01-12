CREATE TABLE IF NOT EXISTS "Persona" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "details" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "Persona_name_unique" UNIQUE("name")
);
