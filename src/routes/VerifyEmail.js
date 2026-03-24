import {
	confirmPasswordReset,
	getAuth,
	isSignInWithEmailLink,
	onAuthStateChanged,
	sendSignInLinkToEmail,
	signInWithEmailLink,
	verifyPasswordResetCode
} from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";

import {
	Box,
	Button,
	CircularProgress,
	Container,
	FormControl,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Typography
} from "@mui/material";
import {
	Check,
	ChevronRight,
	Close,
	Lock,
	Visibility,
	VisibilityOff
} from "@mui/icons-material";
import logo from "../images/LogoWhite.svg";
import SuccessModal from "../components/SuccessModal";

export default function VerifyEmail() {
	const auth = getAuth();
	const db = getFirestore();
	const navigate = useNavigate();
	const [statusMessage, setStatusMessage] = useState(
		"Verifying your email link..."
	);
	const [resetState, setResetState] = useState(null); // { oobCode, email }
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetSuccess, setResetSuccess] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
		useState(false);
	const [lowerCaseValid, setLowerCaseValid] = useState(false);
	const [upperCaseValid, setUpperCaseValid] = useState(false);
	const [numberValid, setNumberValid] = useState(false);
	const [specialCharValid, setSpecialCharValid] = useState(false);
	const [lengthValid, setLengthValid] = useState(false);

	// Prevent running twice due to React strict mode
	const hasProcessed = useRef(false);

	const handlePasswordChange = (value) => {
		setNewPassword(value);
		setLowerCaseValid(/[a-z]/.test(value));
		setUpperCaseValid(/[A-Z]/.test(value));
		setNumberValid(/[0-9]/.test(value));
		setSpecialCharValid(/[!@#$%^&*(),.?":{}|<>]/.test(value));
		setLengthValid(value.length >= 8);
	};

	useEffect(() => {
		if (hasProcessed.current) return;
		hasProcessed.current = true;

		console.log("Verifying email link...");
		setStatusMessage("Verifying your email link...");

		// 🔥 Extract URL values now
		let email;
		let inviteId;
		let name;
		let isAdmin;
		let isTester;

		const urlParams = new URLSearchParams(window.location.search);
		const mode = urlParams.get("mode");
		const continueUrl = urlParams.get("continueUrl");

		if (mode === "resetPassword") {
			const oobCode = urlParams.get("oobCode");

			if (!oobCode) {
				console.warn("Missing password reset code.");
				setStatusMessage("Invalid or expired password reset link.");
				return;
			}

			verifyPasswordResetCode(auth, oobCode)
				.then((resetEmail) => {
					console.log(
						"Password reset code verified for:",
						resetEmail
					);
					setResetState({ oobCode, email: resetEmail });
				})
				.catch((error) => {
					console.error(
						"Password reset code verification failed:",
						error
					);
					setStatusMessage("Invalid or expired password reset link.");
				});

			return;
		}

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
			if (inviteId) {
				const inviteRef = doc(db, "Invites", inviteId);
				const inviteSnap = await getDoc(inviteRef);
				if (inviteSnap.exists()) {
					const inviteData = inviteSnap.data();

					if (inviteData.Status === "Confirmed") {
						console.log("Invite already confirmed — going to Home");
						navigate("/Home", { replace: true });
						return;
					}
				}
			} else {
				console.log("No inviteId present in link.");
				alert("No inviteId present in link.");
				return;
			}

			// If already signed in — skip link handling & go straight forward
			if (user) {
				//alert("User already authenticated — skipping verification");
				console.log(
					"User already authenticated — skipping verification"
				);
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

	const handleResetPassword = async (e) => {
		e.preventDefault();
		if (newPassword !== confirmPassword) return;
		if (
			!lowerCaseValid ||
			!upperCaseValid ||
			!numberValid ||
			!specialCharValid ||
			!lengthValid
		)
			return;
		setIsLoading(true);
		try {
			await confirmPasswordReset(auth, resetState.oobCode, newPassword);
			setResetSuccess(true);
		} catch (error) {
			console.error("Password reset failed:", error);
			alert("Failed to reset password. The link may have expired.");
		} finally {
			setIsLoading(false);
		}
	};

	if (resetState) {
		return (
			<Box sx={{ bgcolor: "primary.main", height: "100vh" }}>
				<Container fixed>
					<Box
						sx={{
							height: "100vh",
							overflow: "auto",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center"
						}}>
						<Box
							component='img'
							src={logo}
							alt='Padel HookUps Logo'
							sx={{ width: 150, height: 150 }}
						/>
						<Typography
							variant='h4'
							sx={{
								mt: 5,
								mb: 1,
								textAlign: "center",
								color: "secondary.main"
							}}>
							<b>Reset Password</b>
						</Typography>
						<Typography variant='subtitle1' sx={{ color: "#fff", textAlign: "center" }}>
							Set a new password for {resetState.email}
						</Typography>
						<Box
							component='form'
							onSubmit={handleResetPassword}
							sx={{
								color: "#fff",
								"& > :not(style)": { mt: 4 },
								width: {
									xs: "75%",
									sm: "75%",
									md: "50%",
									lg: "50%",
									xl: "50%"
								}
							}}>
							{/* New Password */}
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "secondary.main",
											borderWidth: "2px"
										}
									}}>
									<InputLabel
										htmlFor='newPassword'
										sx={{
											bgcolor: "secondary.main",
											p: 0.5,
											borderRadius: 1,
											color: "primary.main",
											fontWeight: "bold"
										}}>
										New Password
									</InputLabel>
									<OutlinedInput
										id='newPassword'
										type={
											showPassword ? "text" : "password"
										}
										value={newPassword}
										autoComplete='new-password'
										required
										onChange={(e) =>
											handlePasswordChange(e.target.value)
										}
										onFocus={() =>
											setIsPasswordFocused(true)
										}
										onBlur={() =>
											setIsPasswordFocused(false)
										}
										sx={{ bgcolor: "#fff" }}
										startAdornment={
											<InputAdornment position='start'>
												<Lock
													sx={{
														color: "action.active",
														mr: 1,
														my: 0.5
													}}
												/>
											</InputAdornment>
										}
										endAdornment={
											<InputAdornment position='end'>
												{showPassword ? (
													<VisibilityOff
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
														onClick={() =>
															setShowPassword(
																false
															)
														}
													/>
												) : (
													<Visibility
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
														onClick={() =>
															setShowPassword(
																true
															)
														}
													/>
												)}
											</InputAdornment>
										}
										label='New Password'
									/>
								</FormControl>
								{(newPassword || isPasswordFocused) && (
									<Box
										sx={{
											mt: 1,
											p: 2,
											display: "flex",
											flexDirection: "column",
											backgroundColor: "grey.100",
											borderRadius: 2
										}}>
										<Typography
											variant='body2'
											sx={{
												mb: 0.5,
												fontWeight: "bold"
											}}>
											Password requirements:
										</Typography>
										{[
											[
												lowerCaseValid,
												"Contains lowercase letter"
											],
											[
												upperCaseValid,
												"Contains uppercase letter"
											],
											[
												numberValid,
												"Contains numeric character"
											],
											[
												specialCharValid,
												"Contains special character (!@#$%^&*)"
											],
											[
												lengthValid,
												"At least 8 characters long"
											]
										].map(([valid, label]) => (
											<Box
												key={label}
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{valid ? (
													<Check
														sx={{
															color: "success.main",
															mr: 1
														}}
														fontSize='small'
													/>
												) : (
													<Close
														sx={{
															color: "error.main",
															mr: 1
														}}
														fontSize='small'
													/>
												)}
												<Typography
													variant='caption'
													sx={{
														color: "text.secondary"
													}}>
													{label}
												</Typography>
											</Box>
										))}
									</Box>
								)}
							</Box>
							{/* Confirm Password */}
							<Box sx={{ width: "100%" }}>
								<FormControl
									sx={{
										width: "100%",
										"&:focus-within": {
											borderColor: "secondary.main",
											borderWidth: "2px"
										}
									}}>
									<InputLabel
										htmlFor='confirmPassword'
										sx={{
											bgcolor: "secondary.main",
											p: 0.5,
											borderRadius: 1,
											color: "primary.main",
											fontWeight: "bold"
										}}>
										Confirm Password
									</InputLabel>
									<OutlinedInput
										id='confirmPassword'
										type={
											showConfirmPassword
												? "text"
												: "password"
										}
										value={confirmPassword}
										autoComplete='new-password'
										required
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										onFocus={() =>
											setIsConfirmPasswordFocused(true)
										}
										onBlur={() =>
											setIsConfirmPasswordFocused(false)
										}
										sx={{ bgcolor: "#fff" }}
										startAdornment={
											<InputAdornment position='start'>
												<Lock
													sx={{
														color: "action.active",
														mr: 1,
														my: 0.5
													}}
												/>
											</InputAdornment>
										}
										endAdornment={
											<InputAdornment position='end'>
												{showConfirmPassword ? (
													<VisibilityOff
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
														onClick={() =>
															setShowConfirmPassword(
																false
															)
														}
													/>
												) : (
													<Visibility
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
														onClick={() =>
															setShowConfirmPassword(
																true
															)
														}
													/>
												)}
											</InputAdornment>
										}
										label='Confirm Password'
									/>
								</FormControl>
								{newPassword &&
									(confirmPassword ||
										isConfirmPasswordFocused) && (
										<Box
											sx={{
												mt: 1,
												p: 2,
												display: "flex",
												flexDirection: "column",
												backgroundColor: "grey.100",
												borderRadius: 2
											}}>
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{newPassword ===
													confirmPassword &&
												confirmPassword.trim() !==
													"" ? (
													<Check
														sx={{
															color: "success.main",
															mr: 1
														}}
														fontSize='small'
													/>
												) : (
													<Close
														sx={{
															color: "error.main",
															mr: 1
														}}
														fontSize='small'
													/>
												)}
												<Typography
													variant='caption'
													sx={{
														color: "text.secondary"
													}}>
													Passwords must match
												</Typography>
											</Box>
										</Box>
									)}
							</Box>
							{/* Submit */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexDirection: "column",
									width: "100%"
								}}>
								<Button
									fullWidth
									variant='contained'
									color='secondary'
									type='submit'
									disabled={
										isLoading ||
										newPassword !== confirmPassword ||
										!lowerCaseValid ||
										!upperCaseValid ||
										!numberValid ||
										!specialCharValid ||
										!lengthValid
									}
									sx={{ mb: 4 }}>
									{isLoading ? (
										<CircularProgress
											size={24}
											sx={{ mr: 1, color: "#fff" }}
										/>
									) : null}
									<Typography
										variant='body1'
										sx={{
											color: "primary.main",
											textTransform: "capitalize",
											fontWeight: "bold"
										}}>
										Set New Password
									</Typography>
									<ChevronRight
										sx={{ color: "primary.main" }}
									/>
								</Button>
							</Box>
						</Box>
					</Box>
				</Container>
				<SuccessModal
					open={resetSuccess}
					onClose={() => navigate("/")}
					_title='Password updated!'
					_description='Your password has been reset. You can now log in with your new password.'
					_buttonText='Go to Login'
					_navigateTo='/'
					_navigate={true}
				/>
			</Box>
		);
	}

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				height: "100vh"
			}}>
			<div>{statusMessage}</div>
		</div>
	);
}
