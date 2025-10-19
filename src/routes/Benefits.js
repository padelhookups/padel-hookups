import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import firebase from "../firebase-config";
import useAuth from "../utils/useAuth";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  fetchBenefits, 
  selectBenefits, 
  selectBenefitsLoading, 
  selectBenefitsError,
  invalidateCache 
} from "../redux/slices/benefitsSlice";

import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Chip,
	Fab,
	FormControl,
	InputAdornment,
	InputLabel,
	Grid,
	OutlinedInput,
	TextField,
	Typography,
	Paper,
	SwipeableDrawer
} from "@mui/material";
import {
	Add,
	Edit,
	Link,
	LocalOffer,
	Percent,
	TextSnippet
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { grey } from "@mui/material/colors";

import SuccessModal from "../components/SuccessModal";
import CouponModal from "../components/CouponModal"; // add

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
	const dispatch = useDispatch();
	const initialFetchDone = useRef(false);

	// Redux state
	const benefits = useSelector(selectBenefits);
	const loading = useSelector(selectBenefitsLoading);
	const error = useSelector(selectBenefitsError);

	// Local component state
	const [open, setOpen] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [couponOpen, setCouponOpen] = useState(false);
	const [selectedBenefit, setSelectedBenefit] = useState(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [discount, setDiscount] = useState("");
	const [website, setWebsite] = useState("");
	const [couponCode, setCouponCode] = useState("");
	const [pageMode, setPageMode] = useState("");

	useEffect(() => {
		// Only fetch if we haven't done initial fetch and don't have benefits
		if (!initialFetchDone.current && benefits.length === 0) {
			console.log("Fetch benefits using Redux with caching");
			initialFetchDone.current = true;
			dispatch(fetchBenefits({ db, forceRefresh: false }));
		}
	}, [db, benefits.length]);

	// Refetch when a new benefit is added/updated
	useEffect(() => {
		if (showSuccess) {
			// Invalidate cache and fetch fresh data
			console.log("Invalidate cache and fetch fresh benefits data");
			
			dispatch(invalidateCache());
			dispatch(fetchBenefits({ db, forceRefresh: true }));
		}
	}, [showSuccess, db, dispatch]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		const newBenefit = {
			Name: name,
			Description: description,
			Discount: discount,
			Website: website,
			CouponCode: couponCode,
			ModifiedAt: serverTimestamp() // Add timestamp for cache invalidation
		};

		try {
			if (pageMode === "create") {
				await addDoc(collection(db, "Benefits"), newBenefit);
			} else {
				// Update existing benefit
				const benefitRef = doc(db, "Benefits", selectedBenefit.id);
				await updateDoc(benefitRef, newBenefit);
			}
			console.log("Benefit operation completed:", newBenefit);
			
			// Clear form fields
			setName("");
			setDescription("");
			setDiscount("");
			setWebsite("");
			setCouponCode("");
			setOpen(false);
			setShowSuccess(true);
		} catch (error) {
			console.error("Error with benefit operation:", error);
		}
	};

	const openCoupon = (benefit) => {
		setSelectedBenefit(benefit);
		setCouponOpen(true);
	};
	const closeCoupon = () => setCouponOpen(false);

	if (loading && benefits.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<>
			<Paper
				sx={{
					borderRadius: 0,
					bgcolor: "#b88f34",
					color: "white",
					/* Push header below iOS notch */
					pt: "env(safe-area-inset-top)"
				}}>
				<Box sx={{ py: 3, px: 4 }}>
					<CardContent
						sx={{ textAlign: "left", pt: 0, px: 0, pb: 0 }}>
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
										<b>{user?.TotalSavings || 0}€</b>💰
									</Typography>
								</CardContent>
							</Card>
						</Box>
					</CardContent>
				</Box>
			</Paper>
			<Box
				sx={{
					px: 0,
					/* Remove huge extra space; container already pads for bottom nav */
					maxHeight: 'Calc(100vh - 365px)',
					overflowY: 'auto'
				}}>
				<Box sx={{ px: 4, pt: 4, pb: "40px" }}>
					{error && (
						<Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
							<Typography color="error">
								Error loading benefits: {error}
							</Typography>
						</Box>
					)}
					
					<Grid container spacing={3}>
						{benefits.map((benefit, index) => (
							<Grid
								item
								size={{ xs: 12, md: 6, lg: 3 }}
								key={benefit.id || index}>
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
											pt: 3,
											/* minHeight: {
												xs: "150px",  // mobile
												sm: "120px",  // tablet
												md: "120px",  // desktop
												lg: "150px"   // large desktop
											}, */
											minHeight: "150px",
											position: "relative"
										}}>
										{/* Partner Header */}
										<Typography
											variant='h6'
											component='h2'
											sx={{
												fontWeight: "bold",
												width: "70%"
											}}>
											{benefit.Name}
										</Typography>
										<Typography
											variant='body2'
											sx={{ opacity: 0.8 }}>
											{benefit.Description}
										</Typography>
										<Box
											sx={{
												py: 0,
												px: 2,
												position: "absolute",
												bottom: 20,
												left: 0,
												right: 0,
												display: "flex"
											}}>
											<Button
												variant='outlined'
												fullWidth
												color='primary'
												sx={{ mr: 1 }}
												onClick={() =>
													openCoupon(benefit)
												} // add
											>
												<Typography
													variant='button'
													sx={{ fontWeight: "bold" }}>
													Get Coupon
												</Typography>
											</Button>
											{user?.IsAdmin && (
												<Button
													onClick={() => {
														setPageMode("edit");
														setSelectedBenefit(benefit);
														setName(benefit.Name);
														setDescription(
															benefit.Description
														);
														setCouponCode(
															benefit.CouponCode
														);
														setDiscount(
															benefit.Discount
														);
														setWebsite(
															benefit.Website
														);
														setOpen(true);
													}}
													variant='outlined'
													sx={{ ml: 1 }}>
													<Edit></Edit>
												</Button>
											)}
										</Box>
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
						onClick={() => {
							setPageMode("create");
							setOpen(true);
						}}>
						<Add sx={{ color: "white" }} />
					</Fab>
				)}
				<SuccessModal
					open={showSuccess}
					_title={`Benefit ${pageMode === 'create' ? 'created' : 'updated'}!`}
					onClose={() => setShowSuccess(false)}
					_description={`Your benefit has been ${pageMode === 'create' ? 'created' : 'updated'} successfully.`}
					_buttonText='Continue'
					_navigate={false}
				/>
				<CouponModal
					open={couponOpen}
					onClose={closeCoupon}
					title={
						selectedBenefit
							? `${selectedBenefit.Name} Coupon`
							: "Your Coupon"
					}
					code={selectedBenefit?.CouponCode}
					description={selectedBenefit?.Description}
					website={selectedBenefit?.Website}
				/>
			</Box>
			<SwipeableDrawer
				sx={{ zIndex: 1300 }}
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
								{pageMode === "edit" ? "Edit" : "New"} Benefit
							</Typography>
						</Button>
					</Box>
				</StyledBox>
			</SwipeableDrawer>
		</>
	);
};

export default Benefits;
