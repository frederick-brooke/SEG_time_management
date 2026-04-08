import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CombinedMap } from "../CombinedMap";
import { useSavedLocations } from "hooks/useSavedLocations";
import { useGeolocation } from "@/lib/map";

jest.mock("next/dynamic", () => {
	let dynamicCall = 0;

	return (importer: any) => {
		dynamicCall += 1;

		// Important: call importer so Istanbul counts the dynamic(...) lines
		try {
			importer();
		} catch {
			// ignore async/module resolution issues in tests
		}

		if (dynamicCall === 1) {
			return function MockBaseMap({ center, zoom, children }: any) {
				return (
					<div data-testid="base-map">
						<div data-testid="map-center">
							{JSON.stringify(center)}
						</div>
						<div data-testid="map-zoom">{zoom}</div>
						{children}
					</div>
				);
			};
		}

		if (dynamicCall === 2) {
			return function MockFriendLayer({ friends, userLocation }: any) {
				return (
					<div data-testid="friend-layer">
						friends:{friends.length} user:
						{userLocation
							? `${userLocation.lat},${userLocation.lng}`
							: "none"}
					</div>
				);
			};
		}

		if (dynamicCall === 3) {
			return function MockUnifiedMapLayer({
				events,
				savedLocations,
			}: any) {
				return (
					<div data-testid="unified-map-layer">
						events:{events.length} saved:{savedLocations.length}
					</div>
				);
			};
		}

		return function UnknownDynamicComponent() {
			return <div data-testid="unknown-dynamic" />;
		};
	};
});

jest.mock("../MapToggle", () => ({
	MapToggle: ({ mode, onChange, friendCount, eventCount }: any) => (
		<div data-testid="map-toggle">
			<div>mode:{mode}</div>
			<div>friends:{friendCount}</div>
			<div>events:{eventCount}</div>
			<button onClick={() => onChange("friends")}>switch friends</button>
			<button onClick={() => onChange("events")}>switch events</button>
		</div>
	),
}));

jest.mock("hooks/useSavedLocations", () => ({
	useSavedLocations: jest.fn(),
}));

jest.mock("@/lib/map", () => ({
	CATEGORY_COLORS: {
		Study: "#111111",
		Fitness: "#222222",
		Social: "#333333",
	},
	TRANSPORT_ICONS: {
		walking: "🚶",
		cycling: "🚴",
		driving: "🚗",
	},
	calcCenter: jest.fn((points: [number, number][]) => {
		if (!points.length) return [51.5, -0.12];
		const lat =
			points.reduce((sum, [pLat]) => sum + pLat, 0) / points.length;
		const lng =
			points.reduce((sum, [, pLng]) => sum + pLng, 0) / points.length;
		return [lat, lng];
	}),
	formatDate: jest.fn((value: string) => `formatted:${value}`),
	useGeolocation: jest.fn(),
}));

const mockedUseSavedLocations = useSavedLocations as jest.Mock;
const mockedUseGeolocation = useGeolocation as jest.Mock;

