export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Sign In</h2>
        
        <form className="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="p-3 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
          />
          <button className="bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 mt-2 transition-all">
            Enter Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}