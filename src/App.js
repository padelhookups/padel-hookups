import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import useAuth from "./utils/useAuth";
import ProtectedRoute from "./utils/ProtectedRoute";
import { usePWAInstallOrOpen } from "./utils/UsePWAInstallOrOpen";
import NotFound from "./components/NotFound";
import Layout from "./components/Layout";
import InstallAppModal from "./components/InstallAppModal";

/* ROUTES */
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import VerifyEmail from "./routes/VerifyEmail";
import Home from "./routes/Home";
import Profile from "./routes/Profile";
import Settings from "./routes/Settings";
import Benefits from "./routes/Benefits";
import Admin from "./routes/Admin";
import ManageUsers from "./routes/Admin/ManageUsers";
import ChangePassword from "./routes/ChangePassword";

function App() {
	const {
		isInstalled,
		isRunningInApp,
		isChecking,
		canInstall,
		promptInstall,
		openApp
	} = usePWAInstallOrOpen("web+padel://open");
	const { user, loading } = useAuth();
	const [showInstallModal, setShowInstallModal] = useState(false);
	const [hasShownAutoModal, setHasShownAutoModal] = useState(false);

	const isMobileDevice = () => {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
	};

	/* useEffect(() => {
		function openAppOrStay() {
			console.log("App not installed");

			window.addEventListener("beforeinstallprompt", (e) => {
				e.preventDefault();
				setDeferredPrompt(e);
				// Auto-show the install modal after a short delay for better UX
				// Only show once per session
				if (!hasShownAutoModal && isMobileDevice()) {
					setTimeout(() => {
						setShowInstallModal(true);
						setHasShownAutoModal(true);
					}, 1000); // 2 second delay
				}
			});
		}
		openAppOrStay();
	}, [hasShownAutoModal]); */

	useEffect(() => {
		if (isChecking) return;
		 if (isRunningInApp) return;

		if (isInstalled) {
			if (window.confirm("Open the installed app?")) {
				openApp();
			}
		} else if (canInstall && !hasShownAutoModal) {
			//setDeferredPrompt(e);
			setShowInstallModal(true);
			setHasShownAutoModal(true);
		}
	}, [isInstalled, isRunningInApp, isChecking, canInstall, promptInstall, openApp, hasShownAutoModal]);

	const handleInstallClick = async () => {
		const result = await promptInstall();
		if (result) {
			console.log("User accepted the install prompt");
		} else {
			console.log("User dismissed the install prompt");
		}
		setShowInstallModal(false);
	};

	const handleCloseInstallModal = () => {
		setShowInstallModal(false);
		// Keep the floating button visible if user dismisses the modal
		// so they can access it later if they change their mind
	};

	if (loading) {
		// You can show a spinner or skeleton here while auth state loads
		return <div>Loading...</div>;
	}

	return (
		<BrowserRouter>
			<Layout>
				<div className='App' style={{ maxHeight: "calc(100vh - 55px)" }}>
					<Routes>
						<Route path='/' element={<Login />} />
						<Route
							path='/SignUp'
							element={
								<ProtectedRoute user={user}>
									<SignUp />
								</ProtectedRoute>
							}
						/>
						<Route path='/verifyEmail' element={<VerifyEmail />} />
						<Route
							path='/Home'
							element={
								<ProtectedRoute user={user}>
									<Home />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/Profile'
							element={
								<ProtectedRoute user={user}>
									<Profile />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/Settings'
							element={
								<ProtectedRoute user={user}>
									<Settings />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/ChangePassword'
							element={
								<ProtectedRoute user={user}>
									<ChangePassword />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/Benefits'
							element={
								<ProtectedRoute user={user}>
									<Benefits />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/Admin'
							element={
								<ProtectedRoute user={user}>
									<Admin />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/ManageUsers'
							element={
								<ProtectedRoute user={user}>
									<ManageUsers />
								</ProtectedRoute>
							}
						/>
						{/* Catch-all route for non-existent paths */}
						<Route path='*' element={<NotFound />} />
					</Routes>
					<InstallAppModal
						key={showInstallModal ? "open" : "closed"}
						open={showInstallModal}
						onClose={handleCloseInstallModal}
						onConfirm={handleInstallClick}
					/>
				</div>
			</Layout>
		</BrowserRouter>
	);
}

export default App;
