import React from "react";
import ReactDOM from "react-dom/client";
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { AuthProvider } from "./utils/AuthContext";

/* ROUTES */
import App from "./App";

import "./index.css";
import reportWebVitals from "./reportWebVitals";

const theme = createTheme({
  palette: {
    primary: {
      main: '#b88f34', // Your new primary color (e.g., blue)
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<AuthProvider>
			<ThemeProvider theme={theme}>
				<App />
			</ThemeProvider>
		</AuthProvider>
	</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
