"use client";

/**
 * Admin dashboard for managing users, reports, and appeals.
 * Includes filtering, pagination, and tabbed views.
 */

import { useState } from "react";
import UserFilter from "@/components/admin/UserFilterPanel";
import ReportFilter from "@/components/admin/ReportFilterPanel";
import { useUsers } from "@/hooks/useUsers";
import { useAdminReports } from "@/hooks/useAdminReports";
import { useAdminAppeals } from "@/hooks/useAdminAppeals";
import UserManagement from "@/components/admin/UserManagement";
import ReportManagement from "@/components/admin/ReportManagement";
import AppealsManagement from "@/components/admin/AppealManagement";
import AdminStatistics from "@/components/admin/AdminStatistics";
import AppealFilter from "@/components/admin/AppealFilterPanel";

// UI components
import GlowBackground from "@/components/ui/GlowBackground";
import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
	// User management states
	const defaultUserFilters = {
		sortBy: "username",
		order: "desc",
		startDate: "",
		endDate: "",
		categories: [],
		page: 1,
		limit: 10,
	};
	const [appliedUserFilters, setAppliedUserFilters] =
		useState(defaultUserFilters);
	const [draftUserFilters, setDraftUserFilters] =
		useState(defaultUserFilters);

	function resetUserFilters() {
		setDraftUserFilters(defaultUserFilters);
		setAppliedUserFilters(defaultUserFilters);
	}

	const [selectedUser, setSelectedUser] = useState(null);
	const [isUserFilterOpen, setIsUserFilterOpen] = useState(false);

	const [currentReportPage, setCurrentReportPage] = useState(1);
	const [selectedReport, setSelectedReport] = useState(null);
	const [isReportFilterOpen, setIsReportFilterOpen] = useState(false);

	// Report filter states
	const defaultReportFilters = {
		sortBy: "createdAt",
		order: "desc",
		startDate: "",
		endDate: "",
		reportStatus: "",
		limit: "12",
		page: "1",
	};
	const [appliedReportFilters, setAppliedReportFilters] =
		useState(defaultReportFilters);
	const [draftReportFilters, setDraftReportFilters] =
		useState(defaultReportFilters);

	function resetReportFilters() {
		setDraftReportFilters(defaultReportFilters);
		setAppliedReportFilters(defaultReportFilters);
	}

	// Appeal management
	const [currentAppealPage, setCurrentAppealPage] = useState(1);
	const [selectedAppeal, setSelectedAppeal] = useState(null);
	const defaultAppealFilters = {
		sortBy: "createdAt",
		order: "desc",
		startDate: "",
		endDate: "",
		reportStatus: "",
		limit: "12",
	};
	const [appliedAppealFilters, setAppliedAppealFilters] =
		useState(defaultAppealFilters);
	const [draftAppealFilters, setDraftAppealFilters] =
		useState(defaultAppealFilters);
	const [isAppealFilterOpen, setIsAppealFilterOpen] = useState(false);

	function resetAppealFilters() {
		setDraftAppealFilters(defaultAppealFilters);
		setAppliedAppealFilters(defaultAppealFilters);
	}

	const { users, totalUserPages, totalUsers, loading } = useUsers(
		appliedUserFilters,
		"/api/admin/users",
	);
	const {
		reports,
		totalReportPages,
		totalReports,
		reportLoading,
		fetchReports,
	} = useAdminReports(appliedReportFilters);
	const { appeals, totalAppealPages, totalAppeals, fetchAppeals } =
		useAdminAppeals(appliedAppealFilters);

	const [currentTab, setCurrentTab] = useState("reports");

	if (loading || reportLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
				<p className="p-6 animate-pulse">Loading...</p>
			</div>
		);
	}

	const tabs: Record<string, React.ReactNode> = {
		reports: (
			<ReportManagement
				reports={reports}
				totalReports={totalReports}
				totalReportPages={totalReportPages}
				setIsReportFilterOpen={setIsReportFilterOpen}
				selectedReport={selectedReport}
				setSelectedReport={setSelectedReport}
				fetchReports={fetchReports}
				filters={appliedReportFilters}
				setFilters={setAppliedReportFilters}
				resetFilters={resetReportFilters}
			/>
		),
		appeals: (
			<AppealsManagement
				appeals={appeals}
				totalAppeals={totalAppeals}
				totalAppealPages={totalAppealPages}
				currentAppealPage={currentAppealPage}
				setCurrentAppealPage={setCurrentAppealPage}
				selectedAppeal={selectedAppeal}
				setSelectedAppeal={setSelectedAppeal}
				fetchAppeals={fetchAppeals}
				setIsAppealFilterOpen={setIsAppealFilterOpen}
				filters={appliedAppealFilters}
				setFilters={setAppliedAppealFilters}
				resetFilters={resetAppealFilters}
			/>
		),
	};

	return (
		<LunarThemeWrapper>
			<div className="min-h-screen bg-gray-950 text-white relative overflow-hidden pb-12">
				<div className="absolute inset-0 z-0 pointer-events-none">
					<GlowBackground />
				</div>

				<div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-8 space-y-6 lg:space-y-8">
					<h1 className="lunar-page-title">Admin Dashboard</h1>

					{/* Admin statistics */}
					<AdminStatistics />

					{/* Container for the user reporting system */}
					<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
						{/* User Management Column */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col h-full"
						>
							<GlassCard className="h-full flex-1">
								<UserManagement
									users={users}
									totalUsers={totalUsers}
									totalUserPages={totalUserPages}
									setIsUserFilterOpen={setIsUserFilterOpen}
									selectedUser={selectedUser}
									setSelectedUser={setSelectedUser}
									filters={appliedUserFilters}
									setFilters={setAppliedUserFilters}
									resetFilters={resetUserFilters}
								/>
							</GlassCard>
						</motion.div>

						{/* Reports & Appeals Column */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col h-full"
						>
							<GlassCard className="h-full flex-1">
								{/* Scrollable Tabs header for mobile */}
								<div className="flex overflow-x-auto hide-scrollbar border-b border-white/10 mb-4 gap-2 pb-1">
									<Button
										onClick={() => setCurrentTab("reports")}
										className={`whitespace-nowrap px-4 py-2 font-medium transition-colors ${
											currentTab === "reports"
												? "border-b-2 border-blue-500 text-blue-500"
												: "text-gray-400 hover:text-gray-200"
										}`}
									>
										Reports
									</Button>

									<Button
										onClick={() => setCurrentTab("appeals")}
										className={`whitespace-nowrap px-4 py-2 font-medium transition-colors ${
											currentTab === "appeals"
												? "border-b-2 border-blue-500 text-blue-500"
												: "text-gray-400 hover:text-gray-200"
										}`}
									>
										Appeals
									</Button>
								</div>

								{/* Render the active tab */}
								<div className="min-h-[400px]">
									{tabs[currentTab]}
								</div>
							</GlassCard>
						</motion.div>
					</div>

					{/* Respective filter panels */}
					{isUserFilterOpen && (
						<UserFilter
							filters={draftUserFilters}
							setFilters={setDraftUserFilters}
							onClose={() => setIsUserFilterOpen(false)}
							applyFilters={() => {
								setAppliedUserFilters((prev) => ({
									...prev,
									...draftUserFilters,
									page: 1,
								}));
								setIsUserFilterOpen(false);
							}}
							resetFilters={() => {
								setAppliedUserFilters(defaultUserFilters);
							}}
							type={"admin"}
						/>
					)}

					{isReportFilterOpen && (
						<ReportFilter
							filters={draftReportFilters}
							setFilters={setDraftReportFilters}
							onClose={() => setIsReportFilterOpen(false)}
							applyFilters={() => {
								setAppliedReportFilters(draftReportFilters);
								setIsReportFilterOpen(false);
							}}
							resetFilters={() => {
								setAppliedReportFilters(defaultReportFilters);
							}}
						/>
					)}

					{isAppealFilterOpen && (
						<AppealFilter
							filters={draftAppealFilters}
							setFilters={setDraftAppealFilters}
							onClose={() => setIsAppealFilterOpen(false)}
							applyFilters={() => {
								setAppliedAppealFilters(draftAppealFilters);
								setIsAppealFilterOpen(false);
							}}
							resetFilters={() => {
								setAppliedAppealFilters(defaultAppealFilters);
							}}
						/>
					)}
				</div>
			</div>
		</LunarThemeWrapper>
	);
}
