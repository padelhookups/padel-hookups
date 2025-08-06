import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Switch,
  Typography,
} from "@mui/material";

import {
  AccountCircle,
  ChevronRight,
  Lock,
  Visibility,
} from "@mui/icons-material";
import logo from "../images/LogoWhite.svg";

function Login() {
  return (
    <Container fixed>
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Padel HookUps Logo"
          sx={{
            width: 150,
            height: 150,
          }}
        />
        <Typography variant="h4" sx={{ mt: 5, mb: 1, textAlign: "center" }}>
          <b>Welcome to Padel Hookups</b>
        </Typography>
        <Typography variant="subtitle1">
          Sign in to your account to continue
        </Typography>
        <Box
          component="form"
          sx={{
            "& > :not(style)": { mt: 4 },
            width: {
              xs: "75%", // full width on small screens
              sm: "75%", // still full on small (or slightly wider)
              md: "50%", // 50% on medium
              lg: "50%", // narrower on large screens
              xl: "50%", // even narrower on extra large
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
            }}
          >
            <FormControl
              sx={{
                width: "100%",
                "&:focus-within": {
                  borderColor: "primary.main",
                  borderWidth: "2px", // outer second border
                },
              }}
            >
              <InputLabel htmlFor="email">Email</InputLabel>
              <OutlinedInput
                fullWidth
                id="email"
                startAdornment={
                  <InputAdornment position="start">
                    <AccountCircle
                      sx={{
                        ".Mui-focused &": {
                          color: "primary.main",
                        },
                        mr: 1,
                        my: 0.5,
                        cursor: "pointer",
                      }}
                    />
                  </InputAdornment>
                }
                endAdornment={
                  // Empty space to balance layout
                  <InputAdornment position="end">
                    <Box sx={{ width: 30 }} /> {/* width matches icon button */}
                  </InputAdornment>
                }
                label="Email"
              />
            </FormControl>
          </Box>
          <Box
            sx={{
              width: "100%",
            }}
          >
            <FormControl
              sx={{
                width: "100%",
                "&:focus-within": {
                  borderColor: "primary.main",
                  borderWidth: "2px", // outer second border
                },
              }}
            >
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                id="password"
                startAdornment={
                  <InputAdornment position="start">
                    <Lock
                      sx={{
                        color: "action.active",
                        mr: 1,
                        my: 0.5,
                        ".Mui-focused &": {
                          color: "primary.main",
                        },
                      }}
                    />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <Visibility
                      sx={{
                        color: "action.active",
                        mr: 1,
                        my: 0.5,
                        cursor: "pointer",
                      }}
                    />
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
          </Box>
          <Box
            sx={{
              width: "100%",
              mt: "0 !important",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              sx={{
                width: "50%",
                "& .MuiFormControlLabel-label": {
                  fontSize: "0.875rem", // Smaller font (e.g. 14px)
                  fontWeight: 500, // Optional: make it lighter or bolder
                },
              }}
              control={<Switch />}
              label="Remember me?"
            />
            <Typography
              variant="body2"
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Forgot Password?
            </Typography>
          </Box>
          <Button fullWidth variant="contained" id="sign-in-button">
            <Typography
              variant="body1"
              sx={{
                color: "#fff",
                textTransform: "capitalize",
                fontWeight: "bold",
              }}
            >
              Login
            </Typography>
            <ChevronRight sx={{ color: "#fff" }} />
          </Button>
          <Typography sx={{ textAlign: "center", color: "text.secondary" }}>
            Dont have an account?{" "}
            <Link href="/SignUp" color="primary">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default Login;
