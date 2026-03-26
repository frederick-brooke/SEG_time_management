import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NotificationType } from "@prisma/client";

// Mocks 
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

jest.mock("../actions/notifications", () => ({
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  createNotification: jest.fn(),
}));

// Imports 
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from "../actions/notifications";
import NotificationModal from "./NotificationModal";

// Typed mock helpers 
const mockUseSession = useSession as jest.Mock;
const mockGetNotifications = getNotifications as jest.Mock;
const mockMarkNotificationAsRead = markNotificationAsRead as jest.Mock;
const mockMarkAllNotificationsAsRead = markAllNotificationsAsRead as jest.Mock;
const mockCreateNotification = createNotification as jest.Mock;

// Shared fixtures 
const SESSION = { user: { id: "user-1" } };

const makeNotification = (overrides = {}) => ({
  id: "notif-1",
  userId: "user-1",
  title: "Test Notification",
  message: "This is a test message",
  type: NotificationType.INFO,
  isRead: false,
  link: null,
  createdAt: new Date(),
  expiresAt: null,
  ...overrides,
});

const DEFAULT_PROPS = {
  handleShowModal: jest.fn(),
  isOpen: true,
};

// Helpers 
const renderModal = (props = {}) =>
  render(<NotificationModal {...DEFAULT_PROPS} {...props} />);

