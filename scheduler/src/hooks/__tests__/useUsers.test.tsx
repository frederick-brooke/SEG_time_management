import { renderHook, waitFor, act } from "@testing-library/react";
import { useUsers } from "@/hooks/useUsers";

//  fetch mock 

const mockFetch = (data: object, ok = true) => {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        json: async () => data,
    } as Response);
};

beforeEach(() => jest.clearAllMocks());

//  useUsers 

describe("useUsers", () => {
    const endpoint = "/api/users/search";

    const successData = { users: [{ id: 1, username: "alice" }], totalUserPages: 3, totalUsers: 15 };

    describe("initial state", () => {
        it("starts with loading=true and empty users", () => {
            mockFetch(successData);
            const { result } = renderHook(() => useUsers({}, endpoint));
            expect(result.current.loading).toBe(true);
            expect(result.current.users).toEqual([]);
        });
    });

    describe("successful fetch", () => {
        it("populates users and pagination after fetch", async () => {
            mockFetch(successData);
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.users).toEqual(successData.users);
            expect(result.current.totalUserPages).toBe(3);
            expect(result.current.totalUsers).toBe(15);
        });

        it("passes the correct URL to fetch", async () => {
            mockFetch(successData);
            renderHook(() => useUsers({ search: "alice", page: 1 }, endpoint));

            await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            const url = (fetch as jest.Mock).mock.calls[0][0] as string;

            expect(url).toContain("search=alice");
            expect(url).toContain("page=1");
            expect(url).toContain(endpoint);
        });
    });

    describe("api response fallbacks", () => {
        it("defaults totalUserPages to 1 when missing", async () => {
            mockFetch({ users: [], totalUsers: 0 });
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.totalUserPages).toBe(1);
        });

        it("defaults totalUsers to 0 when missing", async () => {
            mockFetch({ users: [], totalUserPages: 2 });
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.totalUsers).toBe(0);
        });

        it("defaults users to [] when missing", async () => {
            mockFetch({ totalUserPages: 1, totalUsers: 0 });
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));
            expect(result.current.users).toEqual([]);
        });
    });

    describe("failed fetch", () => {
        it("resets to safe defaults on non-ok response", async () => {
            mockFetch({}, false);
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.users).toEqual([]);
            expect(result.current.totalUserPages).toBe(1);
            expect(result.current.totalUsers).toBe(0);
        });

        it("resets to safe defaults on network error", async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
            const { result } = renderHook(() => useUsers({}, endpoint));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.users).toEqual([]);
            expect(result.current.totalUserPages).toBe(1);
            expect(result.current.totalUsers).toBe(0);
        });

        it("logs the error to console on failure", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            global.fetch = jest.fn().mockRejectedValue(new Error("boom"));

            const { result } = renderHook(() => useUsers({}, endpoint));
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe("filter changes", () => {
        it("refetches when filters change", async () => {
            mockFetch(successData);
            const { result, rerender } = renderHook(
                ({ filters }) => useUsers(filters, endpoint),
                { initialProps: { filters: { search: "a" } } }
            );

            await waitFor(() => expect(result.current.loading).toBe(false));
            rerender({ filters: { search: "b" } });
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});

//  buildQuery 

describe("buildQuery (via URL assertions)", () => {
    beforeEach(() => mockFetch({ users: [], totalUserPages: 1, totalUsers: 0 }));

    const captureUrl = async (filters: Record<string, any>) => {
        const { result } = renderHook(() => useUsers(filters, "/api/test"));
        await waitFor(() => expect(result.current.loading).toBe(false));
        return (fetch as jest.Mock).mock.calls[0][0] as string;
    };

    it("omits null values", async () => {
        const url = await captureUrl({ search: null });
        expect(url).not.toContain("search");
    });

    it("omits undefined values", async () => {
        const url = await captureUrl({ search: undefined });
        expect(url).not.toContain("search");
    });

    it("omits empty string values", async () => {
        const url = await captureUrl({ search: "" });
        expect(url).not.toContain("search");
    });

    it("appends array values as repeated params", async () => {
        const url = await captureUrl({ categories: ["ADMIN", "BASIC"] });
        expect(url).toContain("categories=ADMIN");
        expect(url).toContain("categories=BASIC");
    });

    it("appends string values", async () => {
        const url = await captureUrl({ search: "hello" });
        expect(url).toContain("search=hello");
    });

    it("appends number values", async () => {
        const url = await captureUrl({ page: 2 });
        expect(url).toContain("page=2");
    });

    it("handles empty filters with no query params", async () => {
        const url = await captureUrl({});
        expect(url).toBe("/api/test?");
    });
});