import { GET, POST } from "../route";

//Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any) => ({
      status: 200,
      json: async () => data,
    }),
  },
}));

describe("Wellbeing Timer API", () => {
    let GET, POST;

    beforeEach(async () => {
        jest.resetModules(); // reset module state

        const route = await import("../route"); // re-import fresh module
        GET = route.GET;
        POST = route.POST;
    });

    const mockRequest = (body) =>
    ({
        json: jest.fn().mockResolvedValue(body),
    });

    //Now this works
    it("returns null endTime initially", async () => {
        const res = await GET();
        const data = await res.json();

        expect(data.endTime).toBeNull();
    });

    it("sets endTime on POST", async () => {
        const req = mockRequest({ durationMs: 1000 });

        const res = await POST(req);
        const data = await res.json();

        expect(data.endTime).toBeGreaterThan(Date.now());
    });

    // GET returns null initially
    it("returns null endTime initially", async () => {
        const res = await GET();
        const data = await res.json();

        expect(data.endTime).toBeNull();
    });

    // POST then GET returns same endTime
    it("persists endTime between POST and GET", async () => {
        const req = mockRequest({ durationMs: 5000 });

        const postRes = await POST(req);
        const postData = await postRes.json();

        const getRes = await GET();
        const getData = await getRes.json();

        expect(getData.endTime).toBe(postData.endTime);
    });

    //Multiple POST updates endTime
    it("updates endTime on multiple POST calls", async () => {
        const req1 = mockRequest({ durationMs: 1000 });
        const res1 = await POST(req1);
        const data1 = await res1.json();

        const req2 = mockRequest({ durationMs: 5000 });
        const res2 = await POST(req2);
        const data2 = await res2.json();

        expect(data2.endTime).toBeGreaterThan(data1.endTime);
    });
});