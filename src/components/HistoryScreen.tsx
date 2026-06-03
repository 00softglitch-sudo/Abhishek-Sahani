/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subject, Topic, StudySession, Revision } from '../types';
import { Search, Filter, BookOpen, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface HistoryScreenProps {
  sessions: StudySession[];
  revisions: Revision[];
  topics: Topic[];
  subjects: Subject[];
  onDeleteSession?: (sessionId: string) => void;
}

export default function HistoryScreen({
  sessions,
  revisions,
  topics,
  subjects,
  onDeleteSession,
}: HistoryScreenProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Group everything logically under topics studied historically
  const historyDecorated = sessions.map(session => {
    const topic = topics.find(t => t.id === session.topicId);
    const subject = topic ? subjects.find(s => s.id === topic.subjectId) : null;

    // Find the three revision stages for this specific topic
    const topicRevisions = revisions.filter(r => r.topicId === session.topicId);
    const rev1 = topicRevisions.find(r => r.revisionStage === 1);
    const rev3 = topicRevisions.find(r => r.revisionStage === 3);
    const rev7 = topicRevisions.find(r => r.revisionStage === 7);

    return {
      session,
      topic,
      subject,
      rev1,
      rev3,
      rev7,
      topicName: topic?.name || 'Unknown Topic',
      subjectId: subject?.id || 'unknown',
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#cccccc',
      date: session.startTime.substring(0, 10),
    };
  });

  // Filter calculations
  const filteredHistory = historyDecorated.filter(item => {
    const matchesSearch = item.topicName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubjectId === 'all' || item.subjectId === filterSubjectId;
    const matchesDate = !filterDate || item.date === filterDate;
    return matchesSearch && matchesSubject && matchesDate;
  }).sort((a, b) => b.session.startTime.localeCompare(a.session.startTime)); // Descending dates

  // Helper to cleanly format duration (e.g. 5040 seconds -> 1h 24m)
  const formatHourMin = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRevisionBadge = (rev?: Revision) => {
    if (!rev) return <span className="text-slate-400 font-mono text-[10px]">&mdash;</span>;
    if (rev.completed) {
      return (
        <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shadow-sm">
          ✓ Day {rev.revisionStage}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-200">
        &bull; Day {rev.revisionStage}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900">Study Narratives & Records</h2>
        <p className="text-xs text-slate-505 font-sans font-medium">
          Complete structural registry of your logged periods and 1-3-7 status checklists
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-800 font-semibold rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none"
          />
        </div>

        {/* Subject Filter */}
        <div className="relative">
          <select
            value={filterSubjectId}
            onChange={e => setFilterSubjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-800 font-semibold rounded-xl py-2 px-3 text-sm focus:outline-none cursor-pointer"
          >
            <option value="all">All Subjects</option>
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-500 font-bold rounded-xl py-2 px-3 text-sm focus:outline-none font-sans"
          />
        </div>
      </div>

      {filterDate && (
        <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-500 shadow-sm font-medium">
          <span>Filtering for date: <strong className="text-slate-800">{filterDate}</strong></span>
          <button
            onClick={() => setFilterDate('')}
            className="text-indigo-600 font-bold hover:underline uppercase text-[9px]"
          >
            Clear Date
          </button>
        </div>
      )}

      {/* Results List */}
      {filteredHistory.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 border-dashed rounded-2xl">
          <BookOpen className="w-10 h-10 opacity-30 mx-auto mb-3 text-indigo-500" />
          <p className="text-sm font-bold text-slate-800 mb-1">No matching logs found.</p>
          <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500 font-medium">
            Record focus sessions inside the Study Timer or adjust your active filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map(({ session, topicName, subjectColor, subjectName, rev1, rev3, rev7, date }) => {
            return (
              <div
                key={session.id}
                className="p-5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm transition space-y-4"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="w-3 h-3 rounded-full border border-white"
                        style={{ backgroundColor: subjectColor }}
                      />
                      <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                        {topicName}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-sans text-slate-500 flex-wrap font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Study Time: <strong className="text-slate-800 font-sans">{formatHourMin(session.duration)}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Focus Rating: <strong className="text-indigo-600 font-extrabold">{session.focusScore}%</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="font-sans font-bold text-slate-500">{date}</span>
                    </div>
                  </div>

                  {onDeleteSession && (
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 1-3-7 Revision status block */}
                <div className="pt-3.5 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 font-sans">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Revisions Status
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Scheduled Days 1-3-7</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {getRevisionBadge(rev1)}
                    {getRevisionBadge(rev3)}
                    {getRevisionBadge(rev7)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
