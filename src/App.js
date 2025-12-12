import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import firebase from "./firebase-config";
import { initRemoteConfig } from "./firebase-config";
import useAuth from "./utils/useAuth";
import ProtectedRoute from "./utils/ProtectedRoute";
import { usePWAInstallOrOpen } from "./utils/UsePWAInstallOrOpen";
import NotFound from "./components/NotFound";
import Layout from "./components/Layout";
import InstallAppModal from "./components/InstallAppModal";
import Loading from "./components/Loading";

/* ROUTES */
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import VerifyEmail from "./routes/VerifyEmail";
import Home from "./routes/Home";
import Community from "./routes/Community";
import Event from "./routes/Event";
import Profile from "./routes/Profile";
import Settings from "./routes/Settings";
import Benefits from "./routes/Benefits";
import Admin from "./routes/Admin";
import ManageUsers from "./routes/Admin/ManageUsers";
import ChangePassword from "./routes/ChangePassword";
import MyDevices from "./routes/MyDevices";
import NotificationPermissionModal from "./components/NotificationPermissionModal";

import logo from "./images/LogoWhite.svg";

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

	useEffect(() => {
		window.addEventListener("error", (ev) => {
			console.error("GLOBAL ERROR:", ev.error || ev.message, ev);
			// show something on screen
			/* const el = document.getElementById("__client_err__") || (() => {
				const d = document.createElement("div");
				d.id = "__client_err__";
				d.style.position = "fixed";
				d.style.left = 0;
				d.style.right = 0;
				d.style.top = 0;
				d.style.background = "rgba(255,0,0,0.9)";
				d.style.color = "white";
				d.style.zIndex = 99999;
				d.style.padding = "8px";
				document.body.appendChild(d);
				return d;
			})();
			el.innerText = (ev.error && ev.error.stack) || ev.message || JSON.stringify(ev); */
		});
		initRemoteConfig();
	}, []);

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
	}, [
		isInstalled,
		isRunningInApp,
		isChecking,
		canInstall,
		promptInstall,
		openApp,
		hasShownAutoModal
	]);

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
		return <Loading isGenericLoading={true} />;
	}

	firebase.onMessageListener().then((payload) => {
		console.log("Message received. ", payload);
	});

	return (
		<BrowserRouter>
			<div className='app-container'>
				<Layout>
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
							path='/Community'
							element={
								<ProtectedRoute user={user}>
									<Community />
								</ProtectedRoute>
							}
						/>
						<Route
							path='/Event'
							element={
								<ProtectedRoute user={user}>
									<Event />
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
						<Route
							path='/MyDevices'
							element={
								<ProtectedRoute user={user}>
									<MyDevices />
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
					<NotificationPermissionModal />
				</Layout>
			</div>
		</BrowserRouter>
	);
}

export default App;
