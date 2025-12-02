import { usePrivy } from '@privy-io/react-auth';

export function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center text-white font-mono p-4">
      <div className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">KAMIGOTCHI</div>
      <div className="text-sm text-cyan-300 mb-8 tracking-widest">HARVEST SIMULATOR v2.0</div>
      
      <button 
        onClick={login}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded border-4 border-green-700 shadow-[0_0_20px_rgba(0,255,0,0.5)] transition-all transform hover:scale-105"
      >
        CONNECT WALLET
      </button>
      
      <div className="mt-8 text-xs text-gray-500">
        POWERED BY SUPABASE & MUD
      </div>
    </div>
  );
}

export default LoginScreen;