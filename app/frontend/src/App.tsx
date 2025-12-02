import { Suspense, lazy } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LoginScreen from './components/LoginScreen';

const CharacterManagerPWA = lazy(() => import('./components/CharacterManagerPWA'));

function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono">
        LOADING SYSTEM...
      </div>
    );
  }

  return (
    <>
      {!authenticated ? (
        <LoginScreen />
      ) : (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono">LOADING PWA...</div>}>
          <CharacterManagerPWA />
        </Suspense>
      )}
    </>
  );
}

export default App;