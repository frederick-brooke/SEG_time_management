import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

/**
 * UnauthorizedPage Component
 * 
 * Displays an access denied message for users who do not have
 * sufficient privileges (e.g., non-superusers).
 *
 * @returns {JSX.Element} A themed page with an unauthorized access message.
 */
export default function UnauthorizedPage() {
  return (
    <LunarThemeWrapper>
		{/* Access restriction message */}
		<h1 className="text-2xl lunar-page-subtitle text-red-600">
			Access Denied – Superuser Required
		</h1>
    </LunarThemeWrapper>
  );
}