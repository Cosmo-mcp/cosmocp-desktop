import { describe, expect, it, vi } from "vitest"
import type { ModelProviderCreateInput, ProviderWithModels } from "core/dto"
import type { ModelProviderService } from "core/services/ModelProviderService"
import { ModelProviderTypeEnum } from "core/database/schema/modelProviderSchema"
import { ModelProviderController } from "./ModelProviderController"

describe("ModelProviderController", () => {
  it("delegates provider creation to the service", async () => {
    const service = {
      addProvider: vi.fn().mockResolvedValue({ id: "provider-id" } as ProviderWithModels),
    } as unknown as ModelProviderService
    const controller = new ModelProviderController(service)
    const provider: ModelProviderCreateInput = {
      name: "OpenAI",
      apiKey: "secret",
      type: ModelProviderTypeEnum.OPENAI,
      apiUrl: "",
    }

    const result = await controller.addProvider(provider, [])

    expect(service.addProvider).toHaveBeenCalledWith(provider, [])
    expect(result.id).toBe("provider-id")
  })

  it("requests providers without api keys", async () => {
    const service = {
      getProviders: vi.fn().mockResolvedValue([]),
    } as unknown as ModelProviderService
    const controller = new ModelProviderController(service)

    await controller.getProviders()

    expect(service.getProviders).toHaveBeenCalledWith({ withApiKey: false })
  })
})
