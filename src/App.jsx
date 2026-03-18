import { useEffect, useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginNewPage } from './pages/LoginNewPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicPrescriptionPage } from './pages/PublicPrescriptionPage';
import { ReceptionBoardPage } from './pages/ReceptionBoardPage';
import { getSession, setSession as persistSession, clearSession } from './lib/session';

function App() {
  const [path, setPath] = useState(window.location.pathname || '/login');
  const [session, setSession] = useState(() => getSession());
  const [navState, setNavState] = useState(null);

  const navigate = (nextPath, options = {}) => {
    const method = options.replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', nextPath);
    setNavState(options.patient ? { patient: options.patient } : null);
    setPath(nextPath);
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname || '/new-prescription');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (path === '/') {
      navigate(session ? '/new-prescription' : '/login', { replace: true });
      return;
    }

    if (path === '/new-login') {
      navigate('/login', { replace: true });
      return;
    }

    if (!session && path !== '/register' && path !== '/login-new' && path !== '/login' && !path.startsWith('/prescription/')) {
      navigate('/login', { replace: true });
    }
  }, [path, session]);

  // Public prescription page (no auth required)
  if (path.startsWith('/prescription/')) {
    const prescriptionId = path.split('/prescription/')[1];
    return <PublicPrescriptionPage prescriptionId={prescriptionId} />;
  }

  if (path === '/login-new' || path === '/login') {
    return (
      <LoginNewPage
        onOtpResolved={(result) => {
          const authSession = result?.session;
          if (!authSession?.userUid) return;
          persistSession(authSession);
          setSession(authSession);
          if (result?.registered) {
            navigate('/new-prescription');
          } else {
            navigate('/onboarding/personal-details');
          }
        }}
        onReceptionistLogin={(authSession) => {
          if (!authSession?.userUid) return;
          persistSession(authSession);
          setSession(authSession);
          navigate('/reception-board');
        }}
      />
    );
  }

  if (path === '/register') {
    return (
      <RegisterPage
        onRegistered={(authSession) => {
          persistSession(authSession);
          setSession(authSession);
          navigate('/onboarding/personal-details');
        }}
        onLoggedIn={(authSession) => {
          persistSession(authSession);
          setSession(authSession);
          navigate('/new-prescription');
        }}
      />
    );
  }

  if (path === '/onboarding/personal-details') {
    return (
      <OnboardingPage
        step="personal-details"
        userSession={session}
        onNext={() => navigate('/onboarding/expertise')}
      />
    );
  }

  if (path === '/onboarding/expertise') {
    return (
      <OnboardingPage
        step="expertise"
        userSession={session}
        onBack={() => navigate('/onboarding/personal-details')}
        onNext={() => navigate('/onboarding/smart-tags')}
      />
    );
  }

  if (path === '/onboarding/smart-tags') {
    return (
      <OnboardingPage
        step="smart-tags"
        userSession={session}
        onBack={() => navigate('/onboarding/expertise')}
        onComplete={() => navigate('/new-prescription')}
      />
    );
  }

  if (path === '/dashboard') {
    return <DashboardPage view="home" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/new-prescription') {
    return <DashboardPage view="newPrescriptionHome" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/new-prescription/details') {
    return <DashboardPage view="newPrescription" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} navState={navState} />;
  }

  if (path === '/new-prescription/preview') {
    return <DashboardPage view="preview" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/profile') {
    return <DashboardPage view="profile" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/smart-tags') {
    return <DashboardPage view="smartTags" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/my-patients') {
    return <DashboardPage view="myPatients" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/history') {
    return <DashboardPage view="history" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/appointments') {
    return <DashboardPage view="appointments" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
  }

  if (path === '/reception-board') {
    return <ReceptionBoardPage onNavigate={navigate} userSession={session} />;
  }

  return <DashboardPage view="newPrescriptionHome" onNavigate={navigate} userSession={session} onSignOut={handleSignOut} />;
}

export default App;
