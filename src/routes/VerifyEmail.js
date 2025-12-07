import { getAuth, signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail, onAuthStateChanged } from "firebase/auth";
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

		// 🔥 Extract URL values now
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

		// 🔥 fallback
		if (!email) {
			email = localStorage.getItem("emailForSignIn");
		}

		// 🔥 Prevent broken flow
		if (!email) {
			alert("Unable to determine email — please restart login.");
			navigate("/");
			return;
		}

		// 🔥 Build redirect params ONCE
		const signupParams = new URLSearchParams();
		signupParams.set("email", email);
		if (inviteId) signupParams.set("inviteId", inviteId);
		if (name) signupParams.set("name", name);
		if (isAdmin) signupParams.set("isAdmin", isAdmin);
		if (isTester) signupParams.set("isTester", isTester);

		const redirectUrl = `/SignUp?${signupParams.toString()}`;

		// 🔥 Wait for Firebase session hydration
		onAuthStateChanged(auth, async (user) => {

			// If already signed in — skip link handling & go straight forward
			if (user) {
				//alert("User already authenticated — skipping verification");
				console.log("User already authenticated — skipping verification");
				navigate(redirectUrl, { replace: true });
				return;
			}

			// 🔥 Validate link now
			if (!isSignInWithEmailLink(auth, window.location.href)) {
				alert("Invalid or expired login link.");
				console.log("Not a Firebase email link");
				navigate("/");
				return;
			}

			// 🔥 Try sign-in
			try {
				await signInWithEmailLink(auth, email, window.location.href);
				localStorage.removeItem("emailForSignIn");
				localStorage.setItem("emailLinkCompleted", "true");

				console.log("Magic link login success");
				navigate(redirectUrl, { replace: true });

			} catch (e) {
				if (e.code === "auth/invalid-action-code") {
					console.warn("Link expired — resending new one.");

					await sendSignInLinkToEmail(auth, email, {
						url: redirectUrl,
						handleCodeInApp: true
					});

					alert("Your link expired — we emailed you a new one.");
					navigate("/");
				} else {
					console.error("Magic link failed:", e);
					//alert("Login validation failed. Please restart login.");
					navigate("/");
				}
			}
		});

	}, [auth, navigate]);

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
			<div>Verifying your email link...</div>
		</div>
	);
}