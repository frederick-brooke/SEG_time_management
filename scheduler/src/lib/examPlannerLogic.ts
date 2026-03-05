export const examPlannerLogic = {
    calculateDaysRequired: (topics: { duration: number }[], maxTimePerDay: number) => {
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
        const diffInMins = examDate.getTime() - today.getTime();
        return Math.ceil(diffInMins / (1000 * 60 * 60 * 24));
    },

    calculatePlan: (topics: any[], maxTimePerDay: number, availableDates: Date[]) => {
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
    }

};