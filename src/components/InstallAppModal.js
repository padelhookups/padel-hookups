import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import { GetApp, PhoneAndroid, Smartphone } from "@mui/icons-material";

export default function InstallAppModal({
	open,
	onClose,
	onConfirm,
	_title,
	_description,
	_confirmText,
	_cancelText
}) {
	const title = _title || "Install Padel Hookups";
	const description = _description || "Get the best experience! Install Padel Hookups on your device for quick access, and native app performance.";
	const confirmText = _confirmText || "📲 Install Now";
	const cancelText = _cancelText || "Maybe Later";

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
					{/* Animated Install Scene */}
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
							{/* Animated Install Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "80px",
									height: "80px",
									left: "50%",
									top: "50%",
									transform: "translate(-50%, -50%)",
									animation: "installPulse 2s ease-in-out infinite"
								}}>
								{/* Install Circle */}
								<Box
									sx={{
										position: "relative",
										width: "70px",
										height: "70px",
										margin: "0 auto"
									}}>
									{/* SVG Install Circle */}
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

									{/* Download Icon */}
									<Box
										sx={{
											position: "absolute",
											width: "24px",
											height: "24px",
											color: "white",
											top: "45%",
											left: "50%",
											transform: "translate(-50%, -50%)",
											animation: "downloadBounce 1.5s ease-in-out infinite"
										}}>
										<GetApp sx={{ fontSize: "24px" }} />
									</Box>
								</Box>
							</Box>

							{/* Animated Phone Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "20px",
									height: "20px",
									left: "100%",
									top: "0%",
									transform: "translate(-50%, -50%)",
									animation: "phoneFloat 3s ease-in-out infinite",
									color: "#b88f34"
								}}>
								<PhoneAndroid sx={{ fontSize: "20px" }} />
							</Box>

							{/* Secondary Phone Icon */}
							<Box
								sx={{
									position: "absolute",
									width: "18px",
									height: "18px",
									left: "0%",
									top: "20%",
									transform: "translate(-50%, -50%)",
									animation: "phoneFloat2 3.5s ease-in-out infinite",
									color: "#b88f34",
									opacity: 0.7
								}}>
								<Smartphone sx={{ fontSize: "18px" }} />
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

							{/* Secondary Pulsing Ring */}
							<Box
								sx={{
									position: "absolute",
									width: "95px",
									height: "95px",
									borderRadius: "50%",
									border: "2px solid #b88f34",
									left: "50%",
									top: "43%",
									transform: "translate(-50%, -50%)",
									animation: "goldenPulse2 2.5s ease-in-out infinite",
									opacity: 0.2
								}}
							/>
						</Box>
					</Box>

					{/* Install Text */}
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

					{/* Features List */}
					<Box sx={{ mb: 4, textAlign: "left" }}>
						<Typography variant='body2' sx={{ color: "text.secondary", mb: 1, display: "flex", alignItems: "center" }}>
							✓ Quick access from your home screen
						</Typography>
						<Typography variant='body2' sx={{ color: "text.secondary", mb: 1, display: "flex", alignItems: "center" }}>
							✓ Native app experience
						</Typography>
					</Box>

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
									boxShadow: "0 8px 25px rgba(184, 143, 52, 0.3)",
									transform: "translateY(-2px)"
								},
								transition: "all 0.3s ease"
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

              @keyframes installPulse {
                0% { transform: translate(-50%, -50%) scale(1); }
                50% { transform: translate(-50%, -50%) scale(1.05); }
                100% { transform: translate(-50%, -50%) scale(1); }
              }

              @keyframes downloadBounce {
                0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
                50% { transform: translate(-50%, -50%) translateY(-3px); }
              }

              @keyframes phoneFloat {
                0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                33% { transform: translate(-50%, -50%) translateY(-8px) rotate(5deg); }
                66% { transform: translate(-50%, -50%) translateY(-4px) rotate(-3deg); }
              }

              @keyframes phoneFloat2 {
                0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                40% { transform: translate(-50%, -50%) translateY(-6px) rotate(-5deg); }
                80% { transform: translate(-50%, -50%) translateY(-2px) rotate(3deg); }
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

              @keyframes goldenPulse2 {
                0% { 
                  opacity: 0.2; 
                  transform: translate(-50%, -50%) scale(1); 
                }
                50% { 
                  opacity: 0.4; 
                  transform: translate(-50%, -50%) scale(1.15); 
                }
                100% { 
                  opacity: 0.2; 
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
