
import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  icon: string;
  colorClass: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${colorClass}`}>
      <i className={`fas ${icon} text-xl`}></i>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);
