import React from "react";
import { render } from "@testing-library/react";
import { FriendMap } from "./map";

// Mock next/dynamic to immediately return a simple component
jest.mock("next/dynamic", () => {
  return (loader: () => Promise<unknown>, _options: unknown) => {
    const Dummy = (props: any) => (
      <div data-testid="dynamic-friend-map">{JSON.stringify(props)}</div>
    );
    // expose the loader so it can be inspected if needed
    // @ts-ignore
    Dummy.preload = loader;
    return Dummy;
  };
});

describe("FriendMap dynamic wrapper", () => {
  it("renders the dynamic FriendMap component with friends prop", () => {
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

    const { getByTestId } = render(<FriendMap friends={friends} />);

    expect(getByTestId("dynamic-friend-map")).toBeInTheDocument();
  });
});

