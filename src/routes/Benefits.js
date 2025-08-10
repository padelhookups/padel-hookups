import { useEffect, useState } from "react";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";
import { collection, getDocs, addDoc } from "firebase/firestore";

import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Fab,
	FormControl,
	InputAdornment,
	InputLabel,
	Grid,
	OutlinedInput,
	TextField,
	Typography,
	SwipeableDrawer
} from "@mui/material";
import {
	Add,
	Link,
	LocalOffer,
	Percent,
	TextSnippet
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import SuccessModal from "../components/SuccessModal";

const Puller = styled(Box)(({ theme }) => ({
	width: 30,
	height: 6,
	backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
	borderRadius: 3,
	position: "absolute",
	top: 8,
	left: "calc(50% - 15px)"
}));

const StyledBox = styled("div")(({ theme }) => ({
	backgroundColor: "#fff",
	...theme.applyStyles("dark", {
		backgroundColor: grey[800]
	})
}));

const Benefits = () => {
	const db = firebase.db;
	const { user } = useAuth();

	const [benefits, setBenefits] = useState([]);
	const [open, setOpen] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [discount, setDiscount] = useState("");
	const [website, setWebsite] = useState("");
	const [couponCode, setCouponCode] = useState("");

	useEffect(() => {
		const fetchBenefits = async () => {
			try {
				const benefitsCollection = collection(db, "Benefits");
				const benefitsSnapshot = await getDocs(benefitsCollection);
				if (benefitsSnapshot.empty) {
					console.log("No benefits found");
				} else {
					const benefitsData = benefitsSnapshot.docs.map((doc) =>
						doc.data()
					);
					setBenefits(benefitsData);
				}
			} catch (error) {
				console.error("Error fetching benefits:", error);
			}
		};
		console.log("Fetching benefits...");
		fetchBenefits();
	}, [db, showSuccess]); // Add showSuccess as dependency to refetch when a new benefit is added

	const handleSubmit = async (e) => {
		e.preventDefault();
		//Insert in Firestore
		const newBenefit = {
			Name: name,
			Description: description,
			Discount: discount,
			Website: website,
			CouponCode: couponCode
		};
		// Insert in Firestore using v9+ syntax
		try {
			await addDoc(collection(db, "Benefits"), newBenefit);
			console.log("New benefit added:", newBenefit);
			// Clear form fields
			setName("");
			setDescription("");
			setDiscount("");
			setWebsite("");
			setCouponCode("");
			setOpen(false);
			setShowSuccess(true);
		} catch (error) {
			console.error("Error adding benefit:", error);
		}
	};

	return (
		<>
			<Box sx={{ pb: 12, px: 0, position: "relative" }}>
				<Card
					sx={{
						px: 4,
						mb: 4,
						backgroundColor: "primary.main",
						color: "white",
						boxShadow: "none"
					}}>
					<CardContent sx={{ textAlign: "left", py: 4, px: 0 }}>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center"
							}}>
							<span
								style={{
									fontSize: "32px",
									marginBottom: "8px"
								}}>
								🤝
							</span>
							<Typography
								variant='h5'
								component='h1'
								sx={{ mb: 0 }}>
								<b>Hookup Perks</b>
							</Typography>
						</Box>
						<Typography
							variant='body1'
							sx={{ opacity: 0.9, mb: 2, mt: 1, ml: 1 }}>
							Save money while improving your padel game with our
							partner network
						</Typography>
						<Box>
							<Card
								sx={{
									color: "white",
									backgroundColor: "rgb(255 255 255 / 0.3)",
									borderRadius: 3,
									boxShadow: "none"
								}}>
								<CardContent>
									<Typography variant='h6'>
										Total Savings
									</Typography>
									<Typography variant='h4'>
										<b>120€</b> 💰
									</Typography>
								</CardContent>
							</Card>
						</Box>
					</CardContent>
				</Card>
				<Box sx={{ px: 4 }}>
					{/* Partners Grid */}
					{/* <Typography
					variant='h5'
					component='h2'
					gutterBottom
					sx={{ fontWeight: "bold", mb: 3 }}>
					Our Partners
				</Typography> */}

					<Grid container spacing={3}>
						{benefits.map((benefit, index) => (
							<Grid
								item
								size={{ xs: 12, md: 6, lg: 3 }}
								key={index}>
								<Card
									sx={{
										height: "100%",
										display: "flex",
										flexDirection: "column",
										position: "relative"
									}}>
									<Chip
										label={
											<Typography
												variant='body1'
												sx={{ fontWeight: "bold" }}>
												{benefit.Discount} %
											</Typography>
										}
										sx={{
											position: "absolute",
											top: 16,
											right: 16,
											color: "white",
											backgroundColor: "primary.main",
											zIndex: 1
										}}
									/>
									<CardContent
										sx={{
											flexGrow: 1,
											borderLeft: "5px solid #b88f34",
											pt: 3
										}}>
										{/* Partner Header */}
										<Typography
											variant='h6'
											component='h2'
											sx={{ fontWeight: "bold", width: "70%" }}>
											{benefit.Name}
										</Typography>
										<Typography
											variant='body2'
											sx={{ opacity: 0.8 }}>
											{benefit.Description}
										</Typography>
										<Button
											variant='outlined'
											fullWidth
											color='primary'
											sx={{ mt: 2 }}>
											<Typography
												variant='button'
												sx={{ fontWeight: "bold" }}>
												Get Coupon
											</Typography>
										</Button>
									</CardContent>
								</Card>
							</Grid>
						))}
					</Grid>
				</Box>
				{user?.IsAdmin && (
					<Fab
						color='primary'
						aria-label='add'
						sx={{ position: "fixed", bottom: 76, right: 16 }}
						onClick={() => setOpen(true)}>
							<Add sx={{ color: "white" }} />
					</Fab>
				)}
				<SuccessModal
					open={showSuccess}
					_title='Benefit created!'
					onClose={() => setShowSuccess(false)}
					_description='Your benefit has been created and is now available.'
					_buttonText='Continue'
					_navigate={false}
				/>
			</Box>
			<SwipeableDrawer
				anchor='bottom'
				open={open}
				onClose={() => setOpen(false)}
				disableSwipeToOpen={true}
				keepMounted>
				<Puller />
				<StyledBox
					sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>
					<Box
						component='form'
						sx={{
							"& > :not(style)": { mt: 4 },
							pt: 4,
							pb: 2,
							px: 2
						}}
						onSubmit={handleSubmit}>
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
								<TextField
									fullWidth
									id='Name'
									type='Name'
									required
									autoComplete='off'
									value={name}
									label='Name'
									onChange={(e) => setName(e.target.value)}
									slotProps={{
										input: {
											startAdornment: (
												<InputAdornment position='start'>
													<LocalOffer
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
											),
											endAdornment: (
												<InputAdornment position='end'>
													<Box sx={{ width: 30 }} />{" "}
													{/* width matches icon button */}
												</InputAdornment>
											)
										}
									}}
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
								<InputLabel htmlFor='Description'>
									Description
								</InputLabel>
								<OutlinedInput
									fullWidth
									id='Description'
									type='text'
									required
									autoComplete='off'
									value={description}
									onChange={(e) =>
										setDescription(e.target.value)
									}
									startAdornment={
										<InputAdornment position='start'>
											<TextSnippet
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
									label='Description'
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
								<InputLabel htmlFor='Discount'>
									Discount
								</InputLabel>
								<OutlinedInput
									fullWidth
									id='Discount'
									type='number'
									required
									autoComplete='off'
									value={discount}
									onChange={(e) =>
										setDiscount(e.target.value)
									}
									startAdornment={
										<InputAdornment position='start'>
											<Percent
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
									label='Percent'
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
								<InputLabel htmlFor='Coupon Code'>
									Coupon Code
								</InputLabel>
								<OutlinedInput
									fullWidth
									id='Coupon Code'
									type='text'
									autoComplete='off'
									value={couponCode}
									onChange={(e) =>
										setCouponCode(e.target.value)
									}
									startAdornment={
										<InputAdornment position='start'>
											<Percent
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
									label='Coupon Code'
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
								<InputLabel htmlFor='Website'>
									Website
								</InputLabel>
								<OutlinedInput
									fullWidth
									id='Website'
									type='url'
									autoComplete='off'
									value={website}
									onChange={(e) => setWebsite(e.target.value)}
									startAdornment={
										<InputAdornment position='start'>
											<Link
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
									label='Percent'
								/>
							</FormControl>
						</Box>
						<Button
							variant='outlined'
							fullWidth
							sx={{
								mt: 2,
								backgroundColor: "primary.main",
								color: "white"
							}}
							type='submit'>
							<Typography
								variant='button'
								sx={{ fontWeight: "bold" }}>
								New Benefit
							</Typography>
						</Button>
					</Box>
				</StyledBox>
			</SwipeableDrawer>
		</>
	);
};

export default Benefits;
