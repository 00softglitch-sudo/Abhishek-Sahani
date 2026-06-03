/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subject, Topic, StudySession, Revision } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, CheckCircle, Clock } from 'lucide-react';

interface CalendarScreenProps {
  sessions: StudySession[];
  revisions: Revision[];
  topics: Topic[];
  subjects: Subject[];
}

export default function CalendarScreen({
  sessions,
  revisions,
  topics,
  subjects,
}: CalendarScreenProps) {
  // Setup calendar view bounds anchor (June 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(5); // June (0-indexed: 5)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-03');

  const todayStr = '2026-06-03';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getStartDayOfWeek = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, ...
    const day = new Date(year, month, 1).getDay();
    // Shift to start week on Monday (0 -> Mo, 1 -> Tu ... 6 -> Su)
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = daysInMonth(currentYear, currentMonthIndex);
  const startOffset = getStartDayOfWeek(currentYear, currentMonthIndex);

  // Next / Previous month navigators
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  // Analyze the color-code status of a given date
  const getDateStatus = (dateStr: string) => {
    const dayRevisions = revisions.filter(r => r.scheduledDate === dateStr);
    const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));

    if (dayRevisions.length === 0 && daySessions.length === 0) {
      return 'empty';
    }

    // Green = Completed: There are revisions and ALL of them are completed
    // Yellow = Partially completed: There are revisions, some completed, some not
    // Red = Missed: Revisions exist, none or some completed, past due. Or no sessions completed
    if (dayRevisions.length > 0) {
      const completedCount = dayRevisions.filter(r => r.completed).length;
      if (completedCount === dayRevisions.length) {
        return 'green';
      } else if (completedCount > 0) {
        return 'yellow';
      } else {
        // All uncompleted. If the date is past today, it is "missed/red", if future, light neutral/uncompleted
        return dateStr <= todayStr ? 'red' : 'neutral-pending';
      }
    }

    // Rest of studied dates without revisions: default blue/green
    if (daySessions.length > 0) {
      return 'green';
    }

    return 'empty';
  };

  // Generate date calculations
  const calendarCells = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push(null); // empty prefix paddings
  }
  for (let day = 1; day <= totalDays; day++) {
    const formattedDate = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      day,
      dateStr: formattedDate,
      status: getDateStatus(formattedDate),
    });
  }

  // Find info about selected date
  const selectedSessions = sessions.filter(s => s.startTime.startsWith(selectedDateStr));
  const selectedRevisions = revisions.filter(r => r.scheduledDate === selectedDateStr);

  const selectedSessionsDecorated = selectedSessions.map(s => {
    const topic = topics.find(t => t.id === s.topicId);
    const subject = topic ? subjects.find(sub => sub.id === topic.subjectId) : null;
    return {
      session: s,
      topicName: topic?.name || 'Unknown Topic',
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#cccccc',
    };
  });

  const selectedRevisionsDecorated = selectedRevisions.map(r => {
    const topic = topics.find(t => t.id === r.topicId);
    const subject = topic ? subjects.find(sub => sub.id === topic.subjectId) : null;
    return {
      ...r,
      topicName: topic?.name || 'Unknown Topic',
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#cccccc',
    };
  });

  const totalSelectedSeconds = selectedSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const totalSelectedMinutes = Math.round(totalSelectedSeconds / 60);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
      {/* Calendar Grid Section */}
      <div className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
        <header className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-base">
              {monthNames[currentMonthIndex]} {currentYear}
            </h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Days of week titles */}
        <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-bold font-sans text-slate-400">
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>Su</div>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2.5">
          {calendarCells.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-10 opacity-0" />;
            }

            const { day, dateStr, status } = cell;
            const isSelected = selectedDateStr === dateStr;
            const isToday = dateStr === todayStr;

            // Map color styles based on evaluated state status
            let statusColor = 'hover:border-slate-300 text-slate-700 bg-slate-50 border-slate-200';
            if (status === 'green') {
              statusColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/60';
            } else if (status === 'yellow') {
              statusColor = 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/60';
            } else if (status === 'red') {
              statusColor = 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100/60';
            } else if (status === 'neutral-pending') {
              statusColor = 'bg-slate-50/50 text-slate-500 border border-slate-200 hover:bg-slate-100';
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer border relative ${statusColor} ${
                  isSelected ? 'ring-2 ring-indigo-600 scale-[1.04] border-transparent z-10 font-black' : ''
                }`}
              >
                {day}
                {isToday && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/40" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-150 text-[10px] font-bold text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-250 inline-block" />
            <span>Fully Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-50 border border-amber-250 inline-block" />
            <span>Partially Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-50 border border-rose-250 inline-block" />
            <span>Missed / Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-white border-2 border-indigo-600 inline-block" />
            <span>Today Selected</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details Section */}
      <div className="lg:col-span-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-fit min-h-[380px] space-y-4">
        <div>
          <header className="pb-3 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tapped Activity</span>
            <p className="text-sm font-extrabold text-slate-800 font-sans mt-0.5">
              {selectedDateStr === todayStr ? 'Today' : selectedDateStr}
            </p>
          </header>

          <main className="py-2.5 space-y-4">
            {/* Studied sessions on selected day */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Study Sessions ({selectedSessionsDecorated.length})
              </span>
              {selectedSessionsDecorated.length === 0 ? (
                <p className="text-xs text-slate-400 font-sans italic pl-1">No topics studied on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessionsDecorated.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50/65 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: item.subjectColor }} />
                        <div>
                          <p className="text-xs font-bold text-slate-850 leading-tight">{item.topicName}</p>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">{item.subjectName}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {Math.round(item.session.duration / 60)}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revisions on selected day */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1-3-7 Revisions ({selectedRevisionsDecorated.length})
              </span>
              {selectedRevisionsDecorated.length === 0 ? (
                <p className="text-xs text-slate-400 font-sans italic pl-1">No revisions scheduled on this date.</p>
              ) : (
                <div className="space-y-2">
                  {selectedRevisionsDecorated.map((rev, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50/65 rounded-xl border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: rev.subjectColor }} />
                        <div>
                          <p className="text-xs font-bold text-slate-850 leading-tight">{rev.topicName}</p>
                          <span className="text-[9px] text-slate-500 font-medium font-sans">Day {rev.revisionStage}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        rev.completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {rev.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* General Summary Card */}
        <footer className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-650 space-y-1.5">
          <div className="flex justify-between items-center">
            <span>Total Study:</span>
            <span className="font-sans font-bold text-slate-800">{totalSelectedMinutes} minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Revisions Completed:</span>
            <span className="font-sans font-bold text-slate-800">
              {selectedRevisions.filter(r => r.completed).length} / {selectedRevisions.length}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
