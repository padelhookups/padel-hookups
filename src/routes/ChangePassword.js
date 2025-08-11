import { useEffect, useState } from "react";

/* FIREBASE */
import { updatePassword } from "firebase/auth";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";

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
	ChevronRight,
	Email,
	Lock,
	Visibility,
	VisibilityOff,
	Check,
	Close
} from "@mui/icons-material";

import logo from "../images/LogoWhite.svg";
import SuccessModal from "../components/SuccessModal";

function ChangePassword() {
	const { user } = useAuth();
	const auth = firebase.auth;

	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
		useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [lowerCaseValid, setLowerCaseValid] = useState(false);
	const [upperCaseValid, setUpperCaseValid] = useState(false);
	const [numberValid, setNumberValid] = useState(false);
	const [specialCharValid, setSpecialCharValid] = useState(false);
	const [lengthValid, setLengthValid] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const handlePasswordChange = (value) => {
		setNewPassword(value);
		passwordValidation(value);
	};

	const passwordValidation = (passwordValue = newPassword) => {
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

		// Check if passwords match before proceeding
		if (newPassword !== confirmPassword) {
			return; // Don't submit if passwords don't match
		}

		// Check if password meets all requirements
		if (
			!lowerCaseValid ||
			!upperCaseValid ||
			!numberValid ||
			!specialCharValid ||
			!lengthValid
		) {
			return; // Don't submit if password doesn't meet requirements
		}

		setIsLoading(true);

		try {
			updatePassword(auth.currentUser, newPassword)
				.then(() => {
					setIsLoading(false);
					setShowSuccess(true);
				})
				.catch((error) => {
					// An error ocurred
					// ...
				});
		} catch (error) {
			console.error("Error changing password", error);
			setIsLoading(false);
			alert("Error changing password. Please try again.");
		}
	};

	useEffect(() => {
		setEmail(user?.email || "");
	}, [user]);

	return (
		<Container
			fixed
			sx={{
				maxHeight: "calc(100vh - 60px)",
				height: "calc(100vh - 60px)"
			}}>
			<Box
				sx={{
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					pb: "80px"
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
					<b>Change Password</b>
				</Typography>
				<Typography variant='subtitle1'>
					Change your account password
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
							<InputLabel htmlFor='email'>Email</InputLabel>
							<OutlinedInput
								id='email'
								value={email}
								disabled={!!email}
								type='email'
								autoComplete='email'
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
							<InputLabel htmlFor='newPassword'>
								New Password
							</InputLabel>
							<OutlinedInput
								id='newPassword'
								value={newPassword}
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
								}
							}}>
							<InputLabel htmlFor='confirmPassword'>
								Confirm Password
							</InputLabel>
							<OutlinedInput
								id='confirmPassword'
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
					{newPassword &&
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
									newPassword !== confirmPassword ||
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
							disabled={
								isLoading ||
								(newPassword &&
									confirmPassword &&
									newPassword !== confirmPassword) ||
								(newPassword &&
									(!lowerCaseValid ||
										!upperCaseValid ||
										!numberValid ||
										!specialCharValid ||
										!lengthValid))
							}
							id='change-password-button'>
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
								Update Password
							</Typography>
							<ChevronRight sx={{ color: "#fff" }} />
						</Button>
					</Box>
				</Box>
				{/* MUI Success Modal */}
				<SuccessModal
					open={showSuccess}
					onClose={() => setShowSuccess(false)}
					_title='Password changed!'
					_description='You can now use your new password to log in.'
					_buttonText='Continue'
					_navigateTo='/Settings'
					_navigate={true}
				/>
			</Box>
		</Container>
	);
}

export default ChangePassword;
