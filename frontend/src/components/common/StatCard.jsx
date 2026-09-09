import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', badgeText }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text-sub uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-text-main mt-1 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-text-sub mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${selectedColor}`}>
            <Icon className="w-6 h-6 stroke-[2]" />
          </div>
        )}
      </div>
      {badgeText && (
        <span className="inline-block mt-3 px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full">
          {badgeText}
        </span>
      )}
    </div>
  );
};

export default StatCard;
