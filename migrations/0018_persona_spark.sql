CREATE TABLE "Persona" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"details" text NOT NULL
);
CREATE UNIQUE INDEX "Persona_name_unique" ON "Persona" ("name");
