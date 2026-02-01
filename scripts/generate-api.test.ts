import "reflect-metadata"
import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { ChatController } from "../src/main/controllers/ChatController"
import { MessageController } from "../src/main/controllers/MessageController"
import { ModelProviderController } from "../src/main/controllers/ModelProviderController"
import { PersonaController } from "../src/main/controllers/PersonaController"
import { StreamingChatController } from "../src/main/controllers/StreamingChatController"
import { generateApiContent } from "./generate-api-lib"

describe("generate-api", () => {
  it("stays in sync with the checked-in preload api", () => {
    const controllerSources = [
      {
        controller: ChatController,
        source: fs.readFileSync(
          path.resolve(__dirname, "../src/main/controllers/ChatController.ts"),
          "utf-8"
        ),
      },
      {
        controller: ModelProviderController,
        source: fs.readFileSync(
          path.resolve(__dirname, "../src/main/controllers/ModelProviderController.ts"),
          "utf-8"
        ),
      },
      {
        controller: StreamingChatController,
        source: fs.readFileSync(
          path.resolve(__dirname, "../src/main/controllers/StreamingChatController.ts"),
          "utf-8"
        ),
      },
      {
        controller: MessageController,
        source: fs.readFileSync(
          path.resolve(__dirname, "../src/main/controllers/MessageController.ts"),
          "utf-8"
        ),
      },
      {
        controller: PersonaController,
        source: fs.readFileSync(
          path.resolve(__dirname, "../src/main/controllers/PersonaController.ts"),
          "utf-8"
        ),
      },
    ]

    const generated = generateApiContent(controllerSources)
    const existing = fs.readFileSync(path.resolve(__dirname, "../src/preload/api.ts"), "utf-8")

    expect(generated).toBe(existing)
  })
})
