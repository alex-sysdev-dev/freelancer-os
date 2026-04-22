'use client';

import Link from 'next/link';
import { BUSINESS_TYPES } from '@/lib/saas/templates';

export default function SaasLandingPage() {
  return (
    <div className="min-h-screen graphite-bg text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl">BotBuilder</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/saas/login" className="text-sm text-white/70 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/saas/signup"
            className="bg-[#5ec7b7] hover:bg-[#4db5a5] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block bg-[#5ec7b7]/10 border border-[#5ec7b7]/30 text-[#5ec7b7] text-xs font-semibold px-3 py-1 rounded-full mb-6">
          No code required
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Build a smart chatbot
          <br />
          <span className="text-[#5ec7b7]">for your business</span>
        </h1>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
          Train a custom AI assistant with your own Q&amp;A, add it to your website in minutes,
          and let it handle customer questions 24/7.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/saas/signup"
            className="bg-[#5ec7b7] hover:bg-[#4db5a5] text-black font-semibold px-8 py-3 rounded-lg transition-colors text-base"
          >
            Start building for free
          </Link>
          <Link
            href="/saas/login"
            className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-medium px-8 py-3 rounded-lg transition-colors text-base"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Business Types */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-4">Built for every industry</h2>
        <p className="text-center text-white/50 mb-10">
          Pick a template and your bot is ready to train in seconds.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BUSINESS_TYPES.map((type) => (
            <div
              key={type.id}
              className="glass-tile-dark rounded-xl p-5 flex items-start gap-4 hover:border-[#5ec7b7]/40 transition-colors cursor-default"
            >
              <span className="text-3xl">{type.icon}</span>
              <div>
                <div className="font-semibold text-sm">{type.label}</div>
                <div className="text-xs text-white/50 mt-1">{type.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/10">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Choose a template', desc: 'Pick your industry. Get a pre-written AI assistant prompt instantly.' },
            { step: '02', title: 'Train with your data', desc: 'Add your own Q&A pairs, menu items, property details — anything.' },
            { step: '03', title: 'Embed on your site', desc: 'Copy one line of code and your bot is live. No developer needed.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl font-bold text-[#5ec7b7]/40 mb-3">{item.step}</div>
              <div className="font-semibold mb-2">{item.title}</div>
              <div className="text-sm text-white/50">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="glass-tile rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Ready to build your bot?</h2>
          <p className="text-white/50 mb-7">Free to start. No credit card required.</p>
          <Link
            href="/saas/signup"
            className="bg-[#5ec7b7] hover:bg-[#4db5a5] text-black font-semibold px-8 py-3 rounded-lg transition-colors inline-block"
          >
            Create your free account
          </Link>
        </div>
      </section>
    </div>
  );
}
