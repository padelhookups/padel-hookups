import { getAuth, signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail } from "firebase/auth";
import { useNavigate } from "react-router";
import { useEffect, useRef } from "react";

export default function VerifyEmail() {
	const auth = getAuth();
	const navigate = useNavigate();

	// Prevent running twice due to React strict mode
	const hasProcessed = useRef(false);

	useEffect(() => {
		if (hasProcessed.current) return;
		hasProcessed.current = true;

		console.log("Verifying email link...");

		if (!isSignInWithEmailLink(auth, window.location.href)) {
			console.log("Not a Firebase email link");
			return;
		}

		let email;
		let inviteId;
		let name;
		let isAdmin;
		let isTester;

		const urlParams = new URLSearchParams(window.location.search);
		const continueUrl = urlParams.get("continueUrl");

		if (continueUrl) {
			try {
				const decoded = decodeURIComponent(continueUrl);
				const contParams = new URLSearchParams(new URL(decoded).search);

				email = contParams.get("email");
				inviteId = contParams.get("inviteId");
				name = contParams.get("name");
				isTester = contParams.get("isTester");
				isAdmin = contParams.get("isAdmin");
			} catch (e) {
				console.warn("Failed parsing continueUrl");
			}
		}

		// fallback
		if (!email) {
			email = window.localStorage.getItem("emailForSignIn");
		}

		if (!email) {
			email = window.prompt("Please confirm your email");
		}

		async function processSignin() {
			try {
				try {
					await signInWithEmailLink(auth, email, window.location.href);

					// If succeeded, mark it
					localStorage.setItem("emailLinkCompleted", "true");

					navigate(`/SignUp?...`);
				} catch (e) {
					// If already used or expired
					if (e.code === "auth/invalid-action-code") {
						console.warn("Link expired, sending new one...");
						const actionCodeSettings = {
							url: `https://padel-hookups.web.app/SignUp?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&inviteId=${inviteId}&isAdmin=${isAdmin}&isTester=${isTester}`,
							handleCodeInApp: true
						};
						await sendSignInLinkToEmail(auth, email, actionCodeSettings);
						alert("Your link expired — a new one has been sent.");
					}
				}

				// Build redirect params
				const signupParams = new URLSearchParams();
				if (email) signupParams.set("email", email);
				if (inviteId) signupParams.set("inviteId", inviteId);
				if (name) signupParams.set("name", name);
				if (isAdmin) signupParams.set("isAdmin", isAdmin);
				if (isTester) signupParams.set("isTester", isTester);

				navigate(`/SignUp?${signupParams}`, { replace: true });

			} catch (err) {
				console.error("Firebase email link login failed:", err);
			}
		}

		processSignin();

	}, [auth, navigate]);

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
			<div>Verifying your email link...</div>
		</div>
	);
}