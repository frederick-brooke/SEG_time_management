import { render, screen, fireEvent } from "@testing-library/react";
import SearchNavItem from "../search-nav-item";

// Mock next/router
const push = jest.fn();

jest.mock("next/router", () => ({
  useRouter: () => ({
    push,
  }),
}));

// Mock icon (not relevant to behavior)
jest.mock("@tabler/icons-react", () => ({
  IconSearch: () => <div />,
}));

describe("SearchNavItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("typing updates input value", () => {
    render(<SearchNavItem />);

    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "hello" } });

    expect(input.value).toBe("hello");
  });

  test("submitting empty query does not navigate", () => {
    render(<SearchNavItem />);

    const form = screen.getByRole("textbox").closest("form")!;

    fireEvent.submit(form);

    expect(push).not.toHaveBeenCalled();
  });

  test("submitting valid query navigates with encoded url", () => {
    render(<SearchNavItem />);

    const input = screen.getByPlaceholderText("Search...");
    const form = input.closest("form")!;

    fireEvent.change(input, { target: { value: "hello world" } });
    fireEvent.submit(form);

    expect(push).toHaveBeenCalledWith(
      "/search?query=hello%20world"
    );
  });
});