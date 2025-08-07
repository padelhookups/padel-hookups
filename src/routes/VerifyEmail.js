import { useEffect } from "react";
import { getAuth, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router";

export default function VerifyEmail() {
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const url = window.location.href;

    // You must get the email either from saved localStorage or URL param
    const email = window.localStorage.getItem("emailForSignIn") 
      || new URLSearchParams(window.location.search).get("email");

    if (!email) {
      console.error("No email found for sign-in.");
      return;
    }

    if (signInWithEmailLink(auth, url)) {
      signInWithEmailLink(auth, email, url)
        .then(() => {
          // Clear saved email
          window.localStorage.removeItem("emailForSignIn");
          // Redirect to SignUp page or main app page
          navigate(`/SignUp?email=${encodeURIComponent(email)}`);
        })
        .catch((error) => {
          console.error("Error signing in with email link:", error);
        });
    } else {
      console.error("Invalid sign-in email link.");
    }
  }, [auth, navigate]);

  return <div>Verifying your sign-in link...</div>;
}
