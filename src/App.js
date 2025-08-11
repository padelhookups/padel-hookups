import { BrowserRouter, Routes, Route } from "react-router";

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
import Admin from "./routes/Admin";
import ManageUsers from "./routes/Admin/ManageUsers";

import "./App.css";

function App() {
	const { user, loading } = useAuth();
	console.log("App user:", user);

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
			</Layout>
		</BrowserRouter>
	);
}

export default App;
	