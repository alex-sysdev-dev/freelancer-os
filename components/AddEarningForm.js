'use client';
import React, { useState } from 'react';

export default function AddEarningForm({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [company, setCompany] = useState('Outlier');
  const [project, setProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, company, project, date }),
    });

    if (response.ok) {
      alert(`Saved $${amount} for ${company}`);
      setAmount('');
      setProject('');
      setDate(new Date().toISOString().split('T')[0]); // Reset to today
      onClose();
    } else {
      alert('Error: Check API keys in route.js');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white p-8 rounded-xl w-full max-w-md border-2 border-gray-200 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-black">Add Earning</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          
          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Date</label>
            <input 
              type="date" 
              className="w-full p-3 border-2 border-gray-400 rounded-lg bg-white font-semibold outline-none focus:border-blue-600" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Company</label>
            <select 
              className="w-full p-3 border-2 border-gray-400 rounded-lg bg-white font-semibold outline-none focus:border-blue-600"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <option value="Outlier">Outlier</option>
              <option value="Alignerr">Alignerr</option>
              <option value="Mercor">Mercor (Paused)</option>
              <option value="Oneforma">Oneforma</option>
            </select>
          </div>
          
          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Project Name</label>
            <input 
              type="text" 
              className="w-full p-3 border-2 border-gray-400 rounded-lg bg-white font-semibold outline-none focus:border-blue-600" 
              placeholder="e.g. El Dorado, Hickory, Apollo"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-1 uppercase text-xs">Amount ($)</label>
            <input 
              type="number" 
              className="w-full p-3 border-2 border-gray-400 rounded-lg bg-white font-semibold outline-none focus:border-blue-600" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-black hover:bg-blue-700">SAVE</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-black">CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
}