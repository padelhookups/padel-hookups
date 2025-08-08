import { BrowserRouter, Routes, Route } from "react-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import ProtectedRoute from "./utils/ProtectedRoute";
import NotFound from "./components/NotFound";
import Layout from "./components/Layout";

/* ROUTES */
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import VerifyEmail from "./routes/VerifyEmail";
import Home from "./routes/Home";
import Profile from "./routes/Profile";
import Settings from "./routes/Settings";

import "./App.css";

function App() {
	const auth = getAuth();
	auth.useDeviceLanguage();
	
	onAuthStateChanged(auth, (user) => {
		if (user) {
			console.log("User is authenticated:", user); // Log user details if needed
		} else {
			console.log("User is not authenticated");
		}
	});
	return (
		<BrowserRouter>
			<Layout>
				<Routes>
					<Route path='/' element={<Login />} />
					<Route
						path='/SignUp'
						element={
							<ProtectedRoute>
								<SignUp />
							</ProtectedRoute>
						}
					/>
					<Route path='/verifyEmail' element={<VerifyEmail />} />
					<Route
						path='/Home'
						element={
							<ProtectedRoute>
								<Home />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/profile'
						element={
							<ProtectedRoute>
								<Profile />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/settings'
						element={
							<ProtectedRoute>
								<Settings />
							</ProtectedRoute>
						}
					/>
					{/* Catch-all route for non-existent paths */}
					<Route path='*' element={<NotFound />} />
				</Routes>
			</Layout>
		</BrowserRouter>
	);
}

export default App;
