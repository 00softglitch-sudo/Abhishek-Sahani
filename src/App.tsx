/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Subject, Topic, StudySession, Revision, Achievement, UserSettings } from './types';
import {
  loadAppState,
  saveSubjects,
  saveTopics,
  saveSessions,
  saveRevisions,
  saveAchievements,
  saveSettings,
  calculateStats,
  evaluateAchievements,
  schedule137Revisions,
  formatDateString,
} from './storage';

// Component imports
import Dashboard from './components/Dashboard';
import StudyTimer from './components/StudyTimer';
import RevisionScreen from './components/RevisionScreen';
import CalendarScreen from './components/CalendarScreen';
import HistoryScreen from './components/HistoryScreen';
import ProfileScreen from './components/ProfileScreen';

// Navigation Lucide icons
import { LayoutDashboard, Clock, CheckCircle2, Calendar, History, User, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  // Master React state initialized from storage load helper
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    dailyGoalMinutes: 45,
    notificationTime: '18:00',
    theme: 'slate-dark',
    cloudSyncEnabled: false,
    lastSyncTime: null,
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Sync date hook anchor
  const todayStr = '2026-06-03';

  // Load state on mount
  useEffect(() => {
    try {
      const state = loadAppState();
      setSubjects(state.subjects);
      setTopics(state.topics);
      setSessions(state.sessions);
      setRevisions(state.revisions);
      setAchievements(state.achievements);
      setSettings(state.settings);
    } catch (e) {
      console.error('Storage parse fault, resetting values', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync up all indices and evaluate streaks/awards on change
  const triggerStateEvaluator = (
    updatedSecs: StudySession[],
    updatedRevs: Revision[],
    updatedTopics: Topic[] = topics
  ) => {
    const freshAch = evaluateAchievements(updatedSecs, updatedRevs);
    setAchievements(freshAch);
  };

  // State handlers
  const handleSaveSession = (
    topicId: string,
    durationSeconds: number,
    pauseDurationSeconds: number,
    focusScore: number
  ) => {
    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      topicId,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + durationSeconds * 1000).toISOString(),
      duration: durationSeconds,
      pauseDuration: pauseDurationSeconds,
      focusScore,
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Automate 1-3-7 Revision scheduler for this save
    // Revision dates are +1, +3, +7 days from today ("2026-06-03")
    const newRevs = schedule137Revisions(topicId, todayStr);
    const updatedRevs = [...revisions, ...newRevs];
    setRevisions(updatedRevs);
    saveRevisions(updatedRevs);

    triggerStateEvaluator(updatedSessions, updatedRevs);

    // Change tab to dashboard to celebrate and show progress
    setActiveTab('dashboard');
  };

  const handleAddTopicInline = (subjectId: string, topicName: string): Topic => {
    const existing = topics.find(t => t.subjectId === subjectId && t.name.toLowerCase() === topicName.toLowerCase());
    if (existing) return existing;

    const newTopic: Topic = {
      id: `top-${Date.now()}`,
      subjectId,
      name: topicName,
      createdAt: new Date().toISOString(),
    };

    const updatedTopics = [...topics, newTopic];
    setTopics(updatedTopics);
    saveTopics(updatedTopics);
    return newTopic;
  };

  const handleAddTopicWithSubject = (subjectId: string, topicName: string) => {
    handleAddTopicInline(subjectId, topicName);
    setActiveTab('timer'); // Navigate to active timer screen with new topic
  };

  const handleCompleteRevision = (id: string) => {
    const updatedRevs = revisions.map(r => {
      if (r.id === id) {
        return {
          ...r,
          completed: true,
          completedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    setRevisions(updatedRevs);
    saveRevisions(updatedRevs);
    triggerStateEvaluator(sessions, updatedRevs);
  };

  const handleSkipRevision = (id: string) => {
    // Simply delete this scheduled iteration
    const updatedRevs = revisions.filter(r => r.id !== id);
    setRevisions(updatedRevs);
    saveRevisions(updatedRevs);
    triggerStateEvaluator(sessions, updatedRevs);
  };

  const handleRescheduleRevision = (id: string, newDateStr: string) => {
    const updatedRevs = revisions.map(r => {
      if (r.id === id) {
        return {
          ...r,
          scheduledDate: newDateStr,
        };
      }
      return r;
    });

    setRevisions(updatedRevs);
    saveRevisions(updatedRevs);
    triggerStateEvaluator(sessions, updatedRevs);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    triggerStateEvaluator(updatedSessions, revisions);
  };

  const handleSaveSettings = (freshSettings: UserSettings) => {
    setSettings(freshSettings);
    saveSettings(freshSettings);
  };

  // JSON manual backup restore hander
  const handleImportBackup = (imported: any) => {
    if (imported.subjects) {
      setSubjects(imported.subjects);
      saveSubjects(imported.subjects);
    }
    if (imported.topics) {
      setTopics(imported.topics);
      saveTopics(imported.topics);
    }
    if (imported.sessions) {
      setSessions(imported.sessions);
      saveSessions(imported.sessions);
    }
    if (imported.revisions) {
      setRevisions(imported.revisions);
      saveRevisions(imported.revisions);
    }
    if (imported.achievements) {
      setAchievements(imported.achievements);
      saveAchievements(imported.achievements);
    }
    if (imported.settings) {
      setSettings(imported.settings);
      saveSettings(imported.settings);
    }
  };

  const allAppStateForExport = () => {
    return {
      subjects,
      topics,
      sessions,
      revisions,
      achievements,
      settings,
    };
  };

  // Mock cloud integration syncing sync block
  const handleTriggerMockCloudSync = async (): Promise<string> => {
    const time = new Date().toISOString();
    const updatedSettings: UserSettings = {
      ...settings,
      cloudSyncEnabled: true,
      lastSyncTime: time,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    return `OK-200. ${sessions.length} sessions synchronized in 45ms.`;
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2.5" />
        <p className="text-sm font-semibold tracking-wide text-slate-700">Assembling Revision Indices...</p>
      </div>
    );
  }

  // Calculate stats live
  const stats = calculateStats(sessions, revisions, settings, todayStr);

  // Active revisions badge count
  const pendingCount = revisions.filter(r => r.scheduledDate <= todayStr && !r.completed).length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden md:h-screen md:overflow-hidden relative antialiased">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="w-64 bg-white flex flex-col hidden md:flex h-screen sticky top-0 flex-shrink-0 border-r border-slate-200">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-base tracking-tight shadow-md">
            137
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">Revise137</h1>
            <span className="text-[8px] font-bold tracking-widest text-indigo-600 uppercase leading-none block mt-1">1-3-7 COMPANION</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'timer' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Study Timer</span>
          </button>
          <button
            onClick={() => setActiveTab('revisions')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'revisions' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Revisions</span>
            </div>
            {pendingCount > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${
                activeTab === 'revisions' ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'calendar' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'history' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <History className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">History</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer - Goal Indicator */}
        <div className="p-6 border-t border-slate-100">
          <div className="bg-indigo-550/10 p-4 rounded-xl">
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mb-2">Daily Goal</p>
            <div className="flex justify-between text-xs text-slate-700 mb-1 font-bold">
              <span>{Math.round(stats.todayMinutes)}m / {settings.dailyGoalMinutes}m</span>
              <span>{Math.round(Math.min(100, (stats.todayMinutes / settings.dailyGoalMinutes) * 100))}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (stats.todayMinutes / settings.dailyGoalMinutes) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
        {/* Header content matching design instructions */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Header elements */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight">Revise137</h1>
            </div>
            <span className="text-slate-300 hidden md:inline">|</span>
            <div className="text-xs md:text-sm font-semibold text-indigo-950/70">
              {activeTab === 'dashboard' && 'STUDY WORKSPACE DASHBOARD'}
              {activeTab === 'timer' && 'ACTIVE CONCENTRATION TIMER'}
              {activeTab === 'revisions' && `ACTIVE REVISION SCHEDULE • ${pendingCount} TASKS`}
              {activeTab === 'calendar' && 'SPACED REPETITION STUDY CALENDAR'}
              {activeTab === 'history' && 'STUDY SESSIONS HISTORIC LOG'}
              {activeTab === 'profile' && 'USER SETTINGS & PREFERENCES'}
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs md:text-sm font-bold text-slate-700">{stats.currentStreak} Day Streak</span>
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 hover:border-indigo-400 shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-extrabold text-xs transition cursor-pointer"
            >
              U
            </button>
          </div>
        </header>

        {/* Content Panel Box */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              subjects={subjects}
              topics={topics}
              sessions={sessions}
              revisions={revisions}
              onNavigate={setActiveTab}
              onAddTopicWithSubject={handleAddTopicWithSubject}
            />
          )}

          {activeTab === 'timer' && (
            <StudyTimer
              subjects={subjects}
              topics={topics}
              onSaveSession={handleSaveSession}
              onAddTopicInline={handleAddTopicInline}
            />
          )}

          {activeTab === 'revisions' && (
            <RevisionScreen
              revisions={revisions}
              topics={topics}
              subjects={subjects}
              onCompleteRevision={handleCompleteRevision}
              onSkipRevision={handleSkipRevision}
              onRescheduleRevision={handleRescheduleRevision}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarScreen
              sessions={sessions}
              revisions={revisions}
              topics={topics}
              subjects={subjects}
            />
          )}

          {activeTab === 'history' && (
            <HistoryScreen
              sessions={sessions}
              revisions={revisions}
              topics={topics}
              subjects={subjects}
              onDeleteSession={handleDeleteSession}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              settings={settings}
              achievements={achievements}
              onSaveSettings={handleSaveSettings}
              onImportBackup={handleImportBackup}
              onTriggerMockCloudSync={handleTriggerMockCloudSync}
              allAppStateForExport={allAppStateForExport}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Nav deck for phone viewports */}
      <div id="deck-nav" className="fixed bottom-3 left-3 right-3 z-30 bg-white/95 border border-slate-200 shadow-xl px-2 py-1.5 flex justify-around items-center rounded-2xl backdrop-blur-md md:hidden">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('timer')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'timer' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab('revisions')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'revisions' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">Revisions</span>
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-500 text-[8px] font-bold text-white flex items-center justify-center rounded-full shadow-md">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">History</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-indigo-600 font-extrabold scale-[1.04]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-bold font-sans">Profile</span>
        </button>
      </div>
    </div>
  );
}
