import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { getAuth, applyActionCode } from 'firebase/auth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    const continueUrl = params.get('continueUrl') || '/';

    if (mode === 'verifyEmail' || mode === 'signIn') {
      applyActionCode(auth, oobCode)
        .then(() => {
          // Action code applied successfully, redirect to continueUrl
          navigate(new URL(continueUrl).pathname + new URL(continueUrl).search);
        })
        .catch((error) => {
          console.error('Error applying action code:', error);
          // Optionally redirect or show error message
          navigate('/');
        });
    } else {
      // If mode is unrecognized, redirect home or elsewhere
      navigate('/');
    }
  }, [auth, location, navigate]);

  return <div>Processing...</div>;
}
