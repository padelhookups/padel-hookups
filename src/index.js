import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { createTheme, ThemeProvider } from "@mui/material/styles";

/* FIREBASE */
/* import { getAuth } from "firebase/auth"; */

/* AUTH */
import { AuthProvider } from "./utils/AuthContext";

import "./index.css";
import reportWebVitals from "./reportWebVitals";

const theme = createTheme({
  palette: {
    primary: {
      main: "#b88f34", // Your new primary color (e.g., blue)
    },
  },
  components: {
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: "none", // Removes underline
          "&:hover": {
            textDecoration: "none", // Keeps it off on hover too
          },
        },
      },
      defaultProps: {
        underline: "none", // Prevents default underline
      },
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
