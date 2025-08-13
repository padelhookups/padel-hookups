import { useLocation } from "react-router";
import BottomBar from "./BottomBar";
import useAuth from "../utils/useAuth";

const Layout = ({ children }) => {
	const location = useLocation();
	const { user } = useAuth();

	// Define routes where the bottom bar should NOT appear
	const excludedRoutes = ["/", "/SignUp", "/verifyEmail"];

	// Check if current route should show the bottom bar
	let showBottomBar = !excludedRoutes.includes(location.pathname);

	/* if (location.pathname === '/ChangePassword' && !user) {
    showBottomBar = false;
  }else{
    showBottomBar = true;
  } */

	return (
		<>
			{children}
			{showBottomBar && <BottomBar />}
		</>
	);
};

export default Layout;
