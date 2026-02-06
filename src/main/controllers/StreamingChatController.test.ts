import {beforeEach, describe, expect, it, vi} from "vitest"
import type {ChatAbortArgs, ChatSendMessageArgs} from "core/dto"
import type {McpClientManager} from "core/services/McpClientManager"
import type {MessageService} from "core/services/MessageService"
import type {ModelProviderService} from "core/services/ModelProviderService"
import type {PersonaService} from "core/services/PersonaService"

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}))

const ai = vi.hoisted(() => ({
  convertToModelMessages: vi.fn(),
  smoothStream: vi.fn(),
  streamText: vi.fn(),
  RetryError: {
    isInstance: vi.fn(() => false),
  },
}))

vi.mock("../logger", () => ({
  logger,
}))

vi.mock("ai", () => ({
  convertToModelMessages: ai.convertToModelMessages,
  smoothStream: ai.smoothStream,
  streamText: ai.streamText,
  RetryError: ai.RetryError,
}))

import {StreamingChatController} from "./StreamingChatController"

describe("StreamingChatController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ai.convertToModelMessages.mockResolvedValue([])
    ai.smoothStream.mockReturnValue("transform")
    ai.RetryError.isInstance.mockReturnValue(false)
  })

  it("aborts an active stream and logs the action", () => {
    const controller = new StreamingChatController(
      {} as unknown as ModelProviderService,
      {} as unknown as MessageService,
      {} as unknown as PersonaService,
      {} as unknown as McpClientManager
    )

    const abortController = new AbortController()
    const abortSpy = vi.spyOn(abortController, "abort")
    ;(controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.set(
      "chan",
      abortController
    )

    controller.abortMessage({streamChannel: "chan"} satisfies ChatAbortArgs)

    expect(abortSpy).toHaveBeenCalledTimes(1)
    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
    expect(logger.info).toHaveBeenCalledWith("Aborted stream for channel: chan")
  })

  it("streams chunks, persists messages, and emits end event on finish", async () => {
    const registry = {languageModel: vi.fn(() => "lm")}
    const modelProviderService = {
      getModelProviderRegistry: vi.fn().mockResolvedValue(registry),
    } as unknown as ModelProviderService
    const messageService = {
      createMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as MessageService
    const personaService = {
      getById: vi.fn().mockResolvedValue({details: "persona-details"}),
    } as unknown as PersonaService
    const mcpClientManager = {
      getAllTools: vi.fn().mockResolvedValue({}),
    } as unknown as McpClientManager

    ai.convertToModelMessages.mockResolvedValue([{role: "user", content: "hi"}])

    ai.streamText.mockImplementation((options: any) => ({
      toUIMessageStream: async function* () {
        yield {chunk: 1}
        yield {chunk: 2}
        options.onFinish?.({text: "assistant", reasoningText: "reasoning"})
      },
    }))

    const controller = new StreamingChatController(
      modelProviderService,
      messageService,
      personaService,
      mcpClientManager
    )

    const webContents = {
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    }
    const event = {sender: webContents} as any

    const args: ChatSendMessageArgs = {
      chatId: "chat-id",
      streamChannel: "chan",
      modelIdentifier: "provider:model" as never,
      personaId: "persona-id",
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [
            {type: "text", text: "Hello"},
            {type: "reasoning", text: "Think"},
          ],
        } as any,
      ],
    }

    await controller.sendMessage(args, event)

    expect(ai.smoothStream).toHaveBeenCalledWith({delayInMs: 30})
    expect(registry.languageModel).toHaveBeenCalledWith(args.modelIdentifier)
    expect(mcpClientManager.getAllTools).toHaveBeenCalledTimes(1)

    const streamOptions = ai.streamText.mock.calls[0][0]
    expect(streamOptions.experimental_transform).toBe("transform")
    expect(streamOptions.messages[0]).toEqual({role: "system", content: "persona-details"})

    expect(messageService.createMessage).toHaveBeenCalledWith({
      chatId: "chat-id",
      role: "user",
      text: "Hello",
      reasoning: "Think",
    })
    expect(messageService.createMessage).toHaveBeenCalledWith({
      chatId: "chat-id",
      role: "assistant",
      text: "assistant",
      reasoning: "reasoning",
      modelIdentifier: "provider:model",
    })

    expect(webContents.send).toHaveBeenCalledWith("chan-data", {
      type: "message-metadata",
      messageMetadata: {modelId: "provider:model"},
    })
    expect(webContents.send).toHaveBeenCalledWith("chan-data", {chunk: 1})
    expect(webContents.send).toHaveBeenCalledWith("chan-data", {chunk: 2})
    expect(webContents.send).toHaveBeenCalledWith("chan-end")

    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
  })

  it("uses personaName lookup when personaId is not provided", async () => {
    const registry = {languageModel: vi.fn(() => "lm")}
    const modelProviderService = {
      getModelProviderRegistry: vi.fn().mockResolvedValue(registry),
    } as unknown as ModelProviderService
    const messageService = {
      createMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as MessageService
    const personaService = {
      getByName: vi.fn().mockResolvedValue({details: "persona-by-name"}),
    } as unknown as PersonaService
    const mcpClientManager = {
      getAllTools: vi.fn().mockResolvedValue({}),
    } as unknown as McpClientManager

    ai.convertToModelMessages.mockResolvedValue([{role: "user", content: "hi"}])
    ai.streamText.mockImplementation((options: any) => ({
      toUIMessageStream: async function* () {
        options.onFinish?.({text: "", reasoningText: ""})
      },
    }))

    const controller = new StreamingChatController(
      modelProviderService,
      messageService,
      personaService,
      mcpClientManager
    )
    const webContents = {
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    }
    const event = {sender: webContents} as any

    await controller.sendMessage(
      {
        chatId: "chat-id",
        streamChannel: "chan",
        modelIdentifier: "provider:model" as never,
        personaName: "Persona",
        messages: [{id: "m1", role: "user", parts: [{type: "text", text: "Hello"}]} as any],
      },
      event
    )

    expect(personaService.getByName).toHaveBeenCalledWith("Persona")
    const streamOptions = ai.streamText.mock.calls[0][0]
    expect(streamOptions.messages[0]).toEqual({role: "system", content: "persona-by-name"})
    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
  })

  it("sends an error event when streamText throws", async () => {
    const modelProviderService = {
      getModelProviderRegistry: vi.fn().mockResolvedValue({languageModel: vi.fn(() => "lm")}),
    } as unknown as ModelProviderService
    const messageService = {
      createMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as MessageService
    const personaService = {
      getById: vi.fn().mockResolvedValue(undefined),
      getByName: vi.fn().mockResolvedValue(undefined),
    } as unknown as PersonaService
    const mcpClientManager = {
      getAllTools: vi.fn().mockResolvedValue({}),
    } as unknown as McpClientManager

    ai.convertToModelMessages.mockResolvedValue([])
    ai.streamText.mockImplementation(() => {
      throw new Error("boom")
    })

    const controller = new StreamingChatController(
      modelProviderService,
      messageService,
      personaService,
      mcpClientManager
    )
    const webContents = {
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    }
    const event = {sender: webContents} as any

    const args: ChatSendMessageArgs = {
      chatId: "chat-id",
      streamChannel: "chan",
      modelIdentifier: "provider:model" as never,
      messages: [{id: "m1", role: "user", parts: [{type: "text", text: "Hello"}]} as any],
    }

    await controller.sendMessage(args, event)

    expect(logger.error).toHaveBeenCalledWith("Failed to start streamText:", expect.any(Error))
    expect(webContents.send).toHaveBeenCalledWith("chan-error", expect.any(Error))
    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
  })

  it("emits streamText onError messages and prefers RetryError.lastError", async () => {
    const registry = {languageModel: vi.fn(() => "lm")}
    const modelProviderService = {
      getModelProviderRegistry: vi.fn().mockResolvedValue(registry),
    } as unknown as ModelProviderService
    const messageService = {
      createMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as MessageService
    const personaService = {
      getById: vi.fn().mockResolvedValue(undefined),
      getByName: vi.fn().mockResolvedValue(undefined),
    } as unknown as PersonaService
    const mcpClientManager = {
      getAllTools: vi.fn().mockResolvedValue({}),
    } as unknown as McpClientManager

    ai.convertToModelMessages.mockResolvedValue([])

    let capturedOptions: any
    ai.streamText.mockImplementation((options: any) => {
      capturedOptions = options
      return {
        toUIMessageStream: async function* () {},
      }
    })

    const controller = new StreamingChatController(
      modelProviderService,
      messageService,
      personaService,
      mcpClientManager
    )
    const webContents = {
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    }
    const event = {sender: webContents} as any

    await controller.sendMessage(
      {
        chatId: "chat-id",
        streamChannel: "chan",
        modelIdentifier: "provider:model" as never,
        messages: [{id: "m1", role: "user", parts: [{type: "text", text: "Hello"}]} as any],
      },
      event
    )

    ai.RetryError.isInstance.mockReturnValue(true)
    await capturedOptions.onError({error: "original", lastError: "retry-last"})

    expect(logger.error).toHaveBeenCalledWith("Stream error:", expect.anything())
    expect(webContents.send).toHaveBeenCalledWith("chan-error", "retry-last")
    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
  })

  it("exposes renderer-side no-op listener helpers", () => {
    const controller = new StreamingChatController(
      {} as unknown as ModelProviderService,
      {} as unknown as MessageService,
      {} as unknown as PersonaService,
      {} as unknown as McpClientManager
    )

    const cleanupData = controller.onData("x", () => {})
    const cleanupEnd = controller.onEnd("x", () => {})
    const cleanupError = controller.onError("x", () => {})

    expect(cleanupData).toEqual(expect.any(Function))
    expect(cleanupEnd).toEqual(expect.any(Function))
    expect(cleanupError).toEqual(expect.any(Function))

    expect(cleanupData()).toBeUndefined()
    expect(cleanupEnd()).toBeUndefined()
    expect(cleanupError()).toBeUndefined()
  })

  it("aborts and stops streaming when the WebContents is destroyed", async () => {
    const modelProviderService = {
      getModelProviderRegistry: vi.fn().mockResolvedValue({languageModel: vi.fn(() => "lm")}),
    } as unknown as ModelProviderService
    const messageService = {
      createMessage: vi.fn().mockResolvedValue(undefined),
    } as unknown as MessageService
    const personaService = {
      getById: vi.fn().mockResolvedValue(undefined),
      getByName: vi.fn().mockResolvedValue(undefined),
    } as unknown as PersonaService
    const mcpClientManager = {
      getAllTools: vi.fn().mockResolvedValue({}),
    } as unknown as McpClientManager

    ai.convertToModelMessages.mockResolvedValue([])
    ai.streamText.mockImplementation((options: any) => {
      options.abortSignal.addEventListener("abort", () => options.onAbort?.())
      return {
        toUIMessageStream: async function* () {
          yield {chunk: 1}
        },
      }
    })

    const controller = new StreamingChatController(
      modelProviderService,
      messageService,
      personaService,
      mcpClientManager
    )
    const webContents = {
      isDestroyed: vi.fn(() => true),
      send: vi.fn(),
    }
    const event = {sender: webContents} as any

    await controller.sendMessage(
      {
        chatId: "chat-id",
        streamChannel: "chan",
        modelIdentifier: "provider:model" as never,
        messages: [{id: "m1", role: "user", parts: [{type: "text", text: "Hello"}]} as any],
      },
      event
    )

    expect(logger.info).toHaveBeenCalledWith("WebContents destroyed, stopping stream.")
    expect(webContents.send).not.toHaveBeenCalledWith("chan-data", expect.anything())
    expect(
      (controller as unknown as {activeStreams: Map<string, AbortController>}).activeStreams.has("chan")
    ).toBe(false)
  })
})
