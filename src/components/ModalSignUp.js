import {
  Modal,
  Box,
  Typography,
  Button,
  Fade,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { SportsBaseballOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router";

export default function SuccessModal({ open, onClose }) {
  const navigate = useNavigate();

  const handlePlayClick = () => {
    navigate("/Home");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Fade in={open} timeout={500}>
        <Box
          sx={{
            position: 'relative',
            width: { xs: '90%', sm: '400px' },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            mx: 2,
            outline: 'none',
            textAlign: 'center',
          }}
        >
          {/* Animated Padel Scene */}
          <Box sx={{ mb: 3, position: 'relative', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100px',
                height: '100px',
                animation: 'fadeInScale 0.8s ease-out',
              }}
            >
              {/* Animated Padel Racket */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '60px',
                  height: '80px',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  transformOrigin: 'center bottom',
                  animation: 'racketSwing 2s ease-in-out infinite',
                }}
              >
                {/* Racket Head - Proper Teardrop Padel Racket */}
                <Box
                  sx={{
                    width: '40px',
                    height: '50px',
                    position: 'relative',
                    margin: '0 auto',
                  }}
                >
                  {/* SVG Teardrop Shape */}
                  <svg
                    width="36"
                    height="46"
                    viewBox="0 0 36 46"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <path
                      d="M18 2 C6 2, 2 12, 2 20 C2 28, 6 36, 12 40 L18 44 L24 40 C30 36, 34 28, 34 20 C34 12, 30 2, 18 2 Z"
                      fill="rgba(254, 243, 199, 0.95)"
                      stroke="#b88f34"
                      strokeWidth="3"
                    />
                  </svg>

                  {/* Padel Racket Holes Pattern */}
                  {[...Array(25)].map((_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    // Adjust hole positions to fit teardrop shape
                    const yPos = 8 + row * 5;
                    const baseX = 8;
                    let xOffset = 0;

                    // Narrow the pattern as we go down (teardrop effect)
                    if (row > 2) xOffset = (row - 2) * 2;
                    if (row > 4) xOffset = (row - 2) * 4;

                    const xPos = baseX + col * 5 + xOffset;
                    const isVisible = row < 6 && xPos >= 8 && xPos <= 28;

                    if (!isVisible) return null;

                    return (
                      <Box
                        key={i}
                        sx={{
                          position: 'absolute',
                          width: '2.5px',
                          height: '2.5px',
                          bgcolor: '#b88f34',
                          borderRadius: '50%',
                          top: `${yPos}px`,
                          left: `${xPos}px`,
                          opacity: 0.7,
                        }}
                      />
                    );
                  })}
                </Box>
                {/* Racket Handle */}
                <Box
                  sx={{
                    width: '6px',
                    height: '30px',
                    bgcolor: '#8b5a2b',
                    borderRadius: '3px',
                    margin: '0 auto',
                    position: 'relative',
                  }}
                >
                  {/* Handle Grip Lines */}
                  {[...Array(4)].map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '1px',
                        bgcolor: '#654321',
                        top: `${5 + i * 6}px`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Animated Padel Ball */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  bgcolor: '#facc15',
                  border: '1px solid #eab308',
                  left: '50%',
                  top: '30%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'ballBounce 2s ease-in-out infinite',
                  boxShadow: 'inset 2px -2px 4px rgba(234, 179, 8, 0.3)',
                }}
              >
                {/* Ball Seam Lines */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '12px',
                    height: '1px',
                    bgcolor: 'white',
                    borderRadius: '50px',
                    top: '4px',
                    left: '2px',
                    transform: 'rotate(-20deg)',
                    opacity: 0.9,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    width: '12px',
                    height: '1px',
                    bgcolor: 'white',
                    borderRadius: '50px',
                    top: '10px',
                    left: '2px',
                    transform: 'rotate(20deg)',
                    opacity: 0.9,
                  }}
                />
              </Box>

              {/* Impact Effect */}
              <Box
                sx={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #facc15',
                  left: '50%',
                  top: '30%',
                  transform: 'translate(-50%, -50%)',
                  animation: 'impactPulse 2s ease-in-out infinite',
                  opacity: 0,
                }}
              />
            </Box>
          </Box>

          {/* Success Text */}
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'text.primary', 
              mb: 2 
            }}
          >
            Game, Set, Match!
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary', 
              mb: 4,
              lineHeight: 1.6 
            }}
          >
            Welcome to the padel community! Your racket is ready and the courts are waiting for your next hookup.
          </Typography>

          {/* Floating Elements */}
          <Box sx={{ position: 'relative', mb: 4 }}>
            <SportsBaseballOutlined
              sx={{
                position: 'absolute',
                top: -20,
                right: 20,
                fontSize: 24,
                color: '#facc15',
                animation: 'bounce 2s infinite',
              }}
            />
            <SportsBaseballOutlined
              sx={{
                position: 'absolute',
                top: -10,
                left: 10,
                fontSize: 16,
                color: '#facc15',
                opacity: 0.7,
                animation: 'bounce 2s infinite 0.5s',
              }}
            />
          </Box>

          {/* Action Button */}
          <Button
            onClick={handlePlayClick}
            variant="contained"
            size="large"
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #b88f34 30%, rgba(184, 143, 52, 0.9) 90%)',
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': {
                background: 'linear-gradient(45deg, rgba(184, 143, 52, 0.9) 30%, #b88f34 90%)',
                boxShadow: '0 8px 25px rgba(184, 143, 52, 0.3)',
              },
            }}
          >
            Let´s Play!
          </Button>

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

              @keyframes racketSwing {
                0% { transform: translate(-50%, -50%) rotate(-15deg); }
                20% { transform: translate(-50%, -50%) rotate(-25deg); }
                40% { transform: translate(-50%, -50%) rotate(10deg); }
                60% { transform: translate(-50%, -50%) rotate(-5deg); }
                100% { transform: translate(-50%, -50%) rotate(-15deg); }
              }

              @keyframes ballBounce {
                0% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
                20% { transform: translate(-50%, -50%) translateX(-15px) translateY(-10px); }
                40% { transform: translate(-50%, -50%) translateX(25px) translateY(-20px); }
                60% { transform: translate(-50%, -50%) translateX(15px) translateY(5px); }
                80% { transform: translate(-50%, -50%) translateX(-5px) translateY(-5px); }
                100% { transform: translate(-50%, -50%) translateX(0px) translateY(0px); }
              }

              @keyframes impactPulse {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                35% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                40% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
                45% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.8); }
                50% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
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
