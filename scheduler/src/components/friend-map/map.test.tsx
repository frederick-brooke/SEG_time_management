import React from "react";
import { render, screen } from "@testing-library/react";
import { FriendMap } from "./map";

/**
 * Mock next/dynamic to avoid actually loading the heavy map component.
 * Ensures tests run quickly and do not depend on browser APIs.
 */
jest.mock("next/dynamic", () => {
  return (_loader: () => Promise<unknown>, _options: unknown) => {
    // Return a dummy component that is easily testable
    const Dummy = (_props: any) => (
      <div data-testid="dynamic-friend-map" />
    );
    return Dummy;
  };
});

describe("FriendMap dynamic wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks to avoid leakage between tests
  });

  it("renders without crashing", () => {
    // Render with an empty friends array
    render(<FriendMap friends={[]} />);
    expect(screen.getByTestId("dynamic-friend-map")).toBeInTheDocument();
  });

  it("renders with a populated friends array", () => {
    // Render with one or more friends
    const friends = [
      {
        id: "friend-1",
        username: "friend1",
        name: "Friend One",
        city: "CityA",
        country: "CountryA",
        location: { lat: 10, lng: 20 },
        pfp: "friend1.png",
      },
    ];
    render(<FriendMap friends={friends} />);
    expect(screen.getByTestId("dynamic-friend-map")).toBeInTheDocument();
  });
});