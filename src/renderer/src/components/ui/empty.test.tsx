import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty"

describe("Empty", () => {
  it("renders empty state structure with slots", () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No results</EmptyTitle>
          <EmptyDescription>Try adjusting your filters.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>Secondary action</EmptyContent>
      </Empty>
    )

    expect(screen.getByText("No results").closest("[data-slot='empty-title']")).toBeTruthy()
    expect(
      screen.getByText("Try adjusting your filters.").closest("[data-slot='empty-description']")
    ).toBeTruthy()
    expect(screen.getByText("Secondary action").closest("[data-slot='empty-content']")).toBeTruthy()
  })

  it("applies variant styles to media slots", () => {
    render(<EmptyMedia variant="icon">Icon</EmptyMedia>)

    const media = screen.getByText("Icon")
    expect(media).toHaveAttribute("data-variant", "icon")
    expect(media.className).toContain("bg-muted")
  })
})
