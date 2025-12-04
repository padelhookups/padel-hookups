import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Typography,
  IconButton,
  Stack,
  Paper
} from '@mui/material';
import {
  RotateLeft,
  RotateRight,
  ZoomIn,
  ZoomOut,
  Close
} from '@mui/icons-material';
import getCroppedImg from '../utils/imageUtils';

const PhotoEditor = ({ open, imageSrc, onClose, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setProcessing(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      onSave(croppedImage);
    } catch (e) {
      console.error('Error cropping image:', e);
      alert('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  }, [imageSrc, croppedAreaPixels, rotation, onSave]);

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleClose = () => {
    // Reset state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: '#000',
        }
      }}
    >
      <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Adjust Photo</Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, position: 'relative', height: '60vh' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
        />
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'column', p: 2, bgcolor: '#000' }}>
        {/* Zoom Control */}
        <Paper sx={{ width: '100%', p: 2, mb: 2, bgcolor: '#1a1a1a' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ZoomOut sx={{ color: 'white' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
                Zoom
              </Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, zoom) => setZoom(zoom)}
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>
            <ZoomIn sx={{ color: 'white' }} />
          </Stack>
        </Paper>

        {/* Rotation Control */}
        <Paper sx={{ width: '100%', p: 2, mb: 2, bgcolor: '#1a1a1a' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={handleRotateLeft} sx={{ color: 'white' }}>
              <RotateLeft />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: 'white', mb: 1, display: 'block' }}>
                Rotation
              </Typography>
              <Slider
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e, rotation) => setRotation(rotation)}
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>
            <IconButton onClick={handleRotateRight} sx={{ color: 'white' }}>
              <RotateRight />
            </IconButton>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleClose}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={processing}
            sx={{ color: 'white' }}
          >
            {processing ? 'Processing...' : 'Save'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default PhotoEditor;
