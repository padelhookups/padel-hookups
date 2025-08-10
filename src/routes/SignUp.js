import { useEffect, useState } from "react"; // make sure this is imported
import { useNavigate } from "react-router";

/* FIREBASE */
import firebase from "../firebase-config";
import { validatePassword, updatePassword } from "firebase/auth";
import { doc, getDoc, getFirestore,setDoc } from "firebase/firestore";

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
import {
	AccountCircle,
	Check,
	Close,
	ChevronRight,
	Email,
	Lock,
	Visibility,
	VisibilityOff
} from "@mui/icons-material";

import logo from "../images/LogoWhite.svg";
import SuccessModal from "../components/SuccessModal";

function SignUp() {
	const auth = firebase.auth;
	const db = getFirestore(firebase.app);
	const navigate = useNavigate();
	
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
		useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	//const [isTermsAccepted, setIsTermsAccepted] = useState(false);
	const [lowerCaseValid, setLowerCaseValid] = useState(false);
	const [upperCaseValid, setUpperCaseValid] = useState(false);
	const [numberValid, setNumberValid] = useState(false);
	const [specialCharValid, setSpecialCharValid] = useState(false);
	const [lengthValid, setLengthValid] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const urlParams = new URLSearchParams(window.location.search);
	const emailFromLink = urlParams.get("email");
	const inviteId = urlParams.get("inviteId");
	const isAdmin = urlParams.get("isAdmin") || false;
	const nameFromLink = urlParams.get("name") || "";
	console.log("Invite ID from URL:", inviteId);
	console.log("IsAdmin from URL:", isAdmin);
	console.log("Name from URL:", nameFromLink);

	useEffect(() => {
		if (!emailFromLink) {
			console.error("Email is missing from URL.");
			navigate("/");
		} else {
			setEmail(emailFromLink);
		}

		if (nameFromLink) {
			setName(nameFromLink);
		}

		if (!inviteId) {
			console.error("Invite ID is missing from URL.");
			navigate("/");
		}
	}, [emailFromLink, inviteId, navigate]);

	const validatePasswordJS = async () => {
		const status = await validatePassword(auth, password);
		console.log(status);

		if (!status.isValid) {
			// Password could not be validated. Use the status to show what
			// requirements are met and which are missing.
			// If a criterion is undefined, it is not required by policy. If the
			// criterion is defined but false, it is required but not fulfilled by
			// the given password. For example:
		}
		return status.isValid;
	};

	const handlePasswordChange = (value) => {
		setPassword(value);
		passwordValidation(value);
	};

	const passwordValidation = (passwordValue = password) => {
		setLowerCaseValid(/[a-z]/.test(passwordValue));
		setUpperCaseValid(/[A-Z]/.test(passwordValue));
		setNumberValid(/[0-9]/.test(passwordValue));
		setSpecialCharValid(/[!@#$%^&*(),.?":{}|<>]/.test(passwordValue));
		setLengthValid(passwordValue.length >= 8);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (isLoading) return;

		const validPassword = await validatePasswordJS();
		if (!validPassword) {
			alert("Password does not meet complexity requirements.");
			return;
		}

		setIsLoading(true);
		validateValidInvitation();
	};

	const validateValidInvitation = async () => {
		// query firestore
		// If valid, proceed with sign up
		const docRef = doc(db, "Invites", inviteId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			console.error("No valid invitation found for ID:", inviteId);
			setIsLoading(false);
			alert("Invalid or expired invitation link.");
			navigate("/");
		} else {
			handleUserPassword();
		}
	};

	const handleUserPassword = () => {
		updatePassword(auth.currentUser, password)
			.then(() => {
				handleUser();
			})
			.catch((error) => {
				// An error ocurred
				// ...
			});
	};

	const handleUser = async () => {
		const docRef = doc(db, "Users", auth.currentUser.uid);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			console.warn("Non existent user, will be created");
			// Create user document in Firestore
			await setDoc(docRef, {
				Name: name,
				Email: email,
				CreatedAt: new Date(),
				LastLoginAt: new Date(),
				InviteId: inviteId,
				IsAdmin: isAdmin
			});
		}
		setIsLoading(false);
		setShowSuccess(true);
	};

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
				}}>
				<Box
					component='img'
					src={logo}
					alt='Padel HookUps Logo'
					sx={{
						width: 150,
						height: 150
					}}
				/>
				<Typography
					variant='h4'
					sx={{ mt: 5, mb: 1, textAlign: "center" }}>
					<b>Create your account</b>
				</Typography>
				<Typography variant='subtitle1'>
					Join the Padel Hookups community
				</Typography>
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
						<Switch required />
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
							id='sign-in-button'>
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
				{/* MUI Success Modal */}
				<SuccessModal
					open={showSuccess}
					onClose={() => setShowSuccess(false)}
					_title="Game, Set, Match!"
					_description="Welcome to the padel community! Your racket is ready and the courts are waiting for your next hookup."
					_buttonText="Let's Play!"
					_navigateTo="/Home"
					_navigate={true}
				/>
			</Box>
		</Container>
	);
}

export default SignUp;
