/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subject, Topic, Revision } from '../types';
import { Check, X, Calendar, ArrowRight, ArrowLeftRight, CheckCircle, Clock } from 'lucide-react';

interface RevisionScreenProps {
  revisions: Revision[];
  topics: Topic[];
  subjects: Subject[];
  onCompleteRevision: (id: string) => void;
  onSkipRevision: (id: string) => void;
  onRescheduleRevision: (id: string, newDate: string) => void;
}

export default function RevisionScreen({
  revisions,
  topics,
  subjects,
  onCompleteRevision,
  onSkipRevision,
  onRescheduleRevision,
}: RevisionScreenProps) {
  const [activeDateStr] = useState<string>('2026-06-03'); // Today
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [customRescheduleDate, setCustomRescheduleDate] = useState<string>('2026-06-04');

  // Filter out and decorate active revisions (Due today or earlier and not completed)
  const activeRevisionsDecorated = revisions
    .filter(r => r.scheduledDate <= activeDateStr && !r.completed)
    .map(r => {
      const topic = topics.find(t => t.id === r.topicId);
      const subject = topic ? subjects.find(s => s.id === topic.subjectId) : null;
      return {
        ...r,
        topicName: topic?.name || 'Unknown Topic',
        subjectName: subject?.name || 'General',
        subjectColor: subject?.color || '#94a3b8',
        isOverdue: r.scheduledDate < activeDateStr,
      };
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  // Completed revisions today
  const completedTodayDecorated = revisions
    .filter(r => r.completed && r.completedAt?.startsWith(activeDateStr))
    .map(r => {
      const topic = topics.find(t => t.id === r.topicId);
      const subject = topic ? subjects.find(s => s.id === topic.subjectId) : null;
      return {
        ...r,
        topicName: topic?.name || 'Unknown Topic',
        subjectName: subject?.name || 'General',
        subjectColor: subject?.color || '#94a3b8',
      };
    });

  const handleReschedule = (id: string, offsetDays: number) => {
    const today = new Date(activeDateStr);
    today.setDate(today.getDate() + offsetDays);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const newDateStr = `${y}-${m}-${d}`;
    onRescheduleRevision(id, newDateStr);
    setRescheduleTargetId(null);
  };

  const handleCustomRescheduleSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!customRescheduleDate) return;
    onRescheduleRevision(id, customRescheduleDate);
    setRescheduleTargetId(null);
  };

  const getStageLabel = (stage: 1 | 3 | 7) => {
    switch (stage) {
      case 1:
        return 'Day 1 Revision';
      case 3:
        return 'Day 3 Revision';
      case 7:
        return 'Day 7 Revision';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="flex justify-between items-end pb-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">Daily 1-3-7 Revisions</h2>
          <p className="text-xs text-slate-550 font-sans font-medium">
            Complete high-retention review loops to maximize neuron strength
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Date</span>
          <p className="text-sm font-bold font-mono text-indigo-600">June 3, 2026</p>
        </div>
      </header>

      {/* Main Revision Queue Container */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-500" /> Pending Review Tasks
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {activeRevisionsDecorated.length} Remaining
          </span>
        </div>

        {activeRevisionsDecorated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-450 border border-dashed border-slate-200 rounded-xl text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500/30 mb-3" />
            <p className="text-sm font-bold text-slate-850 mb-1">Excellent! All caught up for today.</p>
            <p className="text-xs max-w-sm leading-relaxed px-4 text-slate-500 font-medium">
              Your 1-3-7 revision slots are clear. Any newly logged study session will automatically append tomorrow's queues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRevisionsDecorated.map(rev => {
              const isRescheduling = rescheduleTargetId === rev.id;

              return (
                <div
                  key={rev.id}
                  className={`p-4 border rounded-xl shadow-sm transition duration-200 ${
                    rev.isOverdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 bg-white'
                  }`}
                  id={`revision-${rev.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full mt-1.5 shadow-inner border border-white"
                        style={{ backgroundColor: rev.subjectColor }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-base leading-tight">
                            {rev.topicName}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {rev.subjectName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-sans font-medium">
                          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded">
                            {getStageLabel(rev.revisionStage)}
                          </span>
                          {rev.isOverdue && (
                            <span className="text-rose-600 font-mono font-bold uppercase tracking-wider text-[10px]">
                              Overdue since {rev.scheduledDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Standard Action buttons or Reschedule view */}
                    {!isRescheduling ? (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setRescheduleTargetId(rev.id)}
                          className="p-2 hover:bg-slate-55 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Reschedule"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" /> Delay
                        </button>
                        <button
                          onClick={() => onSkipRevision(rev.id)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                          title="Skip Revision"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onCompleteRevision(rev.id)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-600/10"
                        >
                          <Check className="w-4 h-4" /> Complete
                        </button>
                      </div>
                    ) : (
                      <div className="w-full sm:w-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                          Reschedule to:
                        </p>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleReschedule(rev.id, 1)}
                            className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 rounded cursor-pointer"
                          >
                            +1 Day
                          </button>
                          <button
                            onClick={() => handleReschedule(rev.id, 3)}
                            className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 rounded cursor-pointer"
                          >
                            +3 Days
                          </button>
                          <button
                            onClick={() => handleReschedule(rev.id, 7)}
                            className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 rounded cursor-pointer"
                          >
                            +7 Days
                          </button>
                        </div>
                        <form
                          onSubmit={e => handleCustomRescheduleSubmit(e, rev.id)}
                          className="flex gap-1.5 items-center pt-1"
                        >
                          <input
                            type="date"
                            value={customRescheduleDate}
                            onChange={e => setCustomRescheduleDate(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </form>
                        <button
                          onClick={() => setRescheduleTargetId(null)}
                          className="text-[10px] text-slate-450 hover:text-slate-650 underline block font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Today list */}
      {completedTodayDecorated.length > 0 && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Finished Revisions Today
          </h3>
          <div className="space-y-2.5">
            {completedTodayDecorated.map((rev, idx) => (
              <div
                key={rev.id || idx}
                className="flex items-center justify-between p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 opacity-80"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full border border-white"
                    style={{ backgroundColor: rev.subjectColor }}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-450 line-through">
                      {rev.topicName}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                      {rev.subjectName} &bull; {getStageLabel(rev.revisionStage)}
                    </span>
                  </div>
                </div>
                <div className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1 uppercase">
                  Completed
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
