"use client";
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. THE GATEKEEPER FUNCTION
  const handleLogin = (e) => {
    e.preventDefault();
    // This looks at the password you set in Vercel Settings
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Access Denied");
    }
  };

  // 2. THE DATA FETCHING (Only runs if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/get-candidates')
        .then(res => res.json())
        .then(data => {
          setCandidates(data);
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  // SCREEN A: The "Locked Door" (Login Page)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Freelancer OS</h1>
          <p className="text-zinc-400 mb-6 text-sm">Secure Admin Access</p>
          <input 
            type="password" 
            placeholder="Enter Admin Password"
            className="w-full p-3 rounded bg-black border border-zinc-700 text-white mb-4 focus:border-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition">
            Unlock Command Center
          </button>
        </form>
      </div>
    );
  }

  // SCREEN B: The "Room" (Your actual Dashboard)
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-4xl font-black tracking-tighter text-blue-500">COMMAND CENTER</h1>
          <div className="bg-zinc-900 px-4 py-2 rounded-full border border-zinc-700 text-sm font-mono">
            {candidates.length} APPLICANTS DETECTED
          </div>
        </div>

        {loading ? (
          <p className="text-zinc-500 animate-pulse">Scanning encrypted records...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((person) => (
              <div key={person.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-blue-900 transition group">
                <h2 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition">{person.name}</h2>
                <p className="text-zinc-500 text-sm mb-4">{person.email}</p>
                <div className="space-y-2 mb-6">
                  <div className="text-xs text-zinc-600 uppercase font-bold tracking-widest">Experience</div>
                  <p className="text-sm text-zinc-300 line-clamp-2">{person.experience}</p>
                </div>
                <a 
                  href={person.resumeUrl} 
                  target="_blank" 
                  className="block text-center bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded uppercase tracking-widest transition"
                >
                  View Dossier
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}