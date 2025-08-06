import { useState } from "react";

import {
  Box,
  Button,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Switch,
  Typography,
} from "@mui/material";
import {
  AccountCircle,
  Cancel,
  Check,
  Close,
  CheckCircle,
  ChevronRight,
  Email,
  Lock,
} from "@mui/icons-material";
import logo from "../images/LogoWhite.svg";

/* FIREBASE */
import app from "../firebase-config";
import {
  getAuth,
  createUserWithEmailAndPassword,
  validatePassword,
} from "firebase/auth";

function SignUp() {
  const auth = getAuth(app);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  //const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [lowerCaseValid, setLowerCaseValid] = useState(false);
  const [upperCaseValid, setUpperCaseValid] = useState(false);
  const [numberValid, setNumberValid] = useState(false);
  const [specialCharValid, setSpecialCharValid] = useState(false);
  const [lengthValid, setLengthValid] = useState(false);

  const createUser = async () => {
    const result = await validatePasswordJS();
    if (!result.isValid) return;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  };

  const validatePasswordJS = async () => {
    const status = await validatePassword(getAuth(), password);
    console.log(status);

    if (!status.isValid) {
      // Password could not be validated. Use the status to show what
      // requirements are met and which are missing.
      // If a criterion is undefined, it is not required by policy. If the
      // criterion is defined but false, it is required but not fulfilled by
      // the given password. For example:
    }
    return status.isValid;
  };

  return (
    <Container fixed>
      <Box
        sx={{
          height: "100vh",
          width: "100%",
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
          <b>Create your account</b>
        </Typography>
        <Typography variant="subtitle1">
          Join the Padel Hookups community
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
              <InputLabel htmlFor="name">Name</InputLabel>
              <OutlinedInput
                fullWidth
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <InputLabel htmlFor="email">Email</InputLabel>
              <OutlinedInput
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Email
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
                endAdornment={<Box sx={{ width: 40 }} />}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                endAdornment={<Box sx={{ width: 40 }} />}
                label="Password"
              />
            </FormControl>
            <Box
              sx={{
                mt: 1,
                p: 2,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "grey.100",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  fontWeight: "bold",
                }}
              >
                Password requirements:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {lowerCaseValid ? (
                  <Check
                    sx={{ color: "success.main", mr: 1 }}
                    fontSize="small"
                  />
                ) : (
                  <Close
                    sx={{ color: "error.main", mr: 1 }}
                    fontSize="small"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Contains lowercase letter
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {upperCaseValid ? (
                  <Check
                    sx={{ color: "success.main", mr: 1 }}
                    fontSize="small"
                  />
                ) : (
                  <Close
                    sx={{ color: "error.main", mr: 1 }}
                    fontSize="small"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Contains uppercase letter
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {!numberValid ? (
                  <Close sx={{ color: "error.main", mr: 1 }} fontSize="small" />
                ) : (
                  <Check
                    sx={{ color: "success.main", mr: 1 }}
                    fontSize="small"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Contains numeric character
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {!specialCharValid ? (
                  <Close sx={{ color: "error.main", mr: 1 }} fontSize="small" />
                ) : (
                  <Check
                    sx={{ color: "success.main", mr: 1 }}
                    fontSize="small"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Contains special character (!@#$%^&*)
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {!lengthValid ? (
                  <Close sx={{ color: "error.main", mr: 1 }} fontSize="small" />
                ) : (
                  <Check
                    sx={{ color: "success.main", mr: 1 }}
                    fontSize="small"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  At least 8 characters long
                </Typography>
              </Box>
            </Box>
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
                mb: 0,
              }}
            >
              <InputLabel htmlFor="confirm-password">
                Confirm Password
              </InputLabel>
              <OutlinedInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                endAdornment={<Box sx={{ width: 40 }} />}
                label="Confirm Password"
              />
            </FormControl>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              mt: "0 !important",
              pt: 2,
            }}
          >
            <Switch />
            <Typography
              variant="body2"
              sx={{
                ml: 0,
                fontSize: "0.875rem",
                fontWeight: 500,
                lineHeight: 1.4,
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: "75%", // ensures wrapping
              }}
            >
              I agree to the{" "}
              <Link href="/SignUp" color="primary">
                Terms of Service{" "}
              </Link>
              and{" "}
              <Link href="/privacy" color="primary">
                Privacy Policy
              </Link>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-center",
              justifyContent: "center",
              flexDirection: "column",
              maxWidth: "100%",
              width: "100%",
            }}
          >
            <Button
              fullWidth
              variant="contained"
              id="sign-in-button"
              onClick={() => createUser()}
            >
              <Typography
                variant="body1"
                sx={{
                  color: "#fff",
                  textTransform: "capitalize",
                  fontWeight: "bold",
                }}
              >
                Create Account
              </Typography>
              <ChevronRight sx={{ color: "#fff" }} />
            </Button>
            <Typography
              sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
            >
              Already have an account?{" "}
              <Link href="/" color="primary">
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default SignUp;
