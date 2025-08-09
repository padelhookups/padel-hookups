import { useEffect, useState } from "react";
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
	Typography,
	SwipeableDrawer
} from "@mui/material";
import { Add, LocalOffer } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import firebase from "../firebase-config";
import { collection, getDocs, getFirestore } from "firebase/firestore";

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
	const db = getFirestore(firebase.app);

	const [benefits, setBenefits] = useState([]);
	const [open, setOpen] = useState(false);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

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
	}, [db]);

	/* const getCategoryIcon = (category) => {
		switch (category) {
			case "Courts":
				return <SportsTennis />;
			case "Equipment":
				return <Store />;
			case "Nutrition":
				return <Restaurant />;
			case "Fitness":
				return <FitnessCenter />;
			default:
				return <LocalOffer />;
		}
	};

	const getCategoryColor = (category) => {
		switch (category) {
			case "Courts":
				return "primary";
			case "Equipment":
				return "secondary";
			case "Nutrition":
				return "success";
			case "Fitness":
				return "warning";
			default:
				return "default";
		}
	}; */

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
											color: "primary.main",
											backgroundColor: "white",
											borderColor: "primary.main",
											borderWidth: 1,
											borderStyle: "dashed",
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
											sx={{ fontWeight: "bold" }}>
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
				<Fab
					color='primary'
					aria-label='add'
					sx={{ position: "fixed", bottom: 76, right: 16 }}
					onClick={() => setOpen(true)}>
					<Add sx={{ color: "white" }} />
				</Fab>
			</Box>
			<SwipeableDrawer
				anchor='bottom'
				open={open}
				onClose={() => setOpen(false)}
				/* swipeAreaWidth={drawerBleeding} */
				disableSwipeToOpen={true}
				keepMounted>
				<Puller />
				<StyledBox
					sx={{ px: 2, pb: 2, height: "100%", overflow: "auto" }}>
					<Box
						component='form'
						sx={{pt:4, pb:2, px:2}}>
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
								<InputLabel htmlFor='Name'>Name</InputLabel>
								<OutlinedInput
									fullWidth
									id='Name'
									type='Name'
									required
									autoComplete='Name'
									value={name}
									onChange={(e) => setName(e.target.value)}
									startAdornment={
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
