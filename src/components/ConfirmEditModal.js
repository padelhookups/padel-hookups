import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import { Edit, Settings } from "@mui/icons-material";

export default function ConfirmEditModal({
	open,
	onClose,
	onConfirm,
	_title,
	_description,
	_confirmText,
	_cancelText
}) {
	const title = _title || "Confirm Edit";
	const description = _description || "Are you sure you want to save these changes?";
	const confirmText = _confirmText || "Save Changes";
	const cancelText = _cancelText || "Cancel";

	const handleConfirmClick = () => {
		onConfirm();
		onClose();
	};

	const handleCancelClick = () => {
		onClose();
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
					{/* Animated Edit Scene */}
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
							{/* Animated Edit Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									left: "50%",
									top: "50%",
									transform: "translate(-50%, -50%)",
									animation: "editPulse 2s ease-in-out infinite"
								}}>
								{/* Edit Circle */}
								<Box
									sx={{
										position: "relative",
										width: "70px",
										height: "70px",
										margin: "0 auto"
									}}>
									{/* SVG Edit Circle */}
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

									{/* Edit Icon */}
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
										<Edit sx={{ fontSize: "24px" }} />
									</Box>
								</Box>
							</Box>

							{/* Animated Settings Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "20px",
									height: "20px",
									left: "100%",
									top: "0%",
									transform: "translate(-50%, -50%)",
									animation: "settingsRotate 4s linear infinite",
									color: "#b88f34"
								}}>
								<Settings sx={{ fontSize: "20px" }} />
							</Box>

							{/* Pulsing Golden Ring */}
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
									animation: "goldenPulse 2s ease-in-out infinite",
									opacity: 0.4
								}}
							/>
						</Box>
					</Box>

					{/* Edit Text */}
					<Typography
						variant='h4'
						component='h2'
						sx={{
							fontWeight: "bold",
							color: "#b88f34",
							mb: 2
						}}>
						{title}
					</Typography>

					<Typography
						variant='body1'
						sx={{
							color: "text.secondary",
							mb: 4,
							lineHeight: 1.6
						}}>
						{description}
					</Typography>

					{/* Action Buttons */}
					<Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
						<Button
							onClick={handleCancelClick}
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
							{cancelText}
						</Button>
						
						<Button
							onClick={handleConfirmClick}
							variant='contained'
							size='large'
							fullWidth
							sx={{
								background: "linear-gradient(45deg, #b88f34 30%, rgba(184, 143, 52, 0.9) 90%)",
								color: "white",
								fontWeight: 600,
								py: 1.5,
								borderRadius: 2,
								textTransform: "none",
								fontSize: "1rem",
								"&:hover": {
									background: "linear-gradient(45deg, rgba(184, 143, 52, 0.9) 30%, #b88f34 90%)",
									boxShadow: "0 8px 25px rgba(184, 143, 52, 0.3)"
								}
							}}>
							{confirmText}
						</Button>
					</Box>

					{/* CSS Animation Styles */}
					<style>
						{`
              @keyframes fadeInScale {
                0% {
                  opacity: 0;
                  transform: scale(0.5);
                }
                100% {
                  opacity: 1;
                  transform: scale(1);
                }
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
                0% { 
                  opacity: 0.4; 
                  transform: translate(-50%, -50%) scale(1); 
                }
                50% { 
                  opacity: 0.7; 
                  transform: translate(-50%, -50%) scale(1.1); 
                }
                100% { 
                  opacity: 0.4; 
                  transform: translate(-50%, -50%) scale(1); 
                }
              }
            `}
					</style>
				</Box>
			</Fade>
		</Modal>
	);
}
