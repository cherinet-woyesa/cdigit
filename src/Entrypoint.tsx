import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Entrypoint = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Always navigate to language selection - branch ID logic removed
    navigate('/language-selection');
  }, [navigate]);

  // Render nothing, as this component is only for redirection
  return null;
};

export default Entrypoint;
