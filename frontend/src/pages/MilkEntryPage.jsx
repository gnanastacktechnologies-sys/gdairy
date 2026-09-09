import React, { useState, useEffect } from 'react';
import {
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiAlertCircle,
  FiSave,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiAlertTriangle,
  FiHome
} from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTodayDateString, formatCurrency, formatLitres, formatDate } from '../utils/formatters';

const MilkEntryPage = () => {
  const { user, systemDairyName } = useAuth();
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // User Dairy Joining Date in YYYY-MM-DD format
  const userJoiningDateStr = (user?.joiningDate || user?.createdAt)
    ? new Date(user?.joiningDate || user?.createdAt).toISOString().split('T')[0]
    : todayStr;
  const [session, setSession] = useState('morning');
  const [litres, setLitres] = useState('');
  const [milkPricePerLitre, setMilkPricePerLitre] = useState('50'); // Default ₹50/L
  const [dairyName, setDairyName] = useState(user?.dairyName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Month navigation state
  const [viewDate, setViewDate] = useState(new Date());
  const [monthEntriesMap, setMonthEntriesMap] = useState({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Selected date entries state
  const [selectedDateEntries, setSelectedDateEntries] = useState([]);
  const [loadingSelected, setLoadingSelected] = useState(false);

  // Computed Total Amount (Litres * Price/Litre)
  const litresNum = parseFloat(litres) || 0;
  const priceNum = parseFloat(milkPricePerLitre) || 0;
  const totalAmount = Math.round((litresNum * priceNum + Number.EPSILON) * 100) / 100;



  // Fetch month entries when viewDate changes
  useEffect(() => {
    fetchMonthEntries(viewDate);
  }, [viewDate]);

  // Fetch selected date entries when selectedDate changes
  useEffect(() => {
    fetchSelectedDateEntries(selectedDate);
  }, [selectedDate]);

  const fetchMonthEntries = async (currentViewDate) => {
    setLoadingMonth(true);
    try {
      const year = currentViewDate.getFullYear();
      const month = currentViewDate.getMonth();
      const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const res = await api.get(`/milk?startDate=${firstDayStr}&endDate=${lastDayStr}&limit=500`);
      if (res.data.success) {
        const map = {};
        res.data.data.forEach((entry) => {
          if (!map[entry.date]) map[entry.date] = [];
          map[entry.date].push(entry);
        });
        setMonthEntriesMap(map);
      }
    } catch (error) {
      console.error('Failed to fetch month entries:', error);
    } finally {
      setLoadingMonth(false);
    }
  };

  const fetchSelectedDateEntries = async (dateStr) => {
    setLoadingSelected(true);
    try {
      const res = await api.get(`/milk?startDate=${dateStr}&endDate=${dateStr}&limit=50`);
      if (res.data.success) {
        setSelectedDateEntries(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch selected date entries:', error);
    } finally {
      setLoadingSelected(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedDate) {
      setMessage({ type: 'error', text: 'Please select a collection date.' });
      return;
    }

    if (!litresNum || litresNum <= 0) {
      setMessage({ type: 'error', text: 'Milk quantity litres must be greater than 0.' });
      return;
    }

    if (priceNum < 0) {
      setMessage({ type: 'error', text: 'Price per litre cannot be negative.' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/milk', {
        date: selectedDate,
        session,
        litres: litresNum,
        milkPricePerLitre: priceNum,
        dairyName
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Milk entry saved for ${session} on ${formatDate(selectedDate)} (${formatLitres(litresNum)} × ₹${priceNum} = ${formatCurrency(totalAmount)})`
        });
        setLitres('');
        fetchSelectedDateEntries(selectedDate);
        fetchMonthEntries(viewDate);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save milk entry.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Calendar Days Calculation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sun
  const startingOffset = (firstDayOfWeek + 6) % 7; // Convert to Mon-first offset (0 for Mon, 6 for Sun)

  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Selected date entries summary calculation
  const morningEntry = selectedDateEntries.find((e) => e.session === 'morning');
  const eveningEntry = selectedDateEntries.find((e) => e.session === 'evening');
  const dateTotalLitres = selectedDateEntries.reduce((acc, curr) => acc + curr.litres, 0);
  const dateTotalAmount = selectedDateEntries.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Permission Check
  const canAddMilk = user?.role === 'admin' || user?.permissions?.canAddMilk !== false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
            <FiCalendar className="text-primary w-6 h-6" />
            <span>Milk Collection Calendar & Entry</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">
            Select any date from the monthly calendar. Completed entries show in green, missed entries in amber, and upcoming days in grey.
          </p>
        </div>
      </div>

      {/* Restricted Permission Alert Banner */}
      {!canAddMilk && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 flex items-start gap-4 shadow-sm animate-fadeIn">
          <FiAlertTriangle className="w-8 h-8 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-bold">Milk Collection Entry Access Restricted</h3>
            <p className="text-xs leading-relaxed font-medium text-rose-800">
              Your Administrator has currently restricted milk entry access for your account. You can view historical entries on the calendar, but new milk collection entries cannot be submitted without permission. Please contact your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2-Column Grid Layout: Calendar (Left) & Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Monthly Calendar */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          {/* Calendar Header & Month Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-text-main tracking-tight">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous Month"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewDate(new Date())}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next Month"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Highlight Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 inline-block"></span>
              <span className="text-emerald-900">Both Sessions (Full Green)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border border-emerald-600 inline-block bg-[linear-gradient(90deg,#10b981_50%,#e2e8f0_50%)]"></span>
              <span className="text-emerald-800">Morning Only (Half Green)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 inline-block"></span>
              <span className="text-amber-900">Missed Entry (Amber)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 inline-block"></span>
              <span className="text-slate-600">Upcoming (Grey)</span>
            </div>
          </div>

          {/* Calendar Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-text-sub pt-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Monthly Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank Offset Days */}
            {Array.from({ length: startingOffset }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-10 sm:h-12 rounded-xl bg-transparent"></div>
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const isUpcoming = dateStr > todayStr;
              const dayEntries = monthEntriesMap[dateStr] || [];
              const hasMorning = dayEntries.some((e) => e.session === 'morning');
              const hasEvening = dayEntries.some((e) => e.session === 'evening');
              const isFullCompleted = hasMorning && hasEvening;
              const isHalfCompleted = (hasMorning && !hasEvening) || (!hasMorning && hasEvening);
              
              // Only mark as missed if the date is on/after user dairy joining date AND before today AND has 0 entries
              const isMissed = dateStr < todayStr && dateStr >= userJoiningDateStr && dayEntries.length === 0;
              const isBeforeCreation = dateStr < userJoiningDateStr && dayEntries.length === 0;

              // Color styles calculation
              let colorStyle = '';
              let customStyle = {};
              let badgeIcon = null;

              if (isUpcoming) {
                // Upcoming Days -> Grey
                colorStyle = 'bg-slate-100 text-slate-400 border-slate-200/80 cursor-not-allowed';
              } else if (isBeforeCreation) {
                // Prior to user account creation date -> Soft neutral slate (not a missed entry)
                colorStyle = 'bg-slate-50/80 text-slate-400 border-slate-200/60 font-medium hover:bg-slate-100 cursor-pointer';
              } else if (isFullCompleted) {
                // Both Morning & Evening Completed -> Full Green
                colorStyle = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold hover:bg-emerald-200 cursor-pointer';
                badgeIcon = <span className="w-2 h-2 rounded-full bg-emerald-600"></span>;
              } else if (isHalfCompleted) {
                // Half Completed (e.g. Morning Done) -> Half Green Split Gradient
                colorStyle = 'text-slate-900 border-emerald-400 font-extrabold hover:opacity-95 cursor-pointer shadow-xs';
                customStyle = {
                  background: 'linear-gradient(135deg, #a7f3d0 0%, #a7f3d0 50%, #ffffff 50%, #ffffff 100%)'
                };
                badgeIcon = (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-800 bg-emerald-200/90 px-1 rounded">
                    {hasMorning ? 'AM' : 'PM'}
                  </span>
                );
              } else if (isMissed) {
                // Missed Days (since account creation) -> Amber Alert Highlight
                colorStyle = 'bg-amber-50 text-amber-900 border-amber-300/90 font-bold hover:bg-amber-100 cursor-pointer';
                badgeIcon = <span className="w-2 h-2 rounded-full bg-amber-500"></span>;
              } else {
                // Today with no entries yet
                colorStyle = 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold hover:bg-indigo-100 cursor-pointer';
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isUpcoming}
                  onClick={() => {
                    if (!isUpcoming) setSelectedDate(dateStr);
                  }}
                  style={customStyle}
                  className={`relative h-10 sm:h-12 rounded-xl border flex flex-col items-center justify-center transition-all ${colorStyle} ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105 shadow-md z-10' : ''
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold">{dayNum}</span>
                  {badgeIcon && <div className="absolute bottom-1">{badgeIcon}</div>}
                  {isToday && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary ring-1 ring-white"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-text-sub font-medium flex items-center justify-between border-t border-slate-100">
            <span>Selected Date: <strong className="text-text-main">{formatDate(selectedDate)}</strong></span>
            {selectedDate === todayStr && <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">TODAY</span>}
          </div>
        </div>

        {/* RIGHT COLUMN: Record Milk Collection Form & Selected Date Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          {/* Milk Entry Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-text-main">Record Milk Collection</h2>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {formatDate(selectedDate)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
                  Collection Date *
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="date"
                    value={selectedDate}
                    min={userJoiningDateStr}
                    max={todayStr}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Milk collection starts from your Dairy Joining Date ({userJoiningDateStr}).
                </p>
              </div>

              {/* Session Toggle Buttons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
                  Session *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSession('morning')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      session === 'morning'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FiSun className="w-4 h-4" />
                    <span>Morning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSession('evening')}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      session === 'evening'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FiMoon className="w-4 h-4" />
                    <span>Evening</span>
                  </button>
                </div>
              </div>

              {/* Litres Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
                  Milk Quantity (Litres) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={litres}
                    onChange={(e) => setLitres(e.target.value)}
                    placeholder="e.g. 5.50"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    LITRES
                  </span>
                </div>
              </div>

              {/* Price / Litre Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
                  Price / Litre (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={milkPricePerLitre}
                    onChange={(e) => setMilkPricePerLitre(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Dairy Name Info Badge (Central Source of Truth) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-2">
                  Dairy Name (System Central)
                </label>
                <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FiHome className="w-4 h-4 text-indigo-600" />
                  <span>{systemDairyName || user?.dairyName || 'GDairy'}</span>
                </div>
              </div>
            </div>

            {/* Automatic Total Amount Field (Read-only Computed) */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                  Total Amount (Calculated)
                </span>
                <p className="text-xs text-indigo-600/80 mt-0.5">
                  {litresNum > 0 ? `${litresNum} L × ₹${priceNum}/L` : 'Enter litres to compute total'}
                </p>
              </div>
              <div className="text-2xl font-black text-indigo-700">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving || !canAddMilk}
              className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              <span>{saving ? 'Saving Entry...' : !canAddMilk ? 'Access Restricted by Admin' : 'Save Milk Entry'}</span>
            </button>
          </form>

          {/* Selected Date Session Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-text-main flex items-center justify-between">
              <span>Collection Entries for {formatDate(selectedDate)}</span>
              <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Total: {formatLitres(dateTotalLitres)} ({formatCurrency(dateTotalAmount)})
              </span>
            </h3>

            {loadingSelected ? (
              <div className="py-4 text-center text-xs text-text-sub">Loading entries...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <FiSun className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-main">Morning Session</h4>
                      <p className="text-xs text-text-sub font-medium">
                        {morningEntry ? `${morningEntry.litres} L @ ₹${morningEntry.milkPricePerLitre}` : 'No entry recorded'}
                      </p>
                      {morningEntry?.createdBy && (
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Entry by: {morningEntry.createdBy.role === 'admin' ? `👑 Admin (${morningEntry.createdBy.name})` : `👤 Farmer (${morningEntry.createdBy.name})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-text-main">
                      {morningEntry ? formatCurrency(morningEntry.totalAmount) : '₹0'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <FiMoon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-main">Evening Session</h4>
                      <p className="text-xs text-text-sub font-medium">
                        {eveningEntry ? `${eveningEntry.litres} L @ ₹${eveningEntry.milkPricePerLitre}` : 'No entry recorded'}
                      </p>
                      {eveningEntry?.createdBy && (
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Entry by: {eveningEntry.createdBy.role === 'admin' ? `👑 Admin (${eveningEntry.createdBy.name})` : `👤 Farmer (${eveningEntry.createdBy.name})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-text-main">
                      {eveningEntry ? formatCurrency(eveningEntry.totalAmount) : '₹0'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilkEntryPage;
