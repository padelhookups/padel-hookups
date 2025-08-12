import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import useAuth from "./utils/useAuth";
import ProtectedRoute from "./utils/ProtectedRoute";
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

import "./App.css";

function App() {
	const { user, loading } = useAuth();
	console.log("App user:", user);

	const [deferredPrompt, setDeferredPrompt] = useState(null);
	const [showButton, setShowButton] = useState(false);
	const [showInstallModal, setShowInstallModal] = useState(false);
	const [hasShownAutoModal, setHasShownAutoModal] = useState(false);

	useEffect(() => {
		window.addEventListener("beforeinstallprompt", (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
			setShowButton(true);
			// Auto-show the install modal after a short delay for better UX
			// Only show once per session
			if (!hasShownAutoModal) {
				setTimeout(() => {
					setShowInstallModal(true);
					setHasShownAutoModal(true);
				}, 1000); // 2 second delay
			}
		});
	}, [hasShownAutoModal]);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		console.log(`User response: ${outcome}`);
		setDeferredPrompt(null);
		setShowButton(false);
		setShowInstallModal(false);
	};

	const handleShowInstallModal = () => {
		setShowInstallModal(true);
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
				<>
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
						open={showInstallModal}
						onClose={handleCloseInstallModal}
						onConfirm={handleInstallClick}
					/>
				</>
			</Layout>
		</BrowserRouter>
	);
}

export default App;
