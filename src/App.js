import { BrowserRouter, Routes, Route } from "react-router";

import { onAuthStateChanged } from "firebase/auth";
import firebase from "./firebase-config";

import useAuth from "./utils/useAuth";
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
import Benefits from "./routes/Benefits";

import "./App.css";

function App() {
	const { user, loading } = useAuth();

	if (loading) {
		// You can show a spinner or skeleton here while auth state loads
		return <div>Loading...</div>;
	}

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
					<Route
						path='/benefits'
						element={
							<ProtectedRoute>
								<Benefits />
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
