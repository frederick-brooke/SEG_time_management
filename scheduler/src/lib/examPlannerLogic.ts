interface Topic {
    title: string;
    duration: number;
}

export const examPlannerLogic = {
    calculateDaysRequired: (topics: { duration: number }[], maxTimePerDay: number) => {
        if (maxTimePerDay <= 0) return 0;
        
        let dailyTimeSpent = 0;
        let daysRequired = 1;

        topics.forEach(topic => {
            if (dailyTimeSpent + topic.duration > maxTimePerDay && dailyTimeSpent > 0) {
                daysRequired++;
                dailyTimeSpent = topic.duration;
            } else {
                dailyTimeSpent += topic.duration;
            }
        });
        return daysRequired;
    },

    calculateDaysUntil: (examDate: Date, today: Date) => {
        const d1 = new Date(examDate);
        const d2 = new Date(today);

        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);

        const diffInMins = d1.getTime() - d2.getTime();
        return Math.ceil(diffInMins / (1000 * 60 * 60 * 24));
    },

    calculatePlan: (topics: Topic[], maxTimePerDay: number, availableDates: Date[]) => {
        let dateIndex = 0;
        let dailyTimeSpent = 0;
        const plan = [];

        for (const topic of topics) {
            if (dailyTimeSpent + topic.duration > maxTimePerDay && dailyTimeSpent > 0) {
                dateIndex++;
                dailyTimeSpent = 0;
            }

            if (dateIndex < availableDates.length) {
                plan.push({
                    title: topic.title,
                    date: availableDates[dateIndex].toISOString().split('T')[0]
                });
                dailyTimeSpent += topic.duration;
            }
        }

        return plan;
    },

    getAvailableDates: (startDate: Date, endDate: Date, unavailableDays: Date[]) => {
        const availableDates: Date[] = [];
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const targetDate = new Date(endDate);
        targetDate.setHours(0, 0, 0, 0);

        while (currentDate < targetDate) {
            const isUnavailable = unavailableDays.some(
                d => new Date(d).toDateString() === currentDate.toDateString()
            );

            if (!isUnavailable) {
                availableDates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return availableDates
    }

};