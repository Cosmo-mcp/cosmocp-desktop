import "reflect-metadata"
import fs from "fs"
import path from "path"
import { describe, expect, it, vi } from "vitest"
import { generateApiContent } from "./generate-api-lib"

vi.mock("../src/main/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe("generate-api", () => {
  it("stays in sync with the checked-in preload api", async () => {
    const { ChatController } = await import("../src/main/controllers/ChatController")
    const { MessageController } = await import("../src/main/controllers/MessageController")
    const { ModelProviderController } = await import(
      "../src/main/controllers/ModelProviderController"
    )
    const { PersonaController } = await import("../src/main/controllers/PersonaController")
    const { StreamingChatController } = await import(
      "../src/main/controllers/StreamingChatController"
    )
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
