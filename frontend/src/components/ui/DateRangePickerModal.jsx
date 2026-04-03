import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CalendarDays, Check } from 'lucide-react';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

function fmt(d) { return d.toISOString().split('T')[0]; }
function parseDate(s) { return s ? new Date(s + 'T00:00:00') : null; }

function getDays(year, month) {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    return { firstDow: first, total };
}

function addMonths(year, month, delta) {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
}

const PRESETS = [
    { label: 'Hari ini', fn: () => { const t = new Date(); const s = fmt(t); return { startDate: s, endDate: s }; } },
    { label: '7 Hari', fn: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 6); return { startDate: fmt(s), endDate: fmt(t) }; } },
    { label: '30 Hari', fn: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate() - 29); return { startDate: fmt(s), endDate: fmt(t) }; } },
    { label: 'Bulan ini', fn: () => { const t = new Date(); const s = new Date(t.getFullYear(), t.getMonth(), 1); return { startDate: fmt(s), endDate: fmt(t) }; } },
    { label: 'Bulan lalu', fn: () => { const t = new Date(); const s = new Date(t.getFullYear(), t.getMonth() - 1, 1); const e = new Date(t.getFullYear(), t.getMonth(), 0); return { startDate: fmt(s), endDate: fmt(e) }; } },
];

function MonthGrid({ year, month, startDate, endDate, hoverDate, onDayClick, onDayHover }) {
    const today = fmt(new Date());
    const { firstDow, total } = getDays(year, month);
    const cells = [];

    // Blank leading cells
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));

    const isStart = (d) => d && fmt(d) === startDate;
    const isEnd = (d) => d && fmt(d) === endDate;
    const isToday = (d) => d && fmt(d) === today;
    const isInRange = (d) => {
        if (!d || !startDate || !endDate) return false;
        const ds = fmt(d);
        return ds > startDate && ds < endDate;
    };
    const isHovered = (d) => {
        if (!d || !startDate || !hoverDate || endDate) return false;
        const ds = fmt(d);
        const hs = hoverDate;
        if (ds === startDate || ds === hs) return true;
        if (startDate < hs) return ds > startDate && ds < hs;
        return ds < startDate && ds > hs;
    };

    return (
        <div className="select-none">
            <p className="text-center text-sm font-semibold text-zinc-100 mb-4">
                {MONTHS[month]} {year}
            </p>
            <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />;
                    const ds = fmt(day);
                    const start = isStart(day);
                    const end = isEnd(day);
                    const inRange = isInRange(day);
                    const hov = isHovered(day);
                    const tod = isToday(day);

                    let cellCls = 'relative flex items-center justify-center h-9 text-sm transition-all duration-75 cursor-pointer ';
                    let innerCls = 'w-9 h-9 flex items-center justify-center rounded-full z-10 relative text-sm font-medium transition-all duration-150 ';

                    if (start || end) {
                        innerCls += 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 ';
                    } else if (inRange || hov) {
                        cellCls += 'bg-rose-500/10 ';
                        innerCls += 'text-rose-300 hover:bg-rose-500/20 ';
                    } else if (tod) {
                        innerCls += 'text-rose-400 border border-rose-500/40 hover:bg-rose-500/20 ';
                    } else {
                        innerCls += 'text-zinc-300 hover:bg-zinc-700 hover:text-white ';
                    }

                    // Range connecting bar
                    const showLeftBar = (inRange || hov) && !(start);
                    const showRightBar = (inRange || hov) && !(end);

                    return (
                        <div
                            key={i}
                            className={cellCls}
                            onClick={() => onDayClick(ds)}
                            onMouseEnter={() => onDayHover(ds)}
                        >
                            {showLeftBar && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-8 bg-rose-500/10" />}
                            {showRightBar && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-8 bg-rose-500/10" />}
                            <div className={innerCls}>{day.getDate()}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function DateRangePickerModal({ onApply, onClose, initialStart = '', initialEnd = '' }) {
    const today = new Date();
    const [leftYear, setLeftYear] = useState(today.getFullYear());
    const [leftMonth, setLeftMonth] = useState(today.getMonth());
    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd);
    const [hoverDate, setHoverDate] = useState(null);
    const [step, setStep] = useState(startDate ? 'end' : 'start'); // 'start' or 'end'

    const rightMon = addMonths(leftYear, leftMonth, 1);

    const handleDayClick = useCallback((ds) => {
        if (step === 'start' || (!startDate)) {
            setStartDate(ds);
            setEndDate('');
            setStep('end');
        } else {
            // If click before start, swap
            if (ds < startDate) {
                setEndDate(startDate);
                setStartDate(ds);
            } else {
                setEndDate(ds);
            }
            setStep('start');
        }
    }, [step, startDate]);

    const handlePreset = (preset) => {
        const range = preset.fn();
        setStartDate(range.startDate);
        setEndDate(range.endDate);
        setStep('start');
    };

    const handleApply = () => {
        if (startDate && endDate) {
            onApply({ startDate, endDate });
            onClose();
        }
    };

    const prevMonth = () => { const r = addMonths(leftYear, leftMonth, -1); setLeftYear(r.year); setLeftMonth(r.month); };
    const nextMonth = () => { const r = addMonths(leftYear, leftMonth, 1); setLeftYear(r.year); setLeftMonth(r.month); };

    const formatDisplay = (s) => s ? parseDate(s)?.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-3xl animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={18} className="text-rose-500" />
                        <h2 className="text-base font-semibold text-zinc-100">Pilih Rentang Tanggal</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex">
                    {/* Presets sidebar */}
                    <div className="w-44 border-r border-zinc-800 p-4 flex flex-col gap-1 shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Cepat Pilih</p>
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => handlePreset(p)}
                                className="text-left text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 px-3 py-2 rounded-lg transition-all"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Calendar area */}
                    <div className="flex-1 p-6">
                        {/* Selected range display */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`flex-1 px-4 py-2.5 rounded-lg border text-sm transition-all ${step === 'start' ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-zinc-700 bg-zinc-800/50 text-zinc-300'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Dari</span>
                                {formatDisplay(startDate)}
                            </div>
                            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                            <div className={`flex-1 px-4 py-2.5 rounded-lg border text-sm transition-all ${step === 'end' && startDate ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-zinc-700 bg-zinc-800/50 text-zinc-300'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Sampai</span>
                                {formatDisplay(endDate)}
                            </div>
                        </div>

                        {/* Step hint */}
                        <p className="text-[11px] text-zinc-600 mb-4 font-mono">
                            {step === 'start' ? '↗ Pilih tanggal mulai' : (startDate ? '↗ Sekarang pilih tanggal akhir' : '')}
                        </p>

                        {/* Dual calendar */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <button onClick={prevMonth} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div />
                                    <div />
                                </div>
                                <MonthGrid
                                    year={leftYear} month={leftMonth}
                                    startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                                    onDayClick={handleDayClick}
                                    onDayHover={setHoverDate}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div />
                                    <div />
                                    <button onClick={nextMonth} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <MonthGrid
                                    year={rightMon.year} month={rightMon.month}
                                    startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                                    onDayClick={handleDayClick}
                                    onDayHover={setHoverDate}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/40">
                    <button
                        onClick={() => { setStartDate(''); setEndDate(''); setStep('start'); }}
                        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Reset
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-all hover:bg-zinc-800">
                            Batal
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!startDate || !endDate}
                            className="px-5 py-2 text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-rose-500/20"
                        >
                            <Check size={14} />
                            Terapkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
