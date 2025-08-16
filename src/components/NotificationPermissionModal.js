import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import { NotificationsActive, NotificationsOff } from "@mui/icons-material";
import firebase from "../firebase-config";

export default function NotificationPermissionModal({
	open,
	onClose,
	_title = "Enable Notifications",
	_description = "Turn on notifications to receive match updates, invites, and important alerts.",
	_confirmText = "Allow Notifications",
	_cancelText = "Not Now",
	_primaryColor = "#b88f34",
	_showAnimation = true
}) {
	const isGranted = typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted";
	const isDenied = typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied";

	const handleConfirmClick = async () => {
		// Call Firebase requestPermission and close
		try {
			const accepted = await firebase.requestPermission();
			onClose(accepted);
		} catch (error) {
			console.error("Error requesting notification permission:", error);
			onClose(false);
		}
	};

	const handleCancelClick = () => {
		onClose(false);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			closeAfterTransition
			BackdropComponent={Backdrop}
			BackdropProps={{ timeout: 300, sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" } }}
			sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
		>
			<Fade in={open} timeout={300}>
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
					}}
				>
					{_showAnimation && (
						<Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
							<Box
								sx={{
									width: 72,
									height: 72,
									borderRadius: "50%",
									backgroundColor: _primaryColor,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#fff",
									animation: "notifPulse 2s ease-in-out infinite"
								}}
							>
								{isDenied ? (
									<NotificationsOff sx={{ fontSize: 28 }} />
								) : (
									<NotificationsActive sx={{ fontSize: 28 }} />
								)}
							</Box>
						</Box>
					)}

					<Typography variant="h5" component="h2" sx={{ fontWeight: "bold", color: _primaryColor, mb: 1.5 }}>
						{_title}
					</Typography>

					<Typography variant="body1" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
						{_description}
					</Typography>

					<Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
						<Button
							onClick={handleCancelClick}
							variant="outlined"
							size="large"
							fullWidth
							sx={{
								color: "text.primary",
								borderColor: "grey.400",
								fontWeight: 600,
								py: 1.25,
								borderRadius: 2,
								textTransform: "none",
								fontSize: "1rem",
								"&:hover": { borderColor: "grey.600", bgcolor: "grey.50" }
							}}
						>
							{_cancelText}
						</Button>

						<Button
							onClick={handleConfirmClick}
							variant="contained"
							size="large"
							fullWidth
							disabled={isGranted}
							sx={{
								background: `linear-gradient(45deg, ${_primaryColor} 30%, ${_primaryColor}e6 90%)`,
								color: "white",
								fontWeight: 600,
								py: 1.25,
								borderRadius: 2,
								textTransform: "none",
								fontSize: "1rem",
								"&:hover": {
									background: `linear-gradient(45deg, ${_primaryColor}e6 30%, ${_primaryColor} 90%)`,
									boxShadow: `0 8px 25px ${_primaryColor}4d`,
									transform: "translateY(-2px)"
								},
								transition: "all 0.3s ease"
							}}
						>
							{isGranted ? "Notifications Enabled" : _confirmText}
						</Button>
					</Box>

					<style>
						{`
              @keyframes notifPulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 ${_primaryColor}55; }
                50% { transform: scale(1.05); box-shadow: 0 0 0 10px ${_primaryColor}10; }
                100% { transform: scale(1); box-shadow: 0 0 0 0 ${_primaryColor}00; }
              }
            `}
					</style>
				</Box>
			</Fade>
		</Modal>
	);
}