"use client";
import { useState } from "react";

export default function QuizPage() {
  // State will go here
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    workStartTime: "09:00",
    workEndTime: "20:00",
    daysOff: [],
    sessionLength: 60,
    breakLength: 15,
    breaksPerDay: 2,
    taskOrder: "hard-first",
    maxTasksPerDay: 5,
    defaultTaskDuration: 60,
    reminderDays: 2,
  });

  // Functions will go here
  // Next button
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Back button
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Update form data
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (!session?.user?.id) {
        alert("Failed to get user session");
        setIsLoading(false);
        return;
      }

      // Save preferences
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          userID: session.user.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("Failed to save preferences. Please try again.");
      setIsLoading(false);
    }
  };

  // Return (what goes on screen) will go here
  return (
    // A full screen gray background that centers everything
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* The white box that contains the quiz */}
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md">
        {/* Progress Bar */}
        <div className="mb-8">
          {/* Displays "Step X of 4" */}
          <p className="text-sm text-gray-600 mb-2"> Step {currentStep} of 4</p>
          {/* The empty progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            {/* Creates the blue that fills the bar based on progress */}
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
        {/* Questions go here */}
        <div className="mb-8">
          {/* Creates the step title heading */}
          <h2 className="text-2xl font-bold mb-6">
            {/* shows "Work Schedule" only if we are on step 1 */}
            {currentStep === 1 && "Work Schedule"}
            {currentStep === 2 && "Breaks and Sessions"}
            {currentStep === 3 && "Task Preferences"}
            {currentStep === 4 && "Reminders"}
          </h2>
          {/* Step 1 */}
          {/* Everything inside () shows only if we are on Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Work Start time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When would you like to start working?
                </label>
                <input
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) =>
                    handleChange("workStartTime", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Work End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  When would you like to stop working?
                </label>
                <input
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) => handleChange("workEndTime", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm"
                />
              </div>

              {/* Days off */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which days are you off?
                </label>
                <div className="space-y-2">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.daysOff.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleChange("daysOff", [...formData.daysOff, day]);
                          } else {
                            handleChange(
                              "daysOff",
                              formData.daysOff.filter((d) => d !== day),
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Session Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long do you work before taking a break? (minutes)
                </label>
                <input
                  type="number"
                  value={formData.sessionLength}
                  onChange={(e) =>
                    handleChange("sessionLength", parseInt(e.target.value))
                  }
                  min="15"
                  max="180"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Break Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long are your breaks? (minutes)
                </label>
                <input
                  type="number"
                  value={formData.breakLength}
                  onChange={(e) =>
                    handleChange("breakLength", parseInt(e.target.value))
                  }
                  min="15"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-mb"
                />
              </div>

              {/* Breaks Per Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many breaks do you take per day?
                </label>
                <input
                  type="number"
                  value={formData.breaksPerDay}
                  onChange={(e) =>
                    handleChange("breaksPerDay", parseInt(e.target.value))
                  }
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-mb"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Task Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you prefer to tackle hard tasks first or easy tasks first?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskOrder"
                      value="hard-first"
                      checked={formData.taskOrder === "hard-first"}
                      onChange={(e) =>
                        handleChange("taskOrder", e.target.value)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Hard tasks first</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="taskOrder"
                      value="easy-first"
                      checked={formData.taskOrder === "easy-first"}
                      onChange={(e) =>
                        handleChange("taskOrder", e.target.value)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Easy tasks first</span>
                  </label>
                </div>
              </div>

              {/* Max tasks per day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many tasks can you handle per day?
                </label>
                <input
                  type="number"
                  value={formData.maxTasksPerDay}
                  onChange={(e) =>
                    handleChange("maxTasksPerDay", parseInt(e.target.value))
                  }
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Default task duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default task duration? (minutes)
                </label>
                <input
                  type="number"
                  value={formData.defaultTaskDuration}
                  onChange={(e) =>
                    handleChange(
                      "defaultTaskDuration",
                      parseInt(e.target.value),
                    )
                  }
                  min="15"
                  max="240"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Reminder Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many days before a deadline should we remind you?
                </label>
                <input
                  type="number"
                  value={formData.reminderDays}
                  onChange={(e) =>
                    handleChange("reminderDays", parseInt(e.target.value))
                  }
                  min="0"
                  max="14"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  We'll send you a reminder {formData.reminderDays} day
                  {formData.reminderDays !== 1 ? "s" : ""} before tasks are due
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Navigation buttons */}
        <div className="flex justify-between">
          {/* Create a back button */}
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 border rounded-full disabled:opacity-50"
          >
            Back
          </button>
          {/* If we are on any page before last, show Next button, else show Submit */}
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-black text-white rounded-full"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-full disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
