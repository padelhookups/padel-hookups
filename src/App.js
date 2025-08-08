import { BrowserRouter, Routes, Route } from "react-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import ProtectedRoute from "./utils/ProtectedRoute";
import NotFound from "./components/NotFound";

/* ROUTES */
import Login from "./routes/Login";
import SignUp from "./routes/SignUp";
import VerifyEmail from "./routes/VerifyEmail";

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
							<div>
								<h1>
									Hello{" "}
									{auth.currentUser?.displayName ||
										auth.currentUser?.email}
								</h1>
							</div>
						</ProtectedRoute>
					}
				/>
				{/* Catch-all route for non-existent paths */}
				<Route path='*' element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
