import { getAuth, signInWithEmailLink, isSignInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function VerifyEmail() {
	const auth = getAuth();
	const navigate = useNavigate();

	useEffect(() => {
		console.log("Verifying email link...");
		console.log("Is sign-in with email link:", isSignInWithEmailLink(auth, window.location.href));

		if (isSignInWithEmailLink(auth, window.location.href)) {
			let email;
			let inviteId;
			let name;
			let isAdmin;
			let isTester;

			// Try to extract parameters from continueUrl
			const urlParams = new URLSearchParams(window.location.search);
			const continueUrl = urlParams.get("continueUrl");
			if (continueUrl) {
				const contParams = new URLSearchParams(new URL(continueUrl).search);
				email = contParams.get("email");
				inviteId = contParams.get("inviteId");
				name = contParams.get("name");
				isTester = contParams.get("isTester");
			}

			// Fallback: localStorage (same device)
			if (!email) {
				email = window.localStorage.getItem("emailForSignIn");
			}

			// Last resort: ask user
			if (!email) {
				email = window.prompt("Please provide your email for confirmation");
			}

			signInWithEmailLink(auth, email, window.location.href)
				.then(() => {
					// Build the signup URL with all necessary parameters
					const signupParams = new URLSearchParams();
					if (email) signupParams.set('email', email);
					if (inviteId) signupParams.set('inviteId', inviteId);
					if (name) signupParams.set('name', name);
					if (isAdmin) signupParams.set('isAdmin', isAdmin);
					if (isTester) signupParams.set('isTester', isTester);
					
					navigate(`/SignUp?${signupParams.toString()}`, { replace: true });
				})
				.catch(console.error);
		}
	}, [auth, navigate]);

	// Return a loading component while processing
	return (
		<div style={{ 
			display: 'flex', 
			justifyContent: 'center', 
			alignItems: 'center', 
			height: '100vh' 
		}}>
			<div>Verifying your email link...</div>
		</div>
	);
}