describe("CombinedMap", () => {
	const friends = [
		{
			id: "f1",
			name: "A",
			username: "user_a",
			location: { lat: 10, lng: 20 },
		},
		{
			id: "f2",
			name: "B",
			username: "user_b",
			location: { lat: 30, lng: 40 },
		},
		{
			id: "f3",
			name: "C",
			username: "user_c",
			location: null,
		},
	];

	const events = [
		{
			id: "e1",
			title: "Library",
			category: "Study",
			start: "2026-04-06T09:00:00Z",
			end: "2026-04-06T11:00:00Z",
			startCoords: { lat: 1, lng: 2 },
			destinationCoords: { lat: 3, lng: 4 },
			startLocationName: "Home",
			destLocationName: "Library",
			transportMode: "walking",
			travelDuration: 25,
		},
		{
			id: "e2",
			title: "Gym",
			category: "Fitness",
			start: "2026-04-06T12:00:00Z",
			end: "2026-04-06T13:00:00Z",
			startCoords: null,
			destinationCoords: { lat: 5, lng: 6 },
			startLocationName: "",
			destLocationName: "Gym",
			transportMode: "cycling",
			travelDuration: 15,
		},
		{
			id: "e3",
			title: "Coffee",
			category: "Unknown",
			start: "2026-04-06T15:00:00Z",
			end: "2026-04-06T16:00:00Z",
			startCoords: null,
			destinationCoords: null,
			startLocationName: "",
			destLocationName: "",
			transportMode: "",
			travelDuration: null,
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();

		mockedUseSavedLocations.mockReturnValue({
			locations: [
				{
					id: "1",
					label: "Home",
					lat: 1,
					lng: 1,
					address: "Home addr",
					type: "HOME",
				},
				{
					id: "2",
					label: "Work",
					lat: 2,
					lng: 2,
					address: "Work addr",
					type: "WORK",
				},
				{
					id: "3",
					label: "Fav",
					lat: 3,
					lng: 3,
					address: "Fav addr",
					type: "FAVOURITE",
				},
			],
		});

		mockedUseGeolocation.mockReturnValue({
			userLocation: [51.501, -0.141],
			locationError: "",
			loading: false,
		});
	});

	it("shows loading placeholder when no provided location and geolocation is loading", () => {
		mockedUseGeolocation.mockReturnValue({
			userLocation: null,
			locationError: "",
			loading: true,
		});

		render(<CombinedMap friends={friends} events={events} />);

		expect(screen.getByText("Getting your location…")).toBeInTheDocument();
		expect(screen.queryByTestId("base-map")).not.toBeInTheDocument();
	});

	it("renders in default events mode with legend, event layer, and event cards", () => {
		render(<CombinedMap friends={friends} events={events} />);

		expect(screen.getByTestId("map-toggle")).toBeInTheDocument();
		expect(screen.getByText("mode:events")).toBeInTheDocument();

		expect(screen.getByText("Study")).toBeInTheDocument();
		expect(screen.getByText("Fitness")).toBeInTheDocument();
		expect(screen.getByText("Social")).toBeInTheDocument();
		expect(screen.getByText("Route")).toBeInTheDocument();

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("Work")).toBeInTheDocument();
		expect(screen.getByText("Saved")).toBeInTheDocument();

		expect(screen.getByTestId("base-map")).toBeInTheDocument();
		expect(screen.getByTestId("unified-map-layer")).toHaveTextContent(
			"events:3",
		);
		expect(screen.getByTestId("unified-map-layer")).toHaveTextContent(
			"saved:3",
		);

		expect(screen.getByText("Library")).toBeInTheDocument();
		expect(screen.getByText("Gym")).toBeInTheDocument();
		expect(screen.getByText("Coffee")).toBeInTheDocument();

		expect(
			screen.getByText("formatted:2026-04-06T09:00:00Z"),
		).toBeInTheDocument();
		expect(screen.getByText("🔵 Home")).toBeInTheDocument();
		expect(screen.getByText("🔴 Library")).toBeInTheDocument();
		expect(screen.getByText("🚶 25 mins")).toBeInTheDocument();
		expect(screen.getByText("🚴 15 mins")).toBeInTheDocument();
	});

	it("uses provided user location instead of geolocation hook", () => {
		render(
			<CombinedMap
				friends={friends}
				events={events}
				userLocation={{ lat: 99, lng: 88 }}
				defaultMode="friends"
			/>,
		);

		expect(screen.getByTestId("friend-layer")).toHaveTextContent(
			"user:99,88",
		);
	});

	it("shows location error banner only when using geolocation flow", () => {
		mockedUseGeolocation.mockReturnValue({
			userLocation: [51.501, -0.141],
			locationError: "Location denied",
			loading: false,
		});

		const { rerender } = render(
			<CombinedMap friends={friends} events={events} />,
		);

		expect(
			screen.getByText("Location denied — using default location"),
		).toBeInTheDocument();

		rerender(
			<CombinedMap
				friends={friends}
				events={events}
				userLocation={{ lat: 7, lng: 8 }}
			/>,
		);

		expect(
			screen.queryByText("Location denied — using default location"),
		).not.toBeInTheDocument();
	});

	it("switches to friends mode and renders friend layer with correct zoom", () => {
		render(<CombinedMap friends={friends} events={events} />);

		fireEvent.click(screen.getByRole("button", { name: "switch friends" }));

		expect(screen.getByText("mode:friends")).toBeInTheDocument();
		expect(screen.getByTestId("friend-layer")).toBeInTheDocument();
		expect(
			screen.queryByTestId("unified-map-layer"),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Route")).not.toBeInTheDocument();
		expect(screen.queryByText("Library")).not.toBeInTheDocument();
		expect(screen.getByTestId("map-zoom")).toHaveTextContent("2");
	});

	it("switches back to events mode", () => {
		render(
			<CombinedMap
				friends={friends}
				events={events}
				defaultMode="friends"
			/>,
		);

		expect(screen.getByText("mode:friends")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "switch events" }));

		expect(screen.getByText("mode:events")).toBeInTheDocument();
		expect(screen.getByTestId("unified-map-layer")).toBeInTheDocument();
		expect(screen.getByTestId("map-zoom")).toHaveTextContent("12");
	});

	it("renders no saved-location legend items when there are no saved locations", () => {
		mockedUseSavedLocations.mockReturnValue({
			locations: [],
		});

		render(<CombinedMap friends={friends} events={events} />);

		expect(screen.queryByText("Home")).not.toBeInTheDocument();
		expect(screen.queryByText("Work")).not.toBeInTheDocument();
		expect(screen.queryByText("Saved")).not.toBeInTheDocument();
		expect(screen.getByText("Route")).toBeInTheDocument();
	});

	it("renders only the saved-location legend items that exist", () => {
		mockedUseSavedLocations.mockReturnValue({
			locations: [
				{
					id: "1",
					label: "Home",
					lat: 1,
					lng: 1,
					address: "Home addr",
					type: "HOME",
				},
				{
					id: "2",
					label: "Fav",
					lat: 3,
					lng: 3,
					address: "Fav addr",
					type: "FAVOURITE",
				},
			],
		});

		render(<CombinedMap friends={friends} events={events} />);

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.queryByText("Work")).not.toBeInTheDocument();
		expect(screen.getByText("Saved")).toBeInTheDocument();
	});

	it("handles events with fallback category color and fallback transport icon", () => {
		render(<CombinedMap friends={friends} events={events} />);

		expect(screen.getByText("Coffee")).toBeInTheDocument();
		expect(screen.queryByText("⏱️ null mins")).not.toBeInTheDocument();
	});

	it("computes friends center using friend locations plus geolocated user", () => {
		render(
			<CombinedMap
				friends={friends}
				events={events}
				defaultMode="friends"
			/>,
		);

		const center = JSON.parse(
			screen.getByTestId("map-center").textContent || "[]",
		);
		expect(center[0]).toBeCloseTo((51.501 + 10 + 30) / 3);
		expect(center[1]).toBeCloseTo((-0.141 + 20 + 40) / 3);
	});

	it("computes events center from available start and destination coordinates", () => {
		render(<CombinedMap friends={friends} events={events} />);

		const center = JSON.parse(
			screen.getByTestId("map-center").textContent || "[]",
		);
		expect(center[0]).toBeCloseTo((1 + 3 + 5) / 3);
		expect(center[1]).toBeCloseTo((2 + 4 + 6) / 3);
	});

	it("handles empty friends and empty events", () => {
		mockedUseSavedLocations.mockReturnValue({ locations: [] });
		mockedUseGeolocation.mockReturnValue({
			userLocation: null,
			locationError: "",
			loading: false,
		});

		render(<CombinedMap friends={[]} events={[]} defaultMode="friends" />);

		expect(screen.getByTestId("friend-layer")).toHaveTextContent(
			"friends:0",
		);
		const center = JSON.parse(
			screen.getByTestId("map-center").textContent || "[]",
		);
		expect(center).toEqual([51.5, -0.12]);
	});
});
