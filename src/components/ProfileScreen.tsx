/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Achievement, UserSettings, Subject, Topic, StudySession, Revision } from '../types';
import { Award, Download, Upload, RefreshCw, CheckCircle, ShieldAlert, Sliders, Settings, Check } from 'lucide-react';

interface ProfileScreenProps {
  settings: UserSettings;
  achievements: Achievement[];
  onSaveSettings: (settings: UserSettings) => void;
  onImportBackup: (importedData: {
    subjects?: Subject[];
    topics?: Topic[];
    sessions?: StudySession[];
    revisions?: Revision[];
    achievements?: Achievement[];
    settings?: UserSettings;
  }) => void;
  onTriggerMockCloudSync: () => Promise<string>;
  allAppStateForExport: () => any;
}

export default function ProfileScreen({
  settings,
  achievements,
  onSaveSettings,
  onImportBackup,
  onTriggerMockCloudSync,
  allAppStateForExport,
}: ProfileScreenProps) {
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(settings.dailyGoalMinutes);
  const [notificationTime, setNotificationTime] = useState<string>(settings.notificationTime);
  const [themeMode, setThemeMode] = useState<UserSettings['theme']>(settings.theme);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // File Upload states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDailyGoalMinutes(Number(e.target.value));
  };

  const handleSaveSettings = () => {
    onSaveSettings({
      ...settings,
      dailyGoalMinutes,
      notificationTime,
      theme: themeMode,
    });
    alert('Settings updated successfully!');
  };

  const hrMinText = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Sync hander
  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Initiating secure handshake...');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncStatus('Validating offline parity hashes...');
      await new Promise(resolve => setTimeout(resolve, 600));
      setSyncStatus('Compressing sessions database...');
      await new Promise(resolve => setTimeout(resolve, 705));
      const syncResult = await onTriggerMockCloudSync();
      setSyncStatus(`Sync Success: ${syncResult}`);
    } catch (e) {
      setSyncStatus('Sync negotiation failed. Check network link.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  // Backup Export
  const handleExportBackup = () => {
    const data = allAppStateForExport();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'revise137_backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (
          parsed.subjects ||
          parsed.topics ||
          parsed.sessions ||
          parsed.revisions ||
          parsed.settings
        ) {
          onImportBackup(parsed);
          setImportStatus({
            type: 'success',
            message: 'Backup parsed successfully! Revision histories updated.',
          });
        } else {
          setImportStatus({
            type: 'error',
            message: 'Invalid backup schema. Could not locate database entities.',
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Malformed JSON payload file. Upload corrupted.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBackupFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
      {/* Settings Column */}
      <div className="lg:col-span-6 space-y-6">
        {/* Settings Panel Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-sans">
            <Sliders className="w-5 h-5 text-indigo-600" /> Preferences & Targets
          </h3>

          {/* Daily Goal Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 font-sans">
              <label>Daily Study Goal</label>
              <strong className="text-indigo-600 font-bold font-sans text-sm">{hrMinText(dailyGoalMinutes)}</strong>
            </div>
            <input
              type="range"
              min="15"
              max="240"
              step="5"
              value={dailyGoalMinutes}
              onChange={handleGoalChange}
              className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer border border-slate-200"
            />
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Suggested: 45 to 90 min daily</span>
          </div>

          {/* Alert Reminders */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 font-sans">1-3-7 Reminder Trigger Time</label>
            <input
              type="time"
              value={notificationTime}
              onChange={e => setNotificationTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:border-indigo-505 rounded-xl py-2.5 px-3.5 focus:outline-none font-sans text-sm font-semibold"
            />
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-sans">Reminds you of scheduled revisions</span>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/10 transition active:scale-[0.98] cursor-pointer"
          >
            Save Configuration
          </button>
        </div>

        {/* Sync & Cloud Sync Card */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} /> Sync & Backup
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
            Automatically package your local study indexes and synchronize status metrics safely. Last synchronized:{' '}
            <strong className="text-slate-805 font-bold text-xs h-fit inline block md:inline font-sans font-semibold">
              {settings.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleTimeString() : 'Never'}
            </strong>
          </p>

          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 font-bold border border-slate-200 rounded-xl text-sm transition active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Synchronize to Cloud
          </button>

          {syncStatus && (
            <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl text-[10px] font-bold text-indigo-700 leading-relaxed mt-2 uppercase tracking-wider font-sans">
              {syncStatus}
            </div>
          )}
        </div>

        {/* Manual Backup and Imports */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Manual Database Engine</h3>
            <button
              onClick={handleExportBackup}
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-bold font-sans cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download `.json`
            </button>
          </div>

          {/* Import Drag Active Box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`p-5 rounded-xl border border-dashed text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
              dragActive
                ? 'border-indigo-550 bg-indigo-50/70 text-indigo-750'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-500'
            }`}
          >
            <Upload className="w-6 h-6 opacity-60 mb-1" />
            <p className="text-xs font-sans">
              <strong className="text-slate-800 underline">Tap to upload</strong> or drag & drop backup JSON file
            </p>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">revise137_backup.json</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-[10px] font-bold font-sans leading-relaxed uppercase ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                  : 'bg-rose-50 border-rose-250 text-rose-800'
              }`}
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Achievements Column */}
      <div className="lg:col-span-6 space-y-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-850 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Milestones & Badges
            </h3>

            <div className="space-y-4">
              {achievements.map(ach => {
                const isEarned = ach.earnedAt !== null;
                const ratio = ach.progress / ach.maxProgress;
                const percent = Math.round(ratio * 100);

                return (
                  <div
                    key={ach.id}
                    className={`p-3.5 rounded-xl flex items-start gap-3.5 border transition ${
                      isEarned
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50/70 border-slate-200 opacity-90'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isEarned ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-extrabold ${isEarned ? 'text-amber-900' : 'text-slate-800'}`}>
                          {ach.title}
                        </h4>
                        {isEarned ? (
                          <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-right whitespace-nowrap">
                            UNLOCKED
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold font-sans text-slate-400 text-right whitespace-nowrap uppercase tracking-wider">
                            In Progress ({percent}%)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-sans leading-relaxed font-semibold">{ach.description}</p>

                      {/* Progress bar inside */}
                      {!isEarned && (
                        <div className="pt-1.5 space-y-1">
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans mt-4">
            Streaks and milestones are updated in real-time as study logs and revisions are completed. Keep up the habit!
          </footer>
        </div>
      </div>
    </div>
  );
}
