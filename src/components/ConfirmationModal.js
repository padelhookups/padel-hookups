import { Modal, Box, Typography, Button, Fade, Backdrop } from "@mui/material";
import AnimatedPadelIcon from "./AnimatedPadelIcon";

export default function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  type,
  title = "Confirm",
  description = "Are you sure you want to proceed?",
  positiveText = "Yes",
  negativeText = "Cancel",
}) {
  const handleConfirmClick = () => {
    onConfirm && onConfirm();
    onClose && onClose();
  };

  const handleCancelClick = () => {
    onClose && onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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
            textAlign: "center",
          }}
        >
          {type === 'joinGame' && <Box
            sx={{
              mb: 3,
              position: "relative",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <AnimatedPadelIcon size={100} />
          </Box>}

          {/* {type === 'exitGame' && <Box
            sx={{
              mb: 3,
              position: "relative",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
            <AnimatedPadelIcon size={100} />
          </Box>} */}

          {/* Title */}
          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: "bold",
              color: type === 'exitGame' ? 'error.main' : 'primary.main',
              mb: 2,
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          {!!description && (
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              {description}
            </Typography>
          )}

          {/* Action Buttons */}
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
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  borderColor: "grey.600",
                  bgcolor: "grey.50",
                },
              }}
            >
              {negativeText}
            </Button>

            <Button
              onClick={handleConfirmClick}
              variant="contained"
              size="large"
              fullWidth
              sx={(theme) => ({
                background: type === 'exitGame' ? theme.palette.error.main : 'linear-gradient(45deg, #b88f34 30%, rgba(184, 143, 52, 0.9) 90%)',
                color: "white",
                fontWeight: 600,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": {
                  background: type === 'exitGame'
                    ? theme.palette.error.dark
                    : 'linear-gradient(45deg, rgba(184, 143, 52, 0.9) 30%, #b88f34 90%)',
                },
              })}
            >
              {positiveText}
            </Button>
          </Box>

          {/* CSS Animation Styles */}
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
