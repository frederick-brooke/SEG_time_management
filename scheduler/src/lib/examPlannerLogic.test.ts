import { examPlannerLogic  } from "./examPlannerLogic";

describe('Exam Planner Suite', () => {
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