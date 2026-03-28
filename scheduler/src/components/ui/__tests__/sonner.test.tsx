import * as React from "react"
import { render } from "@testing-library/react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { Toaster } from "../sonner" 

// 1. Mock the next-themes hook
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}))

// 2. Mock the external Sonner package to inspect the props it receives
jest.mock("sonner", () => ({
  Toaster: jest.fn(() => <div data-testid="mock-sonner" />),
}))

describe("Sonner Wrapper Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("passes 'light' theme to Sonner when next-themes resolves to 'light'", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster />)
    
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "light" }),
      undefined
    )
  })

  it("passes 'dark' theme to Sonner when next-themes resolves to 'dark'", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "dark" })
    render(<Toaster />)
    
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "dark" }),
      undefined
    )
  })

  it("falls back to 'system' theme when next-themes resolves to an unknown theme", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "cupcake" })
    render(<Toaster />)
    
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "system" }),
      undefined
    )
  })

  it("forwards additional props to the underlying Sonner component", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster position="top-right" expand={true} duration={5000} />)
    
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({
        position: "top-right",
        expand: true,
        duration: 5000,
      }),
      undefined
    )
  })

  it("applies the custom CSS variables for styling", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster />)
    
    expect(Sonner).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius", 
        },
      }),
      undefined
    )
  })

  it("injects custom icons for different toast states", () => {
    (useTheme as jest.Mock).mockReturnValue({ theme: "light" })
    render(<Toaster />)

    const mockedSonner = jest.mocked(Sonner)
    const passedProps = mockedSonner.mock.calls[0][0]
    
    expect(passedProps.icons).toHaveProperty("success")
    expect(passedProps.icons).toHaveProperty("error")
    expect(passedProps.icons).toHaveProperty("warning")
    expect(passedProps.icons).toHaveProperty("info")
    expect(passedProps.icons).toHaveProperty("loading")
  })
})