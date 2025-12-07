import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";

/* FIREBASE */
import firebase from "../firebase-config";
import {
	validatePassword,
	updatePassword,
	updateProfile,
	onAuthStateChanged,
	reauthenticateWithEmailLink
} from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

/* UI Imports */
import {
	Box,
	Button,
	CircularProgress,
	Container,
	FormControl,
	InputAdornment,
	InputLabel,
	Link,
	OutlinedInput,
	Switch,
	Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
	AccountCircle,
	Check,
	Close,
	ChevronRight,
	Email,
	Lock,
	Visibility,
	VisibilityOff,
	Cake
} from "@mui/icons-material";

import logo from "../images/LogoWhite.svg";
import SuccessModal from "../components/SuccessModal";

function SignUp() {
	const auth = firebase.auth;
	const db = getFirestore(firebase.app);
	const navigate = useNavigate();

	/** STATE */
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [dateOfBirth, setDateOfBirth] = useState(null);

	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [isTermsAccepted, setIsTermsAccepted] = useState(false);
	const [isRgpdAccepted, setIsRgpdAccepted] = useState(false);

	const [lowerCaseValid, setLowerCaseValid] = useState(false);
	const [upperCaseValid, setUpperCaseValid] = useState(false);
	const [numberValid, setNumberValid] = useState(false);
	const [specialCharValid, setSpecialCharValid] = useState(false);
	const [lengthValid, setLengthValid] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [authReady, setAuthReady] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	/** URL Params */
	const urlParams = new URLSearchParams(window.location.search);
	const emailFromLink = urlParams.get("email");
	const inviteId = urlParams.get("inviteId");
	const isAdmin = urlParams.get("isAdmin")?.toLowerCase() === "true";
	const isTester = urlParams.get("isTester")?.toLowerCase() === "true";
	const nameFromLink = urlParams.get("name") || "";
	const storedEmail = localStorage.getItem("emailForSignIn");

	/** 1️⃣ Wait for Firebase auth state to hydrate */
	useEffect(() => {
		const unsub = onAuthStateChanged(auth, () => {
			setAuthReady(true);
		});
		return unsub;
	}, [auth]);

	/** 2️⃣ Resolve email only after auth hydration */
	useEffect(() => {
		if (!authReady) return;

		const resolvedEmail =
			emailFromLink || storedEmail || auth.currentUser?.email;

		if (!resolvedEmail) {
			console.error("Email missing — aborting setup");
			navigate("/");
			return;
		}

		setEmail(resolvedEmail);
		if (nameFromLink) setName(nameFromLink);

		if (!inviteId) {
			console.error("Missing invite");
			navigate("/");
			return;
		}

		localStorage.removeItem("emailForSignIn");
	}, [authReady, emailFromLink, storedEmail, inviteId, nameFromLink, navigate]);

	/** Password live validation */
	const passwordValidation = useCallback((value) => {
		setLowerCaseValid(/[a-z]/.test(value));
		setUpperCaseValid(/[A-Z]/.test(value));
		setNumberValid(/[0-9]/.test(value));
		setSpecialCharValid(/[!@#$%^&*(),.?":{}|<>]/.test(value));
		setLengthValid(value.length >= 8);
	}, []);

	const handlePasswordChange = (value) => {
		setPassword(value);
		passwordValidation(value);
	};

	/** Confirm remote password policy */
	const validatePasswordJS = async () => {
		try {
			const status = await validatePassword(auth, password);
			return status?.isValid;
		} catch (error) {
			alert("Error validating password: " + error.message);
			return false;
		}
	};

	/** Submit Handler */
	const handleSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (!authReady || isLoading) return;

		setIsLoading(true);

		const validPassword = await validatePasswordJS();
		if (!validPassword) {
			alert("Password does not meet requirements.");
			setIsLoading(false);
			return;
		}

		await validateInvite();
	};

	/** 1️⃣ Validate Invite */
	const validateInvite = async () => {
		try {
			const docRef = doc(db, "Invites", inviteId);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				alert("Invalid or expired invitation.");
				setIsLoading(false);
				navigate("/");
				return;
			}

			await setDoc(docRef, { Status: "Confirmed" }, { merge: true });
			await setupAccount();
		} catch (error) {
			alert("Error validating invitation: " + error.message);
			setIsLoading(false);
		}
	};

	/** 2️⃣ Setup Account — password + profile + db record */
	const setupAccount = async () => {
		try {
			const user = auth.currentUser;
			if (!user) {
				alert("Your login session was lost. Please reopen your email link.");
				navigate("/");
				return;
			}

			// 🔹 Update password
			try {
				await updatePassword(user, password);
				console.log("Password updated");
			} catch (e) {
				if (e.code === "auth/requires-recent-login") {
					alert("Session expired — please log in again.");
					navigate("/");
					return;
				}
				console.warn("Password update skipped:", e.message);
			}

			// 🔹 Update profile name
			await updateProfile(user, { displayName: name });

			// 🔹 Create user record
			await writeUserData();

		} catch (error) {
			alert("Setup failed: " + error.message);
			setIsLoading(false);
		}
	};

	/** 3️⃣ Save Firestore User Record */
	const writeUserData = async () => {
		try {
			const user = auth.currentUser;
			const docRef = doc(db, "Users", user.uid);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				await setDoc(docRef, {
					Name: name,
					Email: email,
					DateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : null,
					InviteId: inviteId,
					CreatedAt: new Date(),
					LastLoginAt: new Date(),
					LastModifiedAt: new Date(),
					TotalSavings: 0,
					IsAdmin: isAdmin,
					IsTester: isTester,
					TermsAccepted: isTermsAccepted,
					RgpdAccepted: isRgpdAccepted
				});
			}

			setIsLoading(false);
			setShowSuccess(true);
		} catch (error) {
			alert("User creation failed: " + error.message);
			setIsLoading(false);
		}
	};

	/** UI render unchanged */
	return (
		<Container fixed>
			<Box
				sx={{
					minHeight: "100vh",
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center"
				}}
			>
				{/* === UI stays unchanged === */}
				{!authReady ? (
					<CircularProgress sx={{ mt: 4 }} />
				) : (
					<>
						{/** Your full JSX form here (unchanged) */}
						{/* Skipped here because your UI code is valid */}
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<Box
								component='form'
								onSubmit={handleSubmit}
								sx={{
									"& > :not(style)": { mt: 4 },
									width: {
										xs: "75%", // full width on small screens
										sm: "75%", // still full on small (or slightly wider)
										md: "50%", // 50% on medium
										lg: "50%", // narrower on large screens
										xl: "50%" // even narrower on extra large
									}
								}}>
								<Box
									sx={{
										width: "100%"
									}}>
									<FormControl
										sx={{
											width: "100%",
											"&:focus-within": {
												borderColor: "primary.main",
												borderWidth: "2px" // outer second border
											}
										}}>
										<InputLabel htmlFor='name'>Name</InputLabel>
										<OutlinedInput
											fullWidth
											id='name'
											type='text'
											value={name}
											autoComplete='name'
											required
											onChange={(e) => setName(e.target.value)}
											startAdornment={
												<InputAdornment position='start'>
													<AccountCircle
														sx={{
															".Mui-focused &": {
																color: "primary.main"
															},
															mr: 1,
															my: 0.5,
															cursor: "pointer"
														}}
													/>
												</InputAdornment>
											}
											endAdornment={
												// Empty space to balance layout
												<InputAdornment position='end'>
													<Box sx={{ width: 30 }} />{" "}
													{/* width matches icon button */}
												</InputAdornment>
											}
											label='Name'
										/>
									</FormControl>
								</Box>
								<Box
									sx={{
										width: "100%"
									}}>
									<FormControl
										sx={{
											width: "100%",
											"&:focus-within": {
												borderColor: "primary.main",
												borderWidth: "2px" // outer second border
											}
										}}>
										<InputLabel htmlFor='email'>Email</InputLabel>
										<OutlinedInput
											id='email'
											value={email}
											type='email'
											autoComplete='email'
											disabled={!!emailFromLink}
											required
											onChange={(e) => setEmail(e.target.value)}
											startAdornment={
												<InputAdornment position='start'>
													<Email
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															".Mui-focused &": {
																color: "primary.main"
															}
														}}
													/>
												</InputAdornment>
											}
											endAdornment={<Box sx={{ width: 40 }} />}
											label='Email'
										/>
									</FormControl>
								</Box>
								<Box sx={{ width: "100%" }}>
									<DatePicker
										label="Date of Birth"
										value={dateOfBirth}
										onChange={(newValue) => setDateOfBirth(newValue)}
										slotProps={{
											textField: {
												fullWidth: true,
												required: true,
												InputProps: {
													startAdornment: (
														<InputAdornment position='start'>
															<Cake
																sx={{
																	color: "action.active",
																	mr: 1,
																	my: 0.5,
																	".Mui-focused &": {
																		color: "primary.main"
																	}
																}}
															/>
														</InputAdornment>
													),
													endAdornment: (
														<InputAdornment position='end'>
															<Box sx={{ width: 30 }} />
														</InputAdornment>
													)
												}
											}
										}}
									/>
								</Box>
								<Box
									sx={{
										width: "100%"
									}}>
									<FormControl
										sx={{
											width: "100%",
											"&:focus-within": {
												borderColor: "primary.main",
												borderWidth: "2px" // outer second border
											}
										}}>
										<InputLabel htmlFor='password'>Password</InputLabel>
										<OutlinedInput
											id='password'
											value={password}
											type={showPassword ? "text" : "password"}
											autoComplete='new-password'
											required
											onChange={(e) =>
												handlePasswordChange(e.target.value)
											}
											onFocus={() => setIsPasswordFocused(true)}
											onBlur={() => setIsPasswordFocused(false)}
											startAdornment={
												<InputAdornment position='start'>
													<Lock
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															".Mui-focused &": {
																color: "primary.main"
															}
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
																setShowPassword(false)
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
																setShowPassword(true)
															}
														/>
													)}
												</InputAdornment>
											}
											label='Password'
										/>
									</FormControl>
									{(password || isPasswordFocused) && (
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
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{lowerCaseValid ? (
													<Check
														sx={{
															color: "success.main",
															mr: 1
														}}
														fontSize='small'
													/>
												) : (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												)}
												<Typography
													variant='caption'
													sx={{
														color: "text.secondary"
													}}>
													Contains lowercase letter
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{upperCaseValid ? (
													<Check
														sx={{
															color: "success.main",
															mr: 1
														}}
														fontSize='small'
													/>
												) : (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												)}
												<Typography
													variant='caption'
													sx={{
														color: "text.secondary"
													}}>
													Contains uppercase letter
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{!numberValid ? (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												) : (
													<Check
														sx={{
															color: "success.main",
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
													Contains numeric character
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{!specialCharValid ? (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												) : (
													<Check
														sx={{
															color: "success.main",
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
													Contains special character (!@#$%^&*)
												</Typography>
											</Box>
											<Box
												sx={{
													display: "flex",
													flexDirection: "row",
													alignItems: "center"
												}}>
												{!lengthValid ? (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												) : (
													<Check
														sx={{
															color: "success.main",
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
													At least 8 characters long
												</Typography>
											</Box>
										</Box>
									)}
								</Box>
								<Box
									sx={{
										width: "100%"
									}}>
									<FormControl
										sx={{
											width: "100%",
											"&:focus-within": {
												borderColor: "primary.main",
												borderWidth: "2px" // outer second border
											},
											mb: 0
										}}>
										<InputLabel htmlFor='confirm-password'>
											Confirm Password
										</InputLabel>
										<OutlinedInput
											id='confirm-password'
											value={confirmPassword}
											type={showConfirmPassword ? "text" : "password"}
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
											startAdornment={
												<InputAdornment position='start'>
													<Lock
														sx={{
															color: "action.active",
															mr: 1,
															my: 0.5,
															".Mui-focused &": {
																color: "primary.main"
															}
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
																setShowConfirmPassword(true)
															}
														/>
													)}
												</InputAdornment>
											}
											label='Confirm Password'
										/>
									</FormControl>
								</Box>
								{password &&
									(confirmPassword || isConfirmPasswordFocused) && (
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
												{confirmPassword === null ||
													password !== confirmPassword ||
													confirmPassword.trim() === "" ? (
													<Close
														sx={{ color: "error.main", mr: 1 }}
														fontSize='small'
													/>
												) : (
													<Check
														sx={{
															color: "success.main",
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
													Password must match
												</Typography>
											</Box>
										</Box>
									)}
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										width: "100%",
										mt: "0 !important",
										pt: 2
									}}>
									<Switch
										required
										checked={isTermsAccepted}
										onChange={(e) => setIsTermsAccepted(e.target.checked)}
									/>
									<Typography
										variant='body2'
										sx={{
											ml: 0,
											fontSize: "0.875rem",
											fontWeight: 500,
											lineHeight: 1.4,
											whiteSpace: "normal",
											wordBreak: "break-word",
											maxWidth: "75%" // ensures wrapping
										}}>
										I agree to the{" "}
										<Link href='/SignUp' color='primary'>
											Terms of Service{" "}
										</Link>
										and{" "}
										<Link href='/privacy' color='primary'>
											Privacy Policy
										</Link>
									</Typography>
								</Box>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										width: "100%",
										mt: "0 !important",
										pt: 1
									}}>
									<Switch
										required
										checked={isRgpdAccepted}
										onChange={(e) => setIsRgpdAccepted(e.target.checked)}
									/>
									<Typography
										variant='body2'
										sx={{
											ml: 0,
											fontSize: "0.875rem",
											fontWeight: 500,
											lineHeight: 1.4,
											whiteSpace: "normal",
											wordBreak: "break-word",
											maxWidth: "75%" // ensures wrapping
										}}>
										I consent to the processing of my personal data in accordance with{" "}
										<Link href='/rgpd' color='primary'>
											GDPR regulations
										</Link>
									</Typography>
								</Box>
								<Box
									sx={{
										display: "flex",
										alignItems: "flex-center",
										justifyContent: "center",
										flexDirection: "column",
										maxWidth: "100%",
										width: "100%"
									}}>
									<Button
										fullWidth
										variant='contained'
										type='submit'
										id='sign-in-button'
										disabled={!isTermsAccepted || !isRgpdAccepted}>
										{isLoading ? (
											<CircularProgress
												size={24}
												sx={{ mr: 1, color: "#fff" }}
											/>
										) : null}
										<Typography
											variant='body1'
											sx={{
												color: "#fff",
												textTransform: "capitalize",
												fontWeight: "bold"
											}}>
											Update Account
										</Typography>
										<ChevronRight sx={{ color: "#fff" }} />
									</Button>
									<Typography
										sx={{
											mt: 2,
											textAlign: "center",
											color: "text.secondary"
										}}>
										Already have an account?{" "}
										<Link href='/' color='primary'>
											Sign In
										</Link>
									</Typography>
								</Box>
							</Box>
						</LocalizationProvider>
					</>
				)}
			</Box>

			<SuccessModal
				open={showSuccess}
				onClose={() => setShowSuccess(false)}
				_title="Game, Set, Match!"
				_description="Welcome to the padel community!"
				_buttonText="Let's Play!"
				_navigateTo="/Home"
				_navigate={true}
			/>
		</Container>
	);
}

export default SignUp;
