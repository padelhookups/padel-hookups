import * as React from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import ProtectedRoute from './utils/ProtectedRoute';

/* ROUTES */
import Login from "./routes/Login";

import "./App.css";

function App() {
	return (
		<>
			{/* <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
      <Button variant="contained">Hello world</Button>
      </div> */}
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<Login />} />
					<Route path='/Home' element={<ProtectedRoute><App /></ProtectedRoute>} />
				</Routes>
			</BrowserRouter>
		</>
	);
}

export default App;
