interface Topic {
    title: string;
    duration: number;
}

/**
 * Core logic for calculating and distributing revision tasks across available days.
 */
export const examPlannerLogic = {
    /**
     * Calculates total days needed based on topic durations and daily time limits
     * @param {Object[]} topics Array of topics with associated durations.
     * @param {number} maxTimePerDay Maximum minutes of study allocated per day.
     * @returns {number} The total number of days required.
     */
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

    /**
     * Finds the integer difference in days between two dates.
     * @param {Date} examDate The target deadline.
     * @param {Date} today The starting date for revision.
     * @returns {number} Ceiling of the day difference.
     */
    calculateDaysUntil: (examDate: Date, today: Date) => {
        const d1 = new Date(examDate);
        const d2 = new Date(today);

        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);

        const diffInMins = d1.getTime() - d2.getTime();
        return Math.ceil(diffInMins / (1000 * 60 * 60 * 24));
    },

    /**
     * Maps topics to specific dates based on available day/time slots.
     * @param {Topics[]} topics The list of study materials.
     * @param {number} maxTimePerDay The user-defined daily minute limit for revision.
     * @param {Date[]} availableDates Filtered list of non-available days.
     * @returns {Object[]} Array of objects mapping revision subtopics to ISO date strings.
     */
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

    /**
     * Filters out blocked dates to return a valid study window.
     * @param {Date} startDate When to begin the date search from.
     * @param {Date} endDate When to end the date search.
     * @param {Date[]} unavailableDays User-blocked dates.
     * @returns {Date[]} Array of Date objects available for studying.
     */
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