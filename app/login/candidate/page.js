'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CandidateForm() {
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    
    // We use FormData because it can carry the physical PDF file
    const formData = new FormData(e.target);

    try {
      const res = await fetch('/api/submit-candidate', {
        method: 'POST',
        // Important: No headers! The browser sets the boundary for FormData automatically
        body: formData, 
      });

      if (res.ok) {
        setStatus('success');
        e.target.reset(); // Clears the form for the next person
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus('error');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#000a16] p-4 font-sans">
      <div className="w-full max-w-2xl p-8 md:p-12 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
        
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Join <span className="text-blue-500">The Squad</span>
          </h2>
          <p className="text-blue-100/30 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Candidate Onboarding</p>
        </div>

        {status === 'success' ? (
          <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic">Transmission Received</h3>
            <p className="text-blue-100/40 mt-2 font-bold uppercase text-xs tracking-widest">Airtable has been updated. Stand by for contact.</p>
            <button onClick={() => setStatus('idle')} className="mt-8 text-blue-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Submit Another?</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            {/* Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1 text-shadow-glow">Full Name</label>
              <input name="name" required placeholder="ART VANDELAY" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-white/10" />
            </div>

            {/* Email */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <input name="email" type="email" required placeholder="ART@VANDELAY.COM" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-white/10" />
            </div>

            {/* Role */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">Specialization</label>
              <select name="role" className="w-full bg-[#000a16] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
                <option>Full Stack Developer</option>
                <option>UI/UX Designer</option>
                <option>System Architect</option>
                <option>Growth Hacker</option>
              </select>
            </div>

            {/* Experience */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 ml-1">Experience</label>
              <input name="experience" required placeholder="E.G. 5 YEARS" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-white/10" />
            </div>

            {/* Resume Upload */}
            <div className="col-span-2 bg-white/5 p-6 rounded-3xl border border-dashed border-white/10 hover:border-blue-500/50 transition-colors">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 text-center">Attach Resume (PDF Format Only)</label>
              <input 
                name="resume" 
                type="file" 
                accept=".pdf"
                required 
                className="block w-full text-xs text-blue-100/40 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer file:uppercase file:tracking-widest transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-2 mt-4">
              <button 
                disabled={status === 'sending'}
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
              >
                {status === 'sending' ? 'Sending to Command...' : 'Launch Application'}
              </button>
              
              {status === 'error' && (
                <p className="text-red-400 text-center font-bold mt-4 text-[10px] uppercase tracking-widest">✕ Connection Error. Check your connection.</p>
              )}
            </div>
          </form>
        )}

        <div className="mt-12 text-center border-t border-white/5 pt-8">
          <Link href="/login" className="text-[10px] text-blue-100/20 hover:text-blue-400 transition-colors uppercase font-black tracking-[0.3em]">
            ← Return to Portal
          </Link>
        </div>
      </div>
    </main>
  );
}