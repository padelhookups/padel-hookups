import React from "react";
import { Box, Dialog, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

const FullscreenImageDialog = ({ open, imageSrc, alt = "Image preview", onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        "& .MuiDialog-paper": {
          bgcolor: "rgba(0, 0, 0, 0.96)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "85%",
          height: "100%",
          margin: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
        }}
      >
        <IconButton
          aria-label="Close image viewer"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 8,
            color: "common.white",
            bgcolor: "rgba(255, 255, 255, 0.12)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <Close />
        </IconButton>

        {imageSrc && (
          <Box
            component="img"
            src={imageSrc}
            alt={alt}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        )}
      </Box>
    </Dialog>
  );
};

export default FullscreenImageDialog;