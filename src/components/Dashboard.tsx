/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Subject, Topic, StudySession, Revision, StudyStats } from '../types';
import { Flame, Clock, CheckCircle2, TrendingUp, Plus, Brain, Calendar, ChevronRight, Bell } from 'lucide-react';

interface DashboardProps {
  stats: StudyStats;
  subjects: Subject[];
  topics: Topic[];
  sessions: StudySession[];
  revisions: Revision[];
  onNavigate: (tab: string) => void;
  onAddTopicWithSubject: (subjectId: string, name: string) => void;
}

export default function Dashboard({
  stats,
  subjects,
  topics,
  sessions,
  revisions,
  onNavigate,
  onAddTopicWithSubject,
}: DashboardProps) {
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  const [quickSubjectId, setQuickSubjectId] = React.useState(subjects[0]?.id || '');
  const [quickTopicName, setQuickTopicName] = React.useState('');

  const todayStr = '2026-06-03';

  // Find topics studied today
  const todaySessions = sessions.filter(s => s.startTime.startsWith(todayStr));
  const studiedTodayRaw = todaySessions.map(s => {
    const topic = topics.find(t => t.id === s.topicId);
    const subject = topic ? subjects.find(sub => sub.id === topic.subjectId) : null;
    return {
      session: s,
      topicName: topic?.name || 'Unknown Topic',
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#cccccc',
    };
  });

  // Unique today's topics list
  const studiedTodayList = Array.from(new Set(studiedTodayRaw.map(r => r.topicName))).map(name => {
    return studiedTodayRaw.find(r => r.topicName === name)!;
  });

  // Calculate pending revisions today
  const pendingCount = revisions.filter(r => r.scheduledDate <= todayStr && !r.completed).length;

  // Upcoming revisions (after today)
  const upcomingRevisions = revisions
    .filter(r => r.scheduledDate > todayStr && !r.completed)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 3)
    .map(r => {
      const topic = topics.find(t => t.id === r.topicId);
      const subject = topic ? subjects.find(sub => sub.id === topic.subjectId) : null;
      return {
        ...r,
        topicName: topic?.name || 'Unknown Topic',
        subjectName: subject?.name || 'General',
        subjectColor: subject?.color || '#cccccc',
      };
    });

  // Focus rating helper
  const getFocusRating = (score: number) => {
    if (score >= 95) return { text: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10' };
    if (score >= 85) return { text: 'Great', color: 'text-blue-400 bg-blue-500/10' };
    if (score >= 70) return { text: 'Good', color: 'text-amber-400 bg-amber-500/10' };
    return { text: 'Needs Improvement', color: 'text-red-400 bg-red-500/10' };
  };

  const focusRating = getFocusRating(stats.focusScore);

  const handleSubmitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopicName.trim()) return;
    onAddTopicWithSubject(quickSubjectId, quickTopicName.trim());
    setQuickTopicName('');
    setShowQuickAdd(false);
  };

  // Generate automated smart notifications
  const notifications = [
    ...(pendingCount > 0
      ? [
          {
            id: 'notif-pending',
            text: `You have ${pendingCount} active revision${pendingCount > 1 ? 's' : ''} scheduled for today. Keep the 1-3-7 schema going!`,
            type: 'alert',
          },
        ]
      : []),
    {
      id: 'notif-goal',
      text: stats.todayMinutes >= 45 
        ? "Daily study goal of 45 minutes completed! Amazing dedication." 
        : `Stay focused! You studied ${stats.todayMinutes}m today, ${Math.max(0, 45 - stats.todayMinutes)} minutes remaining for your daily goal.`,
      type: 'goal',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dynamic Notifications Banner */}
      {notifications.length > 0 && (
        <div id="notifications-banner" className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-sm shadow-sm transition-all duration-300 ${
                notif.type === 'alert'
                  ? 'border-amber-250 bg-amber-50 text-amber-850'
                  : 'border-blue-250 bg-blue-50 text-blue-850'
              }`}
            >
              <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${notif.type === 'alert' ? 'text-amber-600' : 'text-blue-600'}`} />
              <div className="text-sm font-sans flex-1 font-medium">
                {notif.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">Revise137 Workspace</h1>
          <p className="text-xs text-slate-500 font-sans font-medium">
            Optimized spacing and visual tracking for your daily 1-3-7 iterations. Today is Wednesday, June 3, 2026.
          </p>
        </div>
        <button
          id="btn-quick-session"
          onClick={() => onNavigate('timer')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Clock className="w-4 h-4" /> Start Study Session
        </button>
      </header>

      {/* Grid of 4 Key Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Today's Study */}
        <div id="card-todays-study" className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Today's Study</span>
            <div className="text-3xl font-extrabold tracking-tight text-slate-800">{stats.todayMinutes}m</div>
            <span className="text-xs text-slate-500 font-medium">Goal: 45 min/day</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Current Streak */}
        <div id="card-streak" className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Current Streak</span>
            <div className="text-3xl font-extrabold tracking-tight text-amber-600">{stats.currentStreak} Days</div>
            <span className="text-xs text-slate-500 font-medium font-sans">Best is {stats.longestStreak} days</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Revisions */}
        <div id="card-revisions" className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pending Revisions</span>
            <div className={`text-3xl font-extrabold tracking-tight ${pendingCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {pendingCount} Tasks
            </div>
            <span className="text-xs text-slate-500 font-medium">1-3-7 Spaced Iterations</span>
          </div>
          <div className={`p-3 rounded-xl border ${pendingCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Focus Score */}
        <div id="card-focus" className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Focus Score</span>
            <div className="text-3xl font-extrabold tracking-tight text-indigo-600">{stats.focusScore}%</div>
            <span className="text-[10px] font-bold text-indigo-600/75 uppercase block mt-1">
              {focusRating.text} focus
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 animate-pulse">
            <Brain className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Focus Summary / Today's Topics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Topics Studied */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Brain className="w-5 h-5 text-indigo-500" /> Topics Studied Today
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 py-1 px-3 rounded-full border border-slate-200">
                {studiedTodayList.length} LOGGED
              </span>
            </div>

            {studiedTodayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-450 border border-dashed border-slate-200 rounded-xl">
                <Clock className="w-8 h-8 opacity-40 mb-2 text-slate-400" />
                <p className="text-sm font-bold text-slate-750 mb-1">No sessions recorded today yet.</p>
                <button
                  onClick={() => onNavigate('timer')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Launch active study timer &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {studiedTodayList.map(({ session, topicName, subjectName, subjectColor }, index) => {
                  const minutes = Math.round(session.duration / 60);
                  return (
                    <div
                      key={session.id || index}
                      className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl hover:bg-slate-100/50 transition border border-slate-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-inner border border-white"
                          style={{ backgroundColor: subjectColor }}
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{topicName}</p>
                          <span className="text-xs text-slate-400 font-bold block mt-0.5">{subjectName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-slate-800">{minutes}m</p>
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Focus: {session.focusScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate('timer')}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-md transition active:scale-[0.99] flex flex-col justify-between h-28 cursor-pointer"
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Start Session</h4>
                <p className="text-xs text-slate-500 font-medium">Standard & Pomodoro</p>
              </div>
            </button>

            <button
              onClick={() => setShowQuickAdd(true)}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-md transition active:scale-[0.99] flex flex-col justify-between h-28 cursor-pointer"
            >
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Add Topic</h4>
                <p className="text-xs text-slate-500 font-medium">Create study plans</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('calendar')}
              className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-md transition active:scale-[0.99] flex flex-col justify-between h-28 cursor-pointer"
            >
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">View Calendar</h4>
                <p className="text-xs text-slate-500 font-medium">Monthly timeline</p>
              </div>
            </button>
          </div>

          {showQuickAdd && (
            <form
              onSubmit={handleSubmitQuickAdd}
              className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-md"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-extrabold text-slate-800">Quick Add Topic</h4>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Subject
                  </label>
                  <select
                    value={quickSubjectId}
                    onChange={e => setQuickSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 text-sm font-semibold cursor-pointer"
                  >
                    {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Topic Name
                  </label>
                  <input
                    type="text"
                    value={quickTopicName}
                    onChange={e => setQuickTopicName(e.target.value)}
                    placeholder="e.g. Quantum Mechanics"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition active:scale-[0.99] cursor-pointer"
              >
                Add Topic & Start Track
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Weekly Progress & Upcoming */}
        <div className="space-y-6">
          {/* Weekly Progress Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Weekly Progress
            </h3>

            {/* Simulated 7-day progress bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Study Target</span>
                <span className="font-mono text-slate-800 font-bold text-xs">{stats.weeklyHours}/5.0 hours</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.weeklyHours / 5.0) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Your 1-3-7 revision schedule requires high consistency. Complete pending items today to bolster your retention.
              </p>
            </div>
          </div>

          {/* Upcoming Revisions (Next few days) */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" /> Upcoming Revisions
              </h3>
              <button
                onClick={() => onNavigate('revisions')}
                className="text-xs text-indigo-600 font-extrabold flex items-center gap-1 hover:underline"
              >
                View all <ChevronRight className="w-3" />
              </button>
            </div>

            {upcomingRevisions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 font-bold">No upcoming revisions scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {upcomingRevisions.map((rev, idx) => {
                  return (
                    <div
                      key={rev.id || idx}
                      className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 hover:bg-slate-100/50 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white"
                          style={{ backgroundColor: rev.subjectColor }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-none">{rev.topicName}</p>
                          <span className="text-[9px] text-slate-400 font-bold block mt-1">{rev.subjectName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase">
                          Day {rev.revisionStage}
                        </span>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1.5 font-mono">
                          {rev.scheduledDate.substring(5)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
