import { describe, expect, it, vi } from "vitest"

const exposeInMainWorld = vi.fn()

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld,
  },
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock("electron-log/renderer", () => ({
  default: {
    scope: vi.fn(() => ({
      info: vi.fn(),
    })),
  },
}))

describe("preload index", () => {
  it("exposes the API surface to the renderer", async () => {
    const { api } = await import("./api")
    await import("./index")

    expect(exposeInMainWorld).toHaveBeenCalledWith("api", api)
    expect(Object.keys(api)).toEqual([
      "chat",
      "modelProvider",
      "message",
      "persona",
      "mcpServer",
      "streaming",
    ])
    expect(api).not.toHaveProperty("ipcRenderer")
  })
})
