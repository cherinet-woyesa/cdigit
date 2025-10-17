import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Entrypoint = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const context = params.get('context');
    const branchId = params.get('branchId');

    if (context === 'in-branch' && branchId) {
      // Navigate to the in-branch flow, preserving the branchId
      navigate(`/welcome?branchId=${branchId}`);
    } else {
      // Navigate to the default remote flow
      navigate('/language-selection');
    }
  }, [navigate, location.search]);

  // Render nothing, as this component is only for redirection
  return null;
};

export default Entrypoint;
