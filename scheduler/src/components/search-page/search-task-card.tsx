import { TaskCard } from "@/src/components/tasks/TaskCard";

export default function SearchTaskCard({ task, onClick }) {

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "";
    }
  };

  return (
    <div onClick={onClick}>
      <TaskCard
        task={task}
        getPriorityStyle={getPriorityStyle}
        onToggle={() => {}}
        onView={() => onClick(task)}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}