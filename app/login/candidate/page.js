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
    <main className="flex min-h-screen items-center justify-center p-4 text-[#2f2a25]">
      <div className="w-full max-w-xl p-6 md:p-8 glass-tile">
        
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#2f2a25] uppercase tracking-tight">
            Join <span className="text-accent">The Squad</span>
          </h2>
          <p className="text-graphite-faint text-[10px] font-medium uppercase tracking-[0.35em] mt-2">Candidate Onboarding</p>
        </div>

        {status === 'success' ? (
          <div className="py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#2f2a25] uppercase">Transmission Received</h3>
            <p className="text-graphite-muted mt-2 font-medium uppercase text-xs tracking-widest">Airtable has been updated. Stand by for contact.</p>
            <button onClick={() => setStatus('idle')} className="mt-8 text-accent font-semibold uppercase text-[10px] tracking-widest hover:text-[#2f2a25] transition-colors">Submit Another?</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
            {/* Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1 text-shadow-glow">Full Name</label>
              <input name="name" required placeholder="ART VANDELAY" className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] focus:bg-white transition-all placeholder:text-[#6f5c48]/50" />
            </div>

            {/* Email */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <input name="email" type="email" required placeholder="ART@VANDELAY.COM" className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] focus:bg-white transition-all placeholder:text-[#6f5c48]/50" />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1">Address</label>
              <input name="address" required placeholder="123 MAIN ST, AUSTIN, TX 78701" className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] focus:bg-white transition-all placeholder:text-[#6f5c48]/50" />
            </div>

            {/* Role */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1">Role</label>
              <select name="role" required defaultValue="" className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] transition-all appearance-none cursor-pointer">
                <option value="" disabled>Select a role</option>
                <option>Full Stack Developer</option>
                <option>Frontend Engineer</option>
                <option>Backend Engineer</option>
                <option>Mobile Developer (iOS)</option>
                <option>Mobile Developer (Android)</option>
                <option>DevOps Engineer</option>
                <option>Cloud Architect</option>
                <option>Security Engineer</option>
                <option>QA Engineer</option>
                <option>Data Scientist</option>
                <option>Machine Learning Engineer</option>
                <option>AI Researcher</option>
                <option>Data Analyst</option>
                <option>Product Manager</option>
                <option>Project Manager</option>
                <option>UX/UI Designer</option>
                <option>Graphic Designer</option>
                <option>Motion Designer</option>
                <option>Content Strategist</option>
                <option>Copywriter</option>
                <option>SEO Specialist</option>
                <option>Growth Marketer</option>
                <option>Paid Ads Specialist</option>
                <option>Sales Development Rep</option>
                <option>Account Manager</option>
                <option>Customer Success Manager</option>
                <option>Business Analyst</option>
                <option>Operations Manager</option>
                <option>Finance Analyst</option>
                <option>HR / Recruiter</option>
                <option>Technical Writer</option>
                <option>Systems Architect</option>
              </select>
            </div>

            {/* Experience */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1">Experience</label>
              <input name="experience" required placeholder="E.G. 5 YEARS" className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] focus:bg-white transition-all placeholder:text-[#6f5c48]/50" />
            </div>

            {/* About */}
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-3 ml-1">Tell Us About Yourself</label>
              <textarea
                name="about"
                required
                rows={4}
                placeholder="Quick background, your strengths, and what you love building."
                className="w-full bg-[#f7f2ea] border border-[#e6d8c6] p-3 rounded-2xl text-[#2f2a25] outline-none focus:border-[#9a7a55] focus:bg-white transition-all placeholder:text-[#6f5c48]/50 resize-none"
              />
            </div>

            {/* Resume Upload */}
            <div className="col-span-2 glass-tile p-4 border border-dashed border-[#e6d8c6] hover:border-[#9a7a55]/50 transition-colors">
              <label className="block text-[10px] font-semibold text-accent uppercase tracking-widest mb-4 text-center">Attach Resume (PDF Format Only)</label>
              <input 
                name="resume" 
                type="file" 
                accept=".pdf"
                required 
                className="block w-full text-xs text-graphite-faint file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-[#8b6d4b] file:text-white hover:file:bg-[#9a7a55] file:cursor-pointer file:uppercase file:tracking-widest transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-2 mt-2">
              <button 
                disabled={status === 'sending'}
                type="submit" 
                className="w-full bg-[#8b6d4b] hover:bg-[#9a7a55] text-white font-semibold py-4 rounded-2xl transition-all shadow-xl shadow-black/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em]"
              >
                {status === 'sending' ? 'Sending to Command...' : 'Launch Application'}
              </button>
              
              {status === 'error' && (
                <p className="text-red-400 text-center font-semibold mt-4 text-[10px] uppercase tracking-widest">✕ Connection Error. Check your connection.</p>
              )}
            </div>
          </form>
        )}

        <div className="mt-8 text-center border-t border-[#e6d8c6] pt-6">
          <Link href="/login" className="text-[10px] text-graphite-faint hover:text-[#9a7a55] transition-colors uppercase font-semibold tracking-[0.3em]">
            ← Return to Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
