import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
	signInWithEmailAndPassword,
	setPersistence,
	browserLocalPersistence
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";

import {
	Box,
	Button,
	CircularProgress,
	Container,
	FormControl,
	FormControlLabel,
	InputAdornment,
	InputLabel,
	OutlinedInput,
	Switch,
	Typography
} from "@mui/material";

import {
	AccountCircle,
	ChevronRight,
	Lock,
	Visibility
} from "@mui/icons-material";
import logo from "../images/LogoWhite.svg";

function Login() {
	const auth = firebase.auth;
	const db = firebase.db;
	const navigate = useNavigate();
	const { user, loading } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		console.log("useEffect Login - user:", user);

		// If user is authenticated and not loading, redirect to home
		if (user && !loading) {
			console.log("User authenticated, redirecting to /Home");
			updateUser();
		}
	}, [user, loading]);

	const handleSubmit = (e) => {
		e.preventDefault();
		login();
	};

	const updateUser = async () => {
		console.log("Updating user information...");
		// Add your user update logic here
		await updateDoc(doc(db, "Users", user.uid), {
			LastLoginAt: new Date()
		});
		navigate("/Home", { replace: true });
	}

	const login = () => {
		setIsLoading(true);

		setPersistence(auth, browserLocalPersistence)
			.then(() => {
				return signInWithEmailAndPassword(auth, email, password)
					.then((userCredential) => {
						console.log("user logged in successfully");
						// Navigate to home after successful manual login
						//navigate("/Home");
					})
					.catch((error) => {
						console.log("Error logging in:", error);
					})
					.finally(() => {
						setIsLoading(false);
					});
			})
			.catch((error) => {
				// Handle Errors here.
				console.log("Error setting persistence:", error);
			});
	};

	return (
		<Container fixed>
			<Box
				sx={{
					minHeight: "100vh",
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
					<b>Welcome to Padel Hookups</b>
				</Typography>
				<Typography variant='subtitle1'>
					Sign in to your account to continue
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
								fullWidth
								id='email'
								type='email'
								required
								autoComplete='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
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
								type='password'
								required
								autoComplete='current-password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
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
										<Visibility
											sx={{
												color: "action.active",
												mr: 1,
												my: 0.5,
												cursor: "pointer"
											}}
										/>
									</InputAdornment>
								}
								label='Password'
							/>
						</FormControl>
					</Box>
					<Box
						sx={{
							width: "100%",
							mt: "0 !important",
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center"
						}}>
						<FormControlLabel
							sx={{
								width: "50%",
								"& .MuiFormControlLabel-label": {
									fontSize: "0.875rem", // Smaller font (e.g. 14px)
									fontWeight: 500 // Optional: make it lighter or bolder
								}
							}}
							control={<Switch />}
							label='Remember me?'
						/>
						<Typography
							variant='body2'
							sx={{
								color: "primary.main",
								cursor: "pointer",
								"&:hover": {
									textDecoration: "underline"
								}
							}}>
							Forgot Password?
						</Typography>
					</Box>
					<Button
						fullWidth
						variant='contained'
						type='submit'
						disabled={isLoading}
						sx={{
							"&.Mui-disabled": {
								backgroundColor: "primary.main",
								color: "#fff"
							}
						}}
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
							Login
						</Typography>
						<ChevronRight sx={{ color: "#fff" }} />
					</Button>
				</Box>
			</Box>
		</Container>
	);
}

export default Login;
