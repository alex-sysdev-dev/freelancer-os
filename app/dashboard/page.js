'use client';
import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddEarningForm from '@/components/AddEarningForm';

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/earnings');
      const data = await res.json();
      setChartData(data);
      const sum = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setTotal(sum);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8  min-h-screen text-white ">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black tracking-tight uppercase italic">Freelancer OS</h1>
          <div className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-xs font-bold flex items-center shadow-lg shadow-green-500/20">
            <TrendingUp size={14} className="mr-1"/> LIVE FROM AIRTABLE
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-sm">
            <p className="text-xs text-blue-100 font-black uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-4xl font-black text-white">${total.toLocaleString()}</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-8 rounded-2xl flex flex-col items-center justify-center hover:bg-white/20 transition-all shadow-sm"
          >
            <Plus className="mb-1" size={32} />
            <span className="font-black uppercase tracking-tight text-sm">Add New Earning</span>
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-gray-400">Income Stream</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontWeight: 'bold', color: '#2563eb'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  name="Earning"
                  stroke="#2563eb" 
                  strokeWidth={6} 
                  dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AddEarningForm 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchData(); 
        }} 
      />
    </div>
  );
}