import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import { DeleteForever } from "@mui/icons-material";

export default function ConfirmDeleteModal({
	open,
	onClose,
	onConfirm,
	_title,
	_description,
	_confirmText,
	_cancelText
}) {
	const title = _title || "Confirm Delete";
	const description = _description || "Are you sure you want to delete? This action cannot be undone.";
	const confirmText = _confirmText || "Delete";
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
				sx: { backgroundColor: "rgba(0, 0, 0, 0.6)" }
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
					{/* Animated Warning Scene */}
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
							{/* Animated Warning Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									left: "50%",
									top: "50%",
									transform: "translate(-50%, -50%)",
									animation: "warningPulse 2s ease-in-out infinite"
								}}>
								{/* Warning Triangle */}
								<Box
									sx={{
										position: "relative",
										width: "70px",
										height: "70px",
										margin: "0 auto"
									}}>
									{/* SVG Warning Triangle */}
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
										<path
											d='M32 4 L58 54 L6 54 Z'
											fill='#ef4444'
											stroke='#dc2626'
											strokeWidth='2'
										/>
									</svg>

									{/* Exclamation Mark */}
									<Box
										sx={{
											position: "absolute",
											width: "4px",
											height: "24px",
											bgcolor: "white",
											borderRadius: "2px",
											top: "16px",
											left: "50%",
											transform: "translateX(-50%)"
										}}
									/>
									<Box
										sx={{
											position: "absolute",
											width: "4px",
											height: "4px",
											bgcolor: "white",
											borderRadius: "50%",
											top: "44px",
											left: "50%",
											transform: "translateX(-50%)"
										}}
									/>
								</Box>
							</Box>

							{/* Animated Delete Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "24px",
									height: "24px",
									left: "100%",
									top: "0%",
									transform: "translate(-50%, -50%)",
									animation: "deleteFloat 3s ease-in-out infinite",
									color: "#ef4444"
								}}>
								<DeleteForever sx={{ fontSize: "24px" }} />
							</Box>

							{/* Pulsing Danger Ring */}
							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									borderRadius: "50%",
									border: "3px solid #ef4444",
									left: "50%",
									top: "45%",
									transform: "translate(-50%, -50%)",
									animation: "dangerPulse 2s ease-in-out infinite",
									opacity: 0.3
								}}
							/>
						</Box>
					</Box>

					{/* Warning Text */}
					<Typography
						variant='h4'
						component='h2'
						sx={{
							fontWeight: "bold",
							color: "error.main",
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
								background: "linear-gradient(45deg, #ef4444 30%, #dc2626 90%)",
								color: "white",
								fontWeight: 600,
								py: 1.5,
								borderRadius: 2,
								textTransform: "none",
								fontSize: "1rem",
								"&:hover": {
									background: "linear-gradient(45deg, #dc2626 30%, #b91c1c 90%)",
									boxShadow: "0 8px 25px rgba(239, 68, 68, 0.3)"
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

              @keyframes warningPulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.05); }
                100% { transform: translate(-50%, -50%) scale(1); }
              }

              @keyframes deleteFloat {
                0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                33% { transform: translate(-50%, -50%) translateY(-8px) rotate(10deg); }
                66% { transform: translate(-50%, -50%) translateY(-4px) rotate(-5deg); }
                100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
              }

              @keyframes dangerPulse {
                0% { 
                  opacity: 0.3; 
                  transform: translate(-50%, -50%) scale(1); 
                }
                50% { 
                  opacity: 0.6; 
                  transform: translate(-50%, -50%) scale(1.1); 
                }
                100% { 
                  opacity: 0.3; 
                  transform: translate(-50%, -50%) scale(1); 
                }
              }

              @keyframes bounce {
                0%, 20%, 53%, 80%, 100% {
                  transform: translate3d(0,0,0);
                }
                40%, 43% {
                  transform: translate3d(0,-10px,0);
                }
                70% {
                  transform: translate3d(0,-5px,0);
                }
                90% {
                  transform: translate3d(0,-2px,0);
                }
              }
            `}
					</style>
				</Box>
			</Fade>
		</Modal>
	);
}