describe("NotificationModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({ data: SESSION });
    mockGetNotifications.mockResolvedValue({ notifications: [], error: null });
    mockMarkNotificationAsRead.mockResolvedValue({ success: true, error: null });
    mockMarkAllNotificationsAsRead.mockResolvedValue({ success: true, error: null });
    mockCreateNotification.mockResolvedValue({ notification: null, error: null });
  });

  // Visibility 
  describe("visibility", () => {
    it("renders the modal when isOpen is true", () => {
      renderModal({ isOpen: true });
      expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    it("hides the modal when isOpen is false", () => {
      const { container } = renderModal({ isOpen: false });
      // The outer div gets the 'hidden' class when closed
      expect(container.firstChild).toHaveClass("hidden");
    });
  });

  // Fetching 
  describe("fetching notifications", () => {
    it("calls getNotifications when modal opens", async () => {
      renderModal({ isOpen: true });
      await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));
    });

    it("does not call getNotifications when modal is closed", async () => {
      renderModal({ isOpen: false });
      await waitFor(() => expect(mockGetNotifications).not.toHaveBeenCalled());
    });

    it("displays fetched notifications", async () => {
      const notif = makeNotification({ title: "Hello World" });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("Hello World")).toBeInTheDocument()
      );
    });

    it("logs error when getNotifications returns an error", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetNotifications.mockResolvedValue({ notifications: null, error: "fetch failed" });

      renderModal();

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to fetch notifications:",
          "fetch failed"
        )
      );
      consoleSpy.mockRestore();
    });

    it("logs error when getNotifications throws", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockGetNotifications.mockRejectedValue(new Error("Network failure"));

      renderModal();

      await waitFor(() =>
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching notifications:",
          expect.any(Error)
        )
      );
      consoleSpy.mockRestore();
    });

    it("re-fetches when isOpen changes from false to true", async () => {
      const { rerender } = renderModal({ isOpen: false });
      expect(mockGetNotifications).not.toHaveBeenCalled();

      rerender(<NotificationModal {...DEFAULT_PROPS} isOpen={true} />);

      await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));
    });
  });

  // Notification count 
  describe("notification count", () => {
    it("shows correct notification count", async () => {
      const notifs = [makeNotification({ id: "1" }), makeNotification({ id: "2" })];
      mockGetNotifications.mockResolvedValue({ notifications: notifs, error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("2 notifications")).toBeInTheDocument()
      );
    });

    it("shows 0 notifications when list is empty", async () => {
      renderModal();
      await waitFor(() =>
        expect(screen.getByText("0 notifications")).toBeInTheDocument()
      );
    });
  });

  // Empty state 
  describe("empty state", () => {
    it("shows empty state message when there are no notifications", async () => {
      renderModal();
      await waitFor(() =>
        expect(screen.getByText("No notifications")).toBeInTheDocument()
      );
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it("shows Refresh button in empty state", async () => {
      renderModal();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument()
      );
    });

    it("calls getNotifications when Refresh is clicked", async () => {
      jest.useFakeTimers();
      renderModal();

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole("button", { name: /refresh/i }));

      await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2));
      jest.useRealTimers();
    });
  });

  // Notification rendering 
  describe("notification rendering", () => {
    it("renders notification title and message", async () => {
      const notif = makeNotification({ title: "My Title", message: "My Message" });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText("My Title")).toBeInTheDocument();
        expect(screen.getByText("My Message")).toBeInTheDocument();
      });
    });

    it("renders multiple notifications", async () => {
      const notifs = [
        makeNotification({ id: "1", title: "First" }),
        makeNotification({ id: "2", title: "Second" }),
        makeNotification({ id: "3", title: "Third" }),
      ];
      mockGetNotifications.mockResolvedValue({ notifications: notifs, error: null });

      renderModal();

      await waitFor(() => {
        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();
        expect(screen.getByText("Third")).toBeInTheDocument();
      });
    });

    it("renders 'just now' for very recent notifications", async () => {
      const notif = makeNotification({ createdAt: new Date() });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("just now")).toBeInTheDocument()
      );
    });

    it("renders minutes ago for notifications < 1 hour old", async () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const notif = makeNotification({ createdAt: thirtyMinsAgo });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("30m ago")).toBeInTheDocument()
      );
    });

    it("renders hours ago for notifications < 24 hours old", async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const notif = makeNotification({ createdAt: twoHoursAgo });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("2h ago")).toBeInTheDocument()
      );
    });

    it("renders localeDateString for notifications >= 24 hours old", async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const notif = makeNotification({ createdAt: twoDaysAgo });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText(twoDaysAgo.toLocaleDateString())).toBeInTheDocument()
      );
    });
  });

  // Notification types 
  describe("notification types", () => {
    const typeTests: [NotificationType, string][] = [
      [NotificationType.SUCCESS, "lunar-item-success"],
      [NotificationType.ERROR, "lunar-item-error"],
      [NotificationType.WARNING, "lunar-item-warning"],
      [NotificationType.INFO, "lunar-item-info"],
    ];

    typeTests.forEach(([type, expectedClass]) => {
      it(`applies "${expectedClass}" class for ${type} notifications`, async () => {
        const notif = makeNotification({ type });
        mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

        const { container } = renderModal();

        await waitFor(() =>
          expect(container.querySelector(`.${expectedClass}`)).toBeInTheDocument()
        );
      });
    });
  });

  // Dismiss single notification 
  describe("dismissing a single notification", () => {
    it("removes notification from UI when dismiss button clicked", async () => {
      const notif = makeNotification({ title: "Dismiss Me" });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() => expect(screen.getByText("Dismiss Me")).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText("Dismiss notification"));

      expect(screen.queryByText("Dismiss Me")).not.toBeInTheDocument();
    });

    it("calls markNotificationAsRead with the correct id", async () => {
      const notif = makeNotification({ id: "notif-99" });
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() => screen.getByLabelText("Dismiss notification"));
      fireEvent.click(screen.getByLabelText("Dismiss notification"));

      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith("notif-99");
    });
  });

  // Clear all 
  describe("clearing all notifications", () => {
    it("clears all notifications from UI when Clear All clicked", async () => {
      const notifs = [
        makeNotification({ id: "1", title: "First" }),
        makeNotification({ id: "2", title: "Second" }),
      ];
      mockGetNotifications.mockResolvedValue({ notifications: notifs, error: null });

      renderModal();

      await waitFor(() => expect(screen.getByText("First")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Clear All"));

      expect(screen.queryByText("First")).not.toBeInTheDocument();
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
    });

    it("calls markAllNotificationsAsRead when Clear All clicked", async () => {
      const notif = makeNotification();
      mockGetNotifications.mockResolvedValue({ notifications: [notif], error: null });

      renderModal();

      await waitFor(() => screen.getByText("Clear All"));
      fireEvent.click(screen.getByText("Clear All"));

      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledTimes(1);
    });

    it("does not show footer (Clear All / Close) when notifications list is empty", async () => {
      renderModal();

      await waitFor(() =>
        expect(screen.queryByText("Clear All")).not.toBeInTheDocument()
      );
    });

    it("shows footer when there are notifications", async () => {
      mockGetNotifications.mockResolvedValue({
        notifications: [makeNotification()],
        error: null,
      });

      renderModal();

      await waitFor(() =>
        expect(screen.getByText("Clear All")).toBeInTheDocument()
      );
    });
  });

  // Close / handleShowModal 
  describe("closing the modal", () => {
    it("calls handleShowModal when close (X) button in header is clicked", async () => {
      const handleShowModal = jest.fn();
      renderModal({ handleShowModal });

      fireEvent.click(screen.getByLabelText("Close modal"));

      expect(handleShowModal).toHaveBeenCalledTimes(1);
    });

    it("calls handleShowModal when backdrop is clicked", async () => {
      const handleShowModal = jest.fn();
      const { container } = renderModal({ handleShowModal });

      // Click the outermost backdrop div
      fireEvent.click(container.firstChild as Element);

      expect(handleShowModal).toHaveBeenCalledTimes(1);
    });

    it("does not call handleShowModal when clicking inside the modal card", async () => {
      const handleShowModal = jest.fn();
      renderModal({ handleShowModal });

      fireEvent.click(screen.getByText("Notifications"));

      expect(handleShowModal).not.toHaveBeenCalled();
    });

    it("calls handleShowModal when footer Close button is clicked", async () => {
      const handleShowModal = jest.fn();
      mockGetNotifications.mockResolvedValue({
        notifications: [makeNotification()],
        error: null,
      });

      renderModal({ handleShowModal });

      await waitFor(() => screen.getByText("Clear All"));
      fireEvent.click(screen.getByRole("button", { name: /^close$/i }));

      expect(handleShowModal).toHaveBeenCalled();
    });
  });
});
