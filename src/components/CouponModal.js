import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import {
	LocalOffer,
	ContentCopy,
	OpenInNew,
	SportsBaseballOutlined
} from "@mui/icons-material";
import { useMemo, useState, useEffect } from "react";

export default function CouponModal({
	open,
	onClose,
	title,
	code,
	description,
	website
}) {
	const modalTitle = useMemo(() => title || "Your Coupon", [title]);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!open) setCopied(false);
	}, [open]);

	const handleCopy = async () => {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		} catch (e) {
			console.error("Copy failed:", e);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			closeAfterTransition
			BackdropComponent={Backdrop}
			BackdropProps={{
				timeout: 500,
				sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" }
			}}
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}}>
			<Fade in={open} timeout={500}>
				<Box
					sx={{
						position: "relative",
						width: { xs: "90%", sm: "400px" },
						bgcolor: "background.paper",
						borderRadius: 3,
						boxShadow: 24,
						p: 4,
						mx: 2,
						outline: "none",
						textAlign: "center"
					}}>
					{/* Animated Scene (same look & feel) */}
					<Box
						sx={{
							mb: 3,
							position: "relative",
							height: "120px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}>
						<Box
							sx={{
								position: "relative",
								width: "100px",
								height: "100px",
								animation: "fadeInScale 0.8s ease-out"
							}}>
							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									left: "50%",
									top: "50%",
									transform: "translate(-50%, -50%)",
									animation:
										"editPulse 2s ease-in-out infinite"
								}}>
								<Box
									sx={{
										position: "relative",
										width: "70px",
										height: "70px",
										margin: "0 auto"
									}}>
									<svg
										width='64'
										height='64'
										viewBox='0 0 64 64'
										style={{
											position: "absolute",
											top: 0,
											left: "50%",
											transform: "translateX(-50%)"
										}}>
										<circle
											cx='32'
											cy='32'
											r='28'
											fill='#b88f34'
											stroke='#a67c2a'
											strokeWidth='3'
										/>
									</svg>
									<Box
										sx={{
											position: "absolute",
											width: "24px",
											height: "24px",
											color: "white",
											top: "45%",
											left: "50%",
											transform: "translate(-50%, -50%)"
										}}>
										<LocalOffer sx={{ fontSize: "24px" }} />
									</Box>
								</Box>
							</Box>

							{/* Rotating accent element replaced with padel ball */}
							<Box
								sx={{
									position: "absolute",
									width: "20px",
									height: "20px",
									left: "100%",
									top: "0%",
									transform: "translate(-50%, -50%)",
									animation:
										"settingsRotate 4s linear infinite",
									color: "#b88f34"
								}}>
								<SportsBaseballOutlined
									sx={{
										position: "absolute",
										top: -10,
										left: 10,
										fontSize: 16,
										color: "#facc15",
										opacity: 0.7,
										animation: "bounce 2s infinite 0.5s"
									}}
								/>
							</Box>

							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									borderRadius: "50%",
									border: "3px solid #b88f34",
									left: "50%",
									top: "43%",
									transform: "translate(-50%, -50%)",
									animation:
										"goldenPulse 2s ease-in-out infinite",
									opacity: 0.4
								}}
							/>
						</Box>
					</Box>

					<Typography
						variant='h4'
						component='h2'
						sx={{ fontWeight: "bold", color: "#b88f34", mb: 2 }}>
						{modalTitle}
					</Typography>

					{description && (
						<Typography
							variant='body1'
							sx={{
								color: "text.secondary",
								mb: 2,
								lineHeight: 1.6
							}}>
							{description}
						</Typography>
					)}

					<Box
						sx={{
							px: 2,
							py: 1.5,
							border: "2px dashed",
							borderColor: "grey.400",
							borderRadius: 2,
							fontWeight: 800,
							letterSpacing: 2,
							fontSize: "1.1rem",
							mb: 2,
							bgcolor: "grey.50"
						}}>
						{code || "No code required"}
					</Box>

					{website && (
						<Button
							variant='outlined'
							fullWidth
							component='a'
							href={website}
							target='_blank'
							rel='noopener noreferrer'
							startIcon={<OpenInNew />}
							sx={{ mb: 2 }}>
							Visit Website
						</Button>
					)}

					<Box
						sx={{
							display: "flex",
							gap: 2,
							flexDirection: { xs: "column", sm: "row" }
						}}>
						<Button
							onClick={onClose}
							variant='outlined'
							size='large'
							fullWidth
							sx={{
								color: "text.primary",
								borderColor: "grey.400",
								fontWeight: 600,
								py: 1.5,
								borderRadius: 2,
								textTransform: "none",
								fontSize: "1rem",
								"&:hover": {
									borderColor: "grey.600",
									bgcolor: "grey.50"
								}
							}}>
							Close
						</Button>
						{code && (
							<Button
								onClick={handleCopy}
								variant='contained'
								size='large'
								fullWidth
								disabled={!code}
								startIcon={<ContentCopy />}
								sx={{
									background:
										"linear-gradient(45deg, #b88f34 30%, rgba(184, 143, 52, 0.9) 90%)",
									color: "white",
									fontWeight: 600,
									py: 1.5,
									borderRadius: 2,
									textTransform: "none",
									fontSize: "1rem",
									"&:hover": {
										background:
											"linear-gradient(45deg, rgba(184, 143, 52, 0.9) 30%, #b88f34 90%)",
										boxShadow:
											"0 8px 25px rgba(184, 143, 52, 0.3)"
									}
								}}>
								{copied ? "Copied!" : "Copy Code"}
							</Button>
						)}
					</Box>

					<style>
						{`
              @keyframes fadeInScale {
                0% { opacity: 0; transform: scale(0.5); }
                100% { opacity: 1; transform: scale(1); }
              }
              @keyframes editPulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.05); }
                100% { transform: translate(-50%, -50%) scale(1); }
              }
              @keyframes settingsRotate {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
              }
              @keyframes goldenPulse {
                0% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
              }
            `}
					</style>
				</Box>
			</Fade>
		</Modal>
	);
}
