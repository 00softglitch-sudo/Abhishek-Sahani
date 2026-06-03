/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Subject, Topic } from '../types';
import { Play, Pause, Square, SkipForward, Flame, Sparkles, BookOpen, Clock, RefreshCw } from 'lucide-react';

interface StudyTimerProps {
  subjects: Subject[];
  topics: Topic[];
  onSaveSession: (topicId: string, durationSeconds: number, pauseDurationSeconds: number, focusScore: number) => void;
  onAddTopicInline: (subjectId: string, topicName: string) => Topic;
}

type TimerMode = 'standard' | 'pomodoro-25' | 'pomodoro-50';
type TimerStatus = 'idle' | 'running' | 'paused' | 'break';

export default function StudyTimer({
  subjects,
  topics,
  onSaveSession,
  onAddTopicInline,
}: StudyTimerProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('new');
  const [newTopicName, setNewTopicName] = useState<string>('');

  const [timerMode, setTimerMode] = useState<TimerMode>('standard');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');

  // Timer values (in seconds)
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1500); // 25 mins fallback

  // Trackers
  const [pauseCount, setPauseCount] = useState<number>(0);
  const [totalPauseDuration, setTotalPauseDuration] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pauseStartRef = useRef<Date | null>(null);

  // Sound generator (Web Audio API)
  const playPulseSound = (type: 'success' | 'alert') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn('Web Audio check: Context not fully interactive', e);
    }
  };

  const filteredTopics = topics.filter(t => t.subjectId === selectedSubjectId);

  useEffect(() => {
    // Select first topic of subject automatically if present
    if (filteredTopics.length > 0) {
      setSelectedTopicId(filteredTopics[0].id);
    } else {
      setSelectedTopicId('new');
    }
  }, [selectedSubjectId, topics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  const handleStartTimer = () => {
    if (selectedTopicId === 'new' && !newTopicName.trim()) {
      alert('Please enter a valid topic name first.');
      return;
    }

    playPulseSound('success');
    startTimeRef.current = new Date();
    setTimerStatus('running');

    if (timerMode === 'standard') {
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      const budget = timerMode === 'pomodoro-25' ? 1500 : 3000;
      setSecondsRemaining(budget);
      setSecondsElapsed(0);
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
  };

  const handlePauseTimer = () => {
    if (timerStatus !== 'running') return;
    setTimerStatus('paused');
    setPauseCount(prev => prev + 1);
    pauseStartRef.current = new Date();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResumeTimer = () => {
    if (timerStatus !== 'paused') return;
    setTimerStatus('running');

    if (pauseStartRef.current) {
      const diffSecs = Math.round((new Date().getTime() - pauseStartRef.current.getTime()) / 1000);
      setTotalPauseDuration(prev => prev + diffSecs);
      pauseStartRef.current = null;
    }

    if (timerMode === 'standard') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
  };

  // Automated trigger on zero (Pomodoro count complete)
  const handleTimerComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    playPulseSound('success');

    if (timerStatus === 'running') {
      setTimerStatus('break');
      // Set break time budget
      const breakBudget = timerMode === 'pomodoro-25' ? 300 : 600; // 5 min or 10 min break
      setSecondsRemaining(breakBudget);

      // Trigger break interval
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            playPulseSound('alert');
            handleFinishTimer(); // save active study portion
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleFinishTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Resolve active topic
    let finalTopicId = selectedTopicId;
    if (selectedTopicId === 'new') {
      const added = onAddTopicInline(selectedSubjectId, newTopicName.trim());
      finalTopicId = added.id;
      setNewTopicName('');
    }

    // Calculate Focus Score
    // Formula: Active Study Time ÷ Total Session time
    // If standard mode, total is secondsElapsed. Focus is (secondsElapsed / (secondsElapsed + totalPauseDuration))
    const activeTime = secondsElapsed;
    const totalTime = secondsElapsed + totalPauseDuration;

    let focusScore = 100;
    if (totalTime > 0) {
      focusScore = Math.round((activeTime / totalTime) * 100);
    }

    // Safeguard focus constraint
    if (focusScore > 100) focusScore = 100;
    if (focusScore < 5) focusScore = 5; // Floor focus to 5%

    // Save
    onSaveSession(finalTopicId, activeTime, totalPauseDuration, focusScore);

    // Reset components State
    setTimerStatus('idle');
    setSecondsElapsed(0);
    setPauseCount(0);
    setTotalPauseDuration(0);
    startTimeRef.current = null;
    pauseStartRef.current = null;
  };

  const handleCancelTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerStatus('idle');
    setSecondsElapsed(0);
    setPauseCount(0);
    setTotalPauseDuration(0);
    startTimeRef.current = null;
    pauseStartRef.current = null;
  };

  // Live Focus calculation while running/paused
  const getLiveFocusScore = (): number => {
    const total = secondsElapsed + totalPauseDuration;
    if (total === 0) return 100;
    return Math.round((secondsElapsed / total) * 100);
  };

  const liveFocus = getLiveFocusScore();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <header className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900">Focus & Study Timer</h2>
        <p className="text-xs text-slate-505 font-sans font-medium">
          Select standard upwards count or configure tailored Pomodoro loops
        </p>
      </header>

      {/* Target Subject and Topic select panels */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" /> Lesson Target Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 font-sans">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              disabled={timerStatus !== 'idle'}
              className="w-full bg-slate-50 border border-slate-200 text-slate-850 font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50 text-sm cursor-pointer"
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 font-sans">Topic</label>
            <select
              value={selectedTopicId}
              onChange={e => setSelectedTopicId(e.target.value)}
              disabled={timerStatus !== 'idle'}
              className="w-full bg-slate-50 border border-slate-200 text-slate-850 font-semibold rounded-xl py-2.5 px-3 focus:outline-none focus:border-indigo-500 disabled:opacity-50 text-sm cursor-pointer"
            >
              {filteredTopics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="new">+ Create a New Topic...</option>
            </select>
          </div>
        </div>

        {selectedTopicId === 'new' && (
          <div className="space-y-1 pt-1">
            <label className="block text-xs font-bold text-slate-500 font-sans">New Topic Name</label>
            <input
              type="text"
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              disabled={timerStatus !== 'idle'}
              placeholder="e.g. Quantum Mechanics"
              className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* Timer Display Panel */}
      <div className="p-8 bg-white border border-slate-200 rounded-3xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden shadow-sm">
        {/* Mode selector tab when timer is idle */}
        {timerStatus === 'idle' && (
          <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => {
                setTimerMode('standard');
                setTimerStatus('idle');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timerMode === 'standard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => {
                setTimerMode('pomodoro-25');
                setSecondsRemaining(1500);
                setTimerStatus('idle');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timerMode === 'pomodoro-25' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => {
                setTimerMode('pomodoro-50');
                setSecondsRemaining(3000);
                setTimerStatus('idle');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timerMode === 'pomodoro-50' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pomodoro (50m)
            </button>
          </div>
        )}

        {/* Dynamic Tag */}
        {timerStatus !== 'idle' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
            <span className={`w-2 h-2 rounded-full ${timerStatus === 'running' ? 'bg-emerald-500 animate-pulse' : timerStatus === 'paused' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
            <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-sans">
              {timerStatus === 'running' ? 'Focused Study Time' : timerStatus === 'paused' ? 'Paused' : 'Recuperation Break'}
            </span>
          </div>
        )}

        {/* Large Digital Clock Layout */}
        <div id="chrono-display" className="text-7xl font-mono font-extrabold tracking-tight text-slate-800 flex select-none mb-2">
          {timerMode === 'standard' ? formatTime(secondsElapsed) : formatTime(secondsRemaining)}
        </div>

        {/* Live focus progress stats while running */}
        {timerStatus !== 'idle' && timerMode === 'standard' && (
          <div className="grid grid-cols-3 gap-8 w-full border-t border-slate-100 pt-6 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Pauses</span>
              <p className="text-lg font-bold text-slate-800 font-mono">{pauseCount}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Pause Time</span>
              <p className="text-lg font-bold text-slate-800 font-mono">{Math.round(totalPauseDuration / 60)}m</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Focus Rate</span>
              <p className="text-lg font-bold text-indigo-600 font-mono">{liveFocus}%</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {timerStatus === 'idle' && (
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" /> Start Focus
            </button>
          )}

          {timerStatus === 'running' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePauseTimer}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" /> Pause
              </button>
              <button
                onClick={handleFinishTimer}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Finish Session
              </button>
            </div>
          )}

          {timerStatus === 'paused' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleResumeTimer}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Resume
              </button>
              <button
                onClick={handleFinishTimer}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Finish & Save
              </button>
            </div>
          )}

          {timerStatus === 'break' && (
            <button
              onClick={handleFinishTimer}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition cursor-pointer"
            >
              <SkipForward className="w-4 h-4" /> Skip Break & Save
            </button>
          )}

          {timerStatus !== 'idle' && (
            <button
              onClick={handleCancelTimer}
              className="px-4 py-2 hover:bg-slate-100 text-slate-500 hover:text-slate-850 text-xs font-bold rounded-lg font-sans transition uppercase cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
