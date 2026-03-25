import { nextWednesday } from "date-fns";
import { examPlannerLogic  } from "./examPlannerLogic";

describe('Exam Planner Suite', () => {
    test('Should filter out unavailable dates correctly', () => {
        const start = new Date('2026-03-01');
        const end = new Date('2026-03-05');
        const unavailable = [new Date('2026-03-03')];

        const result = examPlannerLogic.getAvailableDates(start, end, unavailable);

        expect(result).toHaveLength(3);

        const dateStrings = result.map(d => d.toDateString());
        expect(dateStrings).not.toContain(new Date('2026-03-02').toDateString());
        expect(dateStrings).toContain(new Date('2026-03-01').toDateString());
    });

    test('Should return empty array if start date is after end date', () => {
        const start = new Date('2026-03-10');
        const end = new Date('2026-03-05');
        const result = examPlannerLogic.getAvailableDates(start, end, []);
        expect(result).toEqual([]);
    });
    
    test('Algorithm: spread tasks when daily goal is exceeded', () => {
        const topics = [{ duration: 40 }, { duration: 40 }];
        const result = examPlannerLogic.calculateDaysRequired(topics, 60);
        expect(result).toBe(2);
    });

    test('Algorithm: keeps tasks on one day if within goal', () => {
        const topics = [{ duration: 20 }, { duration: 30 }];
        const result = examPlannerLogic.calculateDaysRequired(topics, 60);
        expect(result).toBe(1);
    });

    test('Dashboard: correctly rounds up days left using Math.ceil', () => {
        const today = new Date('2026-02-24T10:00:00');
        const examDate = new Date('2026-02-26T08:00:00');
        const daysLeft = examPlannerLogic.calculateDaysUntil(examDate, today);
        expect(daysLeft).toBe(2);
    });

    test('calculatePlan: spread tasks correctly when daily limit is exceeded', () => {
        const mockTopics = [
            { title: "Topic A", duration: 40 },
            { title: "Topic B", duration: 30 },
        ];

        const maxTime = 60;
        const dates = [new Date("2026-03-01"), new Date("2026-03-02")];

        const result = examPlannerLogic.calculatePlan(mockTopics, maxTime, dates);

        expect(result[0].date).toBe("2026-03-01");
        expect(result[1].date).toBe("2026-03-02");
    });
});