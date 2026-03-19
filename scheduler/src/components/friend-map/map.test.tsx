import React from "react";
import { render, screen } from "@testing-library/react";
import { FriendMap } from "./map";

jest.mock("next/dynamic", () => {
  return (_loader: () => Promise<unknown>, _options: unknown) => {
    const Dummy = (_props: any) => (
      <div data-testid="dynamic-friend-map" />
    );
    return Dummy;
  };
});

describe("FriendMap dynamic wrapper", () => {
  it("renders without crashing", () => {
    render(<FriendMap friends={[]} />);
    expect(screen.getByTestId("dynamic-friend-map")).toBeInTheDocument();
  });

  it("renders with a populated friends array", () => {
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
