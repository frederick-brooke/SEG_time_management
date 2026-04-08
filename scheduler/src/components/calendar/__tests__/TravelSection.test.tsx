import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TravelSection from "../TravelSection";
import { useSavedLocations } from "hooks/useSavedLocations";
import { useLocationSearch } from "@/lib/map";

jest.mock("hooks/useSavedLocations", () => ({
	useSavedLocations: jest.fn(),
}));

jest.mock("@/lib/map", () => ({
	useLocationSearch: jest.fn(),
}));

jest.mock("../../ui/Button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

jest.mock("../../ui/Select", () => ({
	Select: (props: any) => <div data-testid="mock-select" {...props} />,
}));

jest.mock("../LocationInput", () => {
	return function MockLocationInput(props: any) {
		return (
			<div data-testid={`location-input-${props.label}`}>
				<div>{props.label}</div>
				<div>{props.value}</div>

				<button onClick={() => props.onSearchChange("new search text")}>
					search change {props.label}
				</button>

				<button
					onClick={() =>
						props.onSelectSuggestion({
							geometry: { coordinates: ["-0.12", "51.50"] },
							properties: {
								name: `${props.label} Place`,
								display: `${props.label} Display`,
							},
						})
					}
				>
					select suggestion {props.label}
				</button>

				<button
					onClick={() =>
						props.onSelectSuggestion({
							geometry: { coordinates: ["-1.5", "52.2"] },
							properties: {
								name: `${props.label} Name Only`,
							},
						})
					}
				>
					select suggestion no display {props.label}
				</button>

				<button
					onClick={() =>
						props.onSelectSuggestion({
							properties: { name: "Broken" },
						})
					}
				>
					select invalid suggestion {props.label}
				</button>

				<button
					onClick={() =>
						props.onSelectSaved({
							label: `${props.label} Saved`,
							lat: 1,
							lng: 2,
							address: `${props.label} Saved Address`,
						})
					}
				>
					select saved {props.label}
				</button>

				<button onClick={props.onOpenSaveModal}>
					open save {props.label}
				</button>

				<button onClick={props.onCloseSaveModal}>
					close save {props.label}
				</button>

				<button
					onClick={() =>
						props.onSaveLocation(`${props.label} Label`, "HOME")
					}
				>
					save location {props.label}
				</button>

				{props.showCurrentLocation && (
					<button onClick={props.onUseCurrentLocation}>
						use current location
					</button>
				)}

				<div>
					showSaveModal:{String(props.showSaveModal)} pending:
					{props.pending ? props.pending.address : "none"}
				</div>
				<div>suggestions:{props.suggestions?.length ?? 0}</div>
				<div>locations:{props.locations?.length ?? 0}</div>
			</div>
		);
	};
});

const mockedUseSavedLocations = useSavedLocations as jest.Mock;
const mockedUseLocationSearch = useLocationSearch as jest.Mock;

describe("TravelSection", () => {
	const onStartCoordsChange = jest.fn();
	const onDestCoordsChange = jest.fn();
	const onStartNameChange = jest.fn();
	const onDestNameChange = jest.fn();
	const onTransportModeChange = jest.fn();
	const onTravelTimeModeChange = jest.fn();
	const onManualTravelTimeChange = jest.fn();

	const saveLocation = jest.fn();
	const refresh = jest.fn();

	const startHandleLocationSearch = jest.fn();
	const destHandleLocationSearch = jest.fn();

	const startSearchMock = {
		suggestions: [{ id: "s1" }],
		handleLocationSearch: startHandleLocationSearch,
	};

	const destSearchMock = {
		suggestions: [{ id: "s2" }],
		handleLocationSearch: destHandleLocationSearch,
	};

	const baseProps = {
		startLocationName: "",
		destLocationName: "",
		transportMode: "walking" as const,
		travelPreview: null,
		isCalculating: false,
		onStartCoordsChange,
		onDestCoordsChange,
		onStartNameChange,
		onDestNameChange,
		onTransportModeChange,
		travelTimeMode: "auto" as const,
		manualTravelTime: null,
		onTravelTimeModeChange,
		onManualTravelTimeChange,
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockedUseSavedLocations.mockReturnValue({
			locations: [
				{ id: "1", label: "Home", lat: 1, lng: 2, address: "Addr" },
			],
			saveLocation,
			refresh,
		});

		let callCount = 0;
		mockedUseLocationSearch.mockImplementation(() => {
			callCount += 1;
			return callCount % 2 === 1 ? startSearchMock : destSearchMock;
		});

		(global as any).alert = jest.fn();

		Object.defineProperty(global.navigator, "geolocation", {
			value: {
				getCurrentPosition: jest.fn(),
			},
			configurable: true,
		});
	});

	it("renders auto mode fields", () => {
		render(<TravelSection {...baseProps} />);

		expect(screen.getByText("Travel Time")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /auto-calculate/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /enter manually/i }),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("location-input-Starting Point"),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("location-input-Destination"),
		).toBeInTheDocument();
		expect(screen.getByText("Mode of Transport")).toBeInTheDocument();
	});

	it("renders manual mode input and hides auto fields", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={25}
			/>,
		);

		expect(screen.getByPlaceholderText("e.g. 25")).toBeInTheDocument();
		expect(screen.getByText("minutes")).toBeInTheDocument();
		expect(
			screen.queryByTestId("location-input-Starting Point"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("location-input-Destination"),
		).not.toBeInTheDocument();
		expect(screen.getByText("25 mins")).toBeInTheDocument();
	});

	it("formats one minute correctly", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={1}
			/>,
		);

		expect(screen.getByText("1 min")).toBeInTheDocument();
	});

	it("formats exact hour correctly", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={60}
			/>,
		);

		expect(screen.getByText("1h")).toBeInTheDocument();
	});

	it("formats hour and minutes correctly", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={61}
			/>,
		);

		expect(screen.getByText("1h 1m")).toBeInTheDocument();
	});

	it("does not show manual badge for zero", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={0}
			/>,
		);

		expect(screen.queryByText("0 mins")).not.toBeInTheDocument();
	});

	it("calls onTravelTimeModeChange for both toggle buttons", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: /auto-calculate/i }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: /enter manually/i }),
		);

		expect(onTravelTimeModeChange).toHaveBeenCalledWith("auto");
		expect(onTravelTimeModeChange).toHaveBeenCalledWith("manual");
	});

	it("parses manual travel time", () => {
		render(<TravelSection {...baseProps} travelTimeMode="manual" />);

		fireEvent.change(screen.getByPlaceholderText("e.g. 25"), {
			target: { value: "42" },
		});

		expect(onManualTravelTimeChange).toHaveBeenCalledWith(42);
	});

	it("passes null when manual time input is cleared", () => {
		render(
			<TravelSection
				{...baseProps}
				travelTimeMode="manual"
				manualTravelTime={15}
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText("e.g. 25"), {
			target: { value: "" },
		});

		expect(onManualTravelTimeChange).toHaveBeenCalledWith(null);
	});

	it("clamps negative manual time to zero", () => {
		render(<TravelSection {...baseProps} travelTimeMode="manual" />);

		fireEvent.change(screen.getByPlaceholderText("e.g. 25"), {
			target: { value: "-5" },
		});

		expect(onManualTravelTimeChange).toHaveBeenCalledWith(0);
	});

	it("handles start and destination search changes", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /search change Starting Point/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: /search change Destination/i }),
		);

		expect(onStartNameChange).toHaveBeenCalledWith("new search text");
		expect(startHandleLocationSearch).toHaveBeenCalledWith(
			"new search text",
		);
		expect(onDestNameChange).toHaveBeenCalledWith("new search text");
		expect(destHandleLocationSearch).toHaveBeenCalledWith(
			"new search text",
		);
	});

	it("selects a start suggestion and clears the start search", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select suggestion Starting Point/i,
			}),
		);

		expect(onStartNameChange).toHaveBeenCalledWith("Starting Point Place");
		expect(onStartCoordsChange).toHaveBeenCalledWith({
			lat: 51.5,
			lng: -0.12,
		});
		expect(startHandleLocationSearch).toHaveBeenCalledWith("");
		expect(
			screen.getByText(/pending:Starting Point Display/),
		).toBeInTheDocument();
	});

	it("selects a destination suggestion and clears the destination search", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select suggestion Destination/i,
			}),
		);

		expect(onDestNameChange).toHaveBeenCalledWith("Destination Place");
		expect(onDestCoordsChange).toHaveBeenCalledWith({
			lat: 51.5,
			lng: -0.12,
		});
		expect(destHandleLocationSearch).toHaveBeenCalledWith("");
		expect(
			screen.getByText(/pending:Destination Display/),
		).toBeInTheDocument();
	});

	it("falls back to name when display is missing", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select suggestion no display Starting Point/i,
			}),
		);

		expect(onStartNameChange).toHaveBeenCalledWith(
			"Starting Point Name Only",
		);
		expect(onStartCoordsChange).toHaveBeenCalledWith({
			lat: 52.2,
			lng: -1.5,
		});
		expect(
			screen.getByText(/pending:Starting Point Name Only/),
		).toBeInTheDocument();
	});

	it("ignores invalid suggestions without coordinates", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select invalid suggestion Starting Point/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: /select invalid suggestion Destination/i,
			}),
		);

		expect(onStartCoordsChange).not.toHaveBeenCalled();
		expect(onDestCoordsChange).not.toHaveBeenCalled();
	});

	it("selects saved start and destination locations", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select saved Starting Point/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: /select saved Destination/i }),
		);

		expect(onStartNameChange).toHaveBeenCalledWith("Starting Point Saved");
		expect(onStartCoordsChange).toHaveBeenCalledWith({ lat: 1, lng: 2 });
		expect(onDestNameChange).toHaveBeenCalledWith("Destination Saved");
		expect(onDestCoordsChange).toHaveBeenCalledWith({ lat: 1, lng: 2 });

		expect(
			screen.getByText(/pending:Starting Point Saved Address/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/pending:Destination Saved Address/),
		).toBeInTheDocument();
	});

	it("opens and closes the save modal", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: /open save Starting Point/i }),
		);
		expect(
			screen.getByText(/showSaveModal:true pending:none/),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /close save Starting Point/i }),
		);
		expect(
			screen.queryByText(/showSaveModal:true pending:none/),
		).not.toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /open save Destination/i }),
		);
		expect(
			screen.getByText(/showSaveModal:true pending:none/),
		).toBeInTheDocument();
	});

	it("saves a pending start location and refreshes", async () => {
		saveLocation.mockResolvedValue(undefined);
		refresh.mockResolvedValue(undefined);

		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select suggestion Starting Point/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: /save location Starting Point/i,
			}),
		);

		await waitFor(() => {
			expect(saveLocation).toHaveBeenCalledWith({
				label: "Starting Point Label",
				address: "Starting Point Display",
				lat: 51.5,
				lng: -0.12,
				type: "HOME",
			});
			expect(refresh).toHaveBeenCalled();
		});
	});

	it("saves a pending destination location and refreshes", async () => {
		saveLocation.mockResolvedValue(undefined);
		refresh.mockResolvedValue(undefined);

		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /select suggestion Destination/i,
			}),
		);
		fireEvent.click(
			screen.getByRole("button", { name: /save location Destination/i }),
		);

		await waitFor(() => {
			expect(saveLocation).toHaveBeenCalledWith({
				label: "Destination Label",
				address: "Destination Display",
				lat: 51.5,
				lng: -0.12,
				type: "HOME",
			});
			expect(refresh).toHaveBeenCalled();
		});
	});

	it("does nothing when saving without a pending location", async () => {
		saveLocation.mockResolvedValue(undefined);
		refresh.mockResolvedValue(undefined);

		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", {
				name: /save location Starting Point/i,
			}),
		);

		await waitFor(() => {
			expect(saveLocation).not.toHaveBeenCalled();
			expect(refresh).not.toHaveBeenCalled();
		});
	});

	it("uses the browser current location when available", () => {
		const getCurrentPosition = jest.fn((cb) =>
			cb({ coords: { latitude: 12.34, longitude: 56.78 } }),
		);

		Object.defineProperty(global.navigator, "geolocation", {
			value: { getCurrentPosition },
			configurable: true,
		});

		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: /use current location/i }),
		);

		expect(getCurrentPosition).toHaveBeenCalled();
		expect(onStartCoordsChange).toHaveBeenCalledWith({
			lat: 12.34,
			lng: 56.78,
		});
		expect(onStartNameChange).toHaveBeenCalledWith(
			"📍 My Current Location",
		);
	});

	it("alerts when geolocation is not supported", () => {
		Object.defineProperty(global.navigator, "geolocation", {
			value: undefined,
			configurable: true,
		});

		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: /use current location/i }),
		);

		expect(global.alert).toHaveBeenCalledWith("Geolocation not supported");
	});

	it("changes transport mode", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.change(screen.getByRole("combobox"), {
			target: { value: "driving" },
		});

		expect(onTransportModeChange).toHaveBeenCalledWith("driving");
	});

	it("shows calculating preview", () => {
		render(
			<TravelSection
				{...baseProps}
				travelPreview={35}
				isCalculating={true}
			/>,
		);

		expect(
			screen.getByText("Calculating new route..."),
		).toBeInTheDocument();
	});

	it("shows estimated preview with formatted duration", () => {
		render(
			<TravelSection
				{...baseProps}
				travelPreview={125}
				isCalculating={false}
				transportMode="cycling"
			/>,
		);

		expect(
			screen.getByText(/Estimated cycling time:/i),
		).toBeInTheDocument();
		expect(screen.getByText("2h 5m")).toBeInTheDocument();
	});

	it("does not show preview when travelPreview is null", () => {
		render(<TravelSection {...baseProps} travelPreview={null} />);

		expect(screen.queryByText(/Estimated/i)).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Calculating new route/i),
		).not.toBeInTheDocument();
	});
	it("renders all transport mode options", () => {
		render(<TravelSection {...baseProps} />);

		expect(
			screen.getByRole("option", { name: "Walking" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Cycling" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("option", { name: "Driving" }),
		).toBeInTheDocument();
	});
	it("renders with the current transport mode selected", () => {
		render(<TravelSection {...baseProps} transportMode="cycling" />);
		expect(screen.getByRole("combobox")).toHaveValue("cycling");
	});
	it("closes the destination save modal", () => {
		render(<TravelSection {...baseProps} />);

		fireEvent.click(
			screen.getByRole("button", { name: /open save Destination/i }),
		);
		expect(
			screen.getByText(/showSaveModal:true pending:none/),
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole("button", { name: /close save Destination/i }),
		);

		expect(
			screen.queryByText(/showSaveModal:true pending:none/),
		).not.toBeInTheDocument();
	});
});
