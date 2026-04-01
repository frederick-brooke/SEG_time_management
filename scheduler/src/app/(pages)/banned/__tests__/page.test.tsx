/**
 * Testing for banned page.
 */

import { render, screen } from "@testing-library/react";
import Page from "../page";

//  Mocks 

jest.mock("@/components/admin/BanMessagePage", () => ({
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