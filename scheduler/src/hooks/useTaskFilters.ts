/**
 * Custom hook which filters and categorises tasks for the ToDoList component.
 * @param {any[]} tasks The full list of tasks to filter.
 * @param {string | null} filterExamId Optional exam ID to filter tasks by.
 * @param {string} searchQuery The current search string to filter tasks titles.
 * @returns {Object} Filtered task arrays split by status and overall progress percentage.
 */
export function useTaskFilters(tasks: any[], filterExamId: string | null, searchQuery: string) {
    /**
     * Determines if a task is past its due date and not completed.
     * @param {any} task The task to check.
     * @returns {boolean} True if the task is overdue.
     */
    const isOverdue = (task) => {
        if (!task.dueDate || task.status === "completed") return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        return dueDate < today;
    };

    const examFilteredTasks = filterExamId
        ? tasks.filter(t => t.examId === filterExamId)
        : tasks;
    
    const searchedTasks = examFilteredTasks.filter(t =>
    (t.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const todoTasks = searchedTasks.filter(t => t.status === "todo" && !isOverdue(t));
    const inProgressTasks = searchedTasks.filter(t => t.status === "in-progress" && !isOverdue(t));
    const completedTasks = searchedTasks.filter(t => t.status === "completed");
    const overdueTasks = searchedTasks.filter(t => isOverdue(t));

    const completedCount = examFilteredTasks.filter(t => t.status === "completed").length;
    const progressPercentage = examFilteredTasks.length > 0
        ? Math.round((completedCount / examFilteredTasks.length) * 100)
        : 0;
    
    return { examFilteredTasks, todoTasks, inProgressTasks, completedTasks, overdueTasks, progressPercentage };
}