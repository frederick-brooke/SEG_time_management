import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import MapView from "../MapView";
import { useFriends } from "@/lib/map";

jest.mock("@/components/ui/Button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

jest.mock("@/components/map/CombinedMap", () => ({
	__esModule: true,
	CombinedMap: (props: any) => (
		<div data-testid="real-imported-combined-map">
			<div>Imported CombinedMap</div>
			<div>friends:{JSON.stringify(props.friends)}</div>
			<div>events:{JSON.stringify(props.events)}</div>
			<div>userLocation:{JSON.stringify(props.userLocation)}</div>
			<div>defaultMode:{String(props.defaultMode)}</div>
		</div>
	),
}));

jest.mock("next/dynamic", () => {
	return (importer: any, options: any) => {
		let ImportedComponent: any = null;

		// THIS is the important bit.
		// It executes the dynamic import function, so line 53 gets covered.
		importer().then((mod: any) => {
			ImportedComponent = mod.default ?? mod;
		});

		const MockDynamicComponent = (props: any) => {
			if (ImportedComponent) {
				return <ImportedComponent {...props} />;
			}

			return options?.loading ? (
				<div data-testid="dynamic-loading">{options.loading()}</div>
			) : null;
		};

		return MockDynamicComponent;
	};
});

jest.mock("@/lib/map", () => ({
	useFriends: jest.fn(),
}));

const mockedUseFriends = useFriends as jest.Mock;

describe("MapView", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("shows friends loading placeholder when loading and defaultMode is friends", () => {
		mockedUseFriends.mockReturnValue({
			friends: [],
			error: null,
			loading: true,
		});

		render(
			<MapView
				events={[]}
				userLocation={{ lat: 1, lng: 2 }}
				defaultMode="friends"
			/>,
		);

		expect(screen.getByText("Loading friends...")).toBeInTheDocument();
		expect(
			screen.queryByTestId("real-imported-combined-map"),
		).not.toBeInTheDocument();
	});

	it("renders imported CombinedMap after dynamic importer resolves", async () => {
		mockedUseFriends.mockReturnValue({
			friends: [{ id: "f1", name: "Alice" }],
			error: null,
			loading: false,
		});

		render(
			<MapView
				events={[{ id: "e1", title: "Lecture" } as any]}
				userLocation={{ lat: 10, lng: 20 }}
				defaultMode="friends"
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByTestId("real-imported-combined-map"),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/friends:/)).toHaveTextContent(
			'friends:[{"id":"f1","name":"Alice"}]',
		);
		expect(screen.getByText(/events:/)).toHaveTextContent(
			'events:[{"id":"e1","title":"Lecture"}]',
		);
		expect(screen.getByText(/userLocation:/)).toHaveTextContent(
			'userLocation:{"lat":10,"lng":20}',
		);
		expect(screen.getByText(/defaultMode:/)).toHaveTextContent(
			"defaultMode:friends",
		);
	});

	it("renders error banner when there is an error", async () => {
		mockedUseFriends.mockReturnValue({
			friends: [],
			error: "Failed to load friends",
			loading: false,
		});

		render(<MapView events={[]} defaultMode="events" />);

		expect(screen.getByText("Failed to load friends")).toBeInTheDocument();

		await waitFor(() => {
			expect(
				screen.getByTestId("real-imported-combined-map"),
			).toBeInTheDocument();
		});
	});

	it("renders map without error banner when there is no error", async () => {
		mockedUseFriends.mockReturnValue({
			friends: [],
			error: null,
			loading: false,
		});

		render(<MapView events={[]} defaultMode="events" />);

		expect(
			screen.queryByText("Failed to load friends"),
		).not.toBeInTheDocument();

		await waitFor(() => {
			expect(
				screen.getByTestId("real-imported-combined-map"),
			).toBeInTheDocument();
		});
	});

	it("passes undefined userLocation and defaultMode when omitted", async () => {
		mockedUseFriends.mockReturnValue({
			friends: [{ id: "f2", name: "Bob" }],
			error: null,
			loading: false,
		});

		render(<MapView events={[{ id: "e2" } as any]} />);

		await waitFor(() => {
			expect(
				screen.getByTestId("real-imported-combined-map"),
			).toBeInTheDocument();
		});

		expect(screen.getByText(/friends:/)).toHaveTextContent(
			'friends:[{"id":"f2","name":"Bob"}]',
		);
		expect(screen.getByText(/events:/)).toHaveTextContent(
			'events:[{"id":"e2"}]',
		);
		expect(screen.getByText(/userLocation:/)).toHaveTextContent(
			"userLocation:",
		);
		expect(screen.getByText(/defaultMode:/)).toHaveTextContent(
			"defaultMode:undefined",
		);
	});
});
