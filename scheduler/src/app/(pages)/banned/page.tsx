import BannedPage from "@/components/admin/BanMessagePage";

/**
 * Renders the banned user page.
 * 
 * Behavior:
 * - Displays a message informing the user they are banned
 * - Delegates UI and logic to the `BannedPage` component
 *
 * Use Case:
 * - Shown when an authenticated user is restricted due to moderation actions
 *
 * @returns {JSX.Element} Banned page UI
 */
export default function Page() {
  return <BannedPage />;
}