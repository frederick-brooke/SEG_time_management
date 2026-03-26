import { render, screen } from "@testing-library/react";
import RootLayout from "./layout";

// 1. Mock Next.js fonts to prevent module resolution errors
jest.mock("next/font/google", () => ({
  Geist: jest.fn().mockReturnValue({ variable: "mock-geist-sans" }),
  Geist_Mono: jest.fn().mockReturnValue({ variable: "mock-geist-mono" }),
}));

// 2. Mock Context Providers
jest.mock("./providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-providers">{children}</div>
  ),
}));

jest.mock("@/context/UIContext", () => ({
  UIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-ui-provider">{children}</div>
  ),
}));

describe("RootLayout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies the correct attributes and font variables to the html and body tags", () => {
    // Call the layout as a pure function. This gives us the React Element tree
    // without actually mounting it to the strict JSDOM window.
    const layoutElement = RootLayout({ children: <div>Test</div> });

    // Assert on the <html> element
    expect(layoutElement.type).toBe("html");
    expect(layoutElement.props.lang).toBe("en");
    expect(layoutElement.props.className).toContain("mock-geist-sans");
    expect(layoutElement.props.className).toContain("mock-geist-mono");

    // Assert on the <body> element (which is the direct child of html)
    const bodyElement = layoutElement.props.children;
    expect(bodyElement.type).toBe("body");
    expect(bodyElement.props.className).toContain("antialiased");
    expect(bodyElement.props.suppressHydrationWarning).toBe(true);
  });

  it("renders children and modal-root successfully within the context providers", () => {
    // Extract the inner content (everything inside the <body>)
    const layoutElement = RootLayout({
      children: <div data-testid="child-element">Hello World</div>,
    });
    
    // layoutElement.props.children = <body>
    // layoutElement.props.children.props.children = <Providers>...
    const innerContent = layoutElement.props.children.props.children;

    // Now we can safely render just the inner content using RTL
    const { container } = render(innerContent);

    // Verify the child content rendered
    expect(screen.getByTestId("child-element")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();

    // Verify the providers wrapped the content
    expect(screen.getByTestId("mock-providers")).toBeInTheDocument();
    expect(screen.getByTestId("mock-ui-provider")).toBeInTheDocument();

    // Verify the modal-root div for React Portals exists
    const modalRoot = container.querySelector("#modal-root");
    expect(modalRoot).toBeInTheDocument();
  });
});