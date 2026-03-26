import { render, screen } from "@testing-library/react";
import Page from "./page";

//  Mocks 

/** Mock BannedPage with a recognisable test ID so we can assert it rendered. */
jest.mock("@/components/admin/ban-message-page", () => ({
  __esModule: true,
  default: () => <div data-testid="banned-page" />,
}));

//  Tests 
describe("Page (banned)", () => {
  beforeEach(() => render(<Page />));

  test("renders the BannedPage component", () => {
    expect(screen.getByTestId("banned-page")).toBeInTheDocument();
  });
});