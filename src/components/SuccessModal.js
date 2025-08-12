import { useState } from "react";
import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import { SportsBaseballOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router";
import AnimatedPadelIcon from "./AnimatedPadelIcon";

export default function SuccessModal({
	open,
	onClose,
	_title,
	_description,
	_buttonText,
	_navigateTo,
	_navigate
}) {
	const navigate = useNavigate();

	const [title, setTitle] = useState(_title);
	const [description, setDescription] = useState(_description);
	const [buttonText, setButtonText] = useState(_buttonText);

	const handlePlayClick = () => {
		if (_navigate && _navigateTo) {
			navigate(_navigateTo);
		} else {
			onClose();
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
					{/* Animated Padel Scene */}
					<Box
						sx={{
							mb: 3,
							position: "relative",
							height: "120px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center"
						}}>
						<AnimatedPadelIcon size={100} />
					</Box>

					{/* Success Text */}
					<Typography
						variant='h4'
						component='h2'
						sx={{
							fontWeight: "bold",
							color: "text.primary",
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

					{/* Floating Elements */}
					<Box sx={{ position: "relative", mb: 4 }}>
						<SportsBaseballOutlined
							sx={{
								position: "absolute",
								top: -20,
								right: 20,
								fontSize: 24,
								color: "#facc15",
								animation: "bounce 2s infinite"
							}}
						/>
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

					{/* Action Button */}
					<Button
						onClick={handlePlayClick}
						variant='contained'
						size='large'
						fullWidth
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
								boxShadow: "0 8px 25px rgba(184, 143, 52, 0.3)"
							}
						}}>
						{buttonText}
					</Button>
				</Box>
			</Fade>
		</Modal>
	);
}
