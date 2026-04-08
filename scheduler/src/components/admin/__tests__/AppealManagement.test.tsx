import { render, screen, fireEvent } from "@testing-library/react";
import AppealsManagement from "../AppealManagement";
import { Button } from "@/components/ui/Button";

// Mocks
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const mockAdminListSection = jest.fn();
jest.mock("../AdminListSection", () => (props: any) => {
  mockAdminListSection(props);
  return (
    <div>
      <div data-testid="render-item">
        {props.items.map((item: any, i: number) =>
          props.renderItem(item, i)
        )}
      </div>

      <div data-testid="render-panel">
        {props.renderPanel()}
      </div>

      <Button onClick={props.onFilterOpen}>Open Filter</Button>
    </div>
  );
});

jest.mock("../AdminAppealPanel", () => (props: any) => (
  <div data-testid="appeal-panel">
    Panel for {props.appeal?.id}
    <Button onClick={props.onClose}>Close Panel</Button>
  </div>
));

describe("AppealsManagement", () => {
  const appeals = [
    { id: "A1", user: { email: "a@test.com" }, status: "PENDING" },
    { id: "A2", user: { email: "b@test.com" }, status: "APPROVED" },
  ];

  const baseProps = {
    appeals,
    totalAppeals: 2,
    totalAppealPages: 1,
    currentAppealPage: 1,
    setCurrentAppealPage: jest.fn(),
    selectedAppeal: appeals[0],
    setSelectedAppeal: jest.fn(),
    fetchAppeals: jest.fn(),
    setIsAppealFilterOpen: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    resetFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("passes correct props into AdminListSection", () => {
    render(<AppealsManagement {...baseProps} />);

    expect(mockAdminListSection).toHaveBeenCalled();

    const passedProps = mockAdminListSection.mock.calls[0][0];

    expect(passedProps.title).toBe("Appeals Management");
    expect(passedProps.items).toEqual(appeals);
    expect(passedProps.totalItems).toBe(2);
    expect(passedProps.totalPages).toBe(1);
    expect(passedProps.itemLabel).toBe("appeals");
  });

  test("renderItem displays appeal info and selects appeal on click", () => {
    render(<AppealsManagement {...baseProps} />);

    expect(screen.getByText("Appeal ID: A1")).toBeInTheDocument();
    expect(screen.getByText("User: a@test.com")).toBeInTheDocument();
    expect(screen.getByText("Status: PENDING")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Appeal ID: A1"));

    expect(baseProps.setSelectedAppeal).toHaveBeenCalledWith(appeals[0]);
  });

  test("renderPanel renders AppealPanel with selected appeal", () => {
    render(<AppealsManagement {...baseProps} />);

    expect(screen.getByTestId("appeal-panel")).toHaveTextContent(
      "Panel for A1"
    );
  });

  test("closing panel clears selected appeal", () => {
    render(<AppealsManagement {...baseProps} />);

    fireEvent.click(screen.getByText("Close Panel"));

    expect(baseProps.setSelectedAppeal).toHaveBeenCalledWith(null);
  });

  test("opens filter when onFilterOpen is triggered", () => {
    render(<AppealsManagement {...baseProps} />);

    fireEvent.click(screen.getByText("Open Filter"));

    expect(baseProps.setIsAppealFilterOpen).toHaveBeenCalledWith(true);
  });
});