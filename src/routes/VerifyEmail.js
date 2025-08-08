import { getAuth, signInWithEmailLink,isSignInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router";

export default function VerifyEmail() {
	const auth = getAuth();
	const navigate = useNavigate();

    console.log("Verifying email link...");
    console.log("Is sign-in with email link:", isSignInWithEmailLink(auth, window.location.href));

	if (isSignInWithEmailLink(auth, window.location.href)) {
		let email;
		let inviteId

		// Try to extract email from continueUrl
		const urlParams = new URLSearchParams(window.location.search);
		const continueUrl = urlParams.get("continueUrl");
		if (continueUrl) {
			const contParams = new URLSearchParams(new URL(continueUrl).search);
			email = contParams.get("email");
			inviteId = contParams.get("inviteId");
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
				navigate(`/SignUp?email=${encodeURIComponent(email)}&inviteId=${encodeURIComponent(inviteId)}`,{ replace: true });
			})
			.catch(console.error);
	}
}
