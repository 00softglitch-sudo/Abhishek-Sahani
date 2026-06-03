/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex color or Tailwind class
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  createdAt: string; // ISO string
}

export interface StudySession {
  id: string;
  topicId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // total duration in seconds
  pauseDuration: number; // pause duration in seconds
  focusScore: number; // 0 to 100
}

export interface Revision {
  id: string;
  topicId: string;
  revisionStage: 1 | 3 | 7;
  scheduledDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO string
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  earnedAt: string | null; // ISO string or null
  progress: number;
  maxProgress: number;
}

export interface UserSettings {
  dailyGoalMinutes: number;
  notificationTime: string; // HH:MM
  theme: 'light' | 'slate-dark';
  cloudSyncEnabled: boolean;
  lastSyncTime: string | null;
}

export interface StudyStats {
  todayMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyHours: number;
  completionRate: number;
  focusScore: number;
}
