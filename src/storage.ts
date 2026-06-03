/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject, Topic, StudySession, Revision, Achievement, UserSettings, StudyStats } from './types';

// Default initial subjects
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Physics', color: '#ef4444' }, // Red
  { id: 'sub-2', name: 'Chemistry', color: '#f59e0b' }, // Amber
  { id: 'sub-3', name: 'Mathematics', color: '#3b82f6' }, // Blue
  { id: 'sub-4', name: 'Biology', color: '#10b981' }, // Emerald
];

// Helper to format date as YYYY-MM-DD
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate schedule dates based on base date
function addDays(dateStr: string | Date, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

// Initial seed data generator
function generateSeedData() {
  const today = new Date('2026-06-03'); // Anchor relative to given current time

  // Topics
  const topic1: Topic = {
    id: 'top-1',
    subjectId: 'sub-1', // Physics
    name: "Newton's Laws",
    createdAt: new Date(addDays(today, -1)).toISOString(),
  };

  const topic2: Topic = {
    id: 'top-2',
    subjectId: 'sub-3', // Math
    name: 'Integration',
    createdAt: new Date(addDays(today, -3)).toISOString(),
  };

  const topic3: Topic = {
    id: 'top-4',
    subjectId: 'sub-4', // Biology
    name: 'Genetics',
    createdAt: new Date(addDays(today, -7)).toISOString(),
  };

  const topic4: Topic = {
    id: 'top-5',
    subjectId: 'sub-2', // Chemistry
    name: 'Acids & Bases',
    createdAt: new Date(addDays(today, -2)).toISOString(),
  };

  const topics = [topic1, topic2, topic3, topic4];

  // Study Sessions
  // June 2nd (Yesterday) - Newton's Laws
  const session1: StudySession = {
    id: 'sess-1',
    topicId: 'top-1',
    startTime: new Date(addDays(today, -1) + 'T10:00:00').toISOString(),
    endTime: new Date(addDays(today, -1) + 'T11:00:00').toISOString(),
    duration: 3600, // 60 minutes
    pauseDuration: 180, // 3 minutes pause
    focusScore: 95, // 3420s active / 3600s total = 95% Focus
  };

  // May 31st (3 days ago) - Integration
  const session2: StudySession = {
    id: 'sess-2',
    topicId: 'top-2',
    startTime: new Date(addDays(today, -3) + 'T14:00:00').toISOString(),
    endTime: new Date(addDays(today, -3) + 'T15:24:00').toISOString(),
    duration: 5040, // 1h 24m
    pauseDuration: 300, // 5 mins pauses
    focusScore: 94,
  };

  // May 27th (7 days ago) - Genetics
  const session3: StudySession = {
    id: 'sess-3',
    topicId: 'top-4',
    startTime: new Date(addDays(today, -7) + 'T09:00:00').toISOString(),
    endTime: new Date(addDays(today, -7) + 'T09:50:00').toISOString(),
    duration: 3000, // 50 mins
    pauseDuration: 100,
    focusScore: 96,
  };

  // June 1st (2 days ago) - Acids
  const session4: StudySession = {
    id: 'sess-4',
    topicId: 'top-5',
    startTime: new Date(addDays(today, -2) + 'T16:00:00').toISOString(),
    endTime: new Date(addDays(today, -2) + 'T16:45:00').toISOString(),
    duration: 2700, // 45 mins
    pauseDuration: 120,
    focusScore: 95,
  };

  const sessions = [session1, session2, session3, session4];

  // Revisions Engine Automator for Seeding
  // Physics Newton's Laws (studied Jun 2nd): Day 1 (Jun 3rd), Day 3 (Jun 5th), Day 7 (Jun 9th)
  // Math Integration (studied May 31st): Day 1 (Jun 1st - Completed), Day 3 (Jun 3rd), Day 7 (Jun 7th)
  // Bio Genetics (studied May 27th): Day 1 (May 28th - Completed), Day 3 (May 30th - Completed), Day 7 (Jun 3rd)
  // Chem Acids (studied Jun 1st): Day 1 (Jun 2nd - Missed/Pending), Day 3 (Jun 4th), Day 7 (Jun 8th)
  const revisions: Revision[] = [
    // Newton's Laws Revisions
    { id: 'rev-1a', topicId: 'top-1', revisionStage: 1, scheduledDate: addDays(today, 0), completed: false }, // Today!
    { id: 'rev-1b', topicId: 'top-1', revisionStage: 3, scheduledDate: addDays(today, 2), completed: false },
    { id: 'rev-1c', topicId: 'top-1', revisionStage: 7, scheduledDate: addDays(today, 6), completed: false },

    // Integration Revisions
    {
      id: 'rev-2a',
      topicId: 'top-2',
      revisionStage: 1,
      scheduledDate: addDays(today, -2), // Jun 1st
      completed: true,
      completedAt: new Date(addDays(today, -2) + 'T11:20:00').toISOString(),
    },
    { id: 'rev-2b', topicId: 'top-2', revisionStage: 3, scheduledDate: addDays(today, 0), completed: false }, // Today!
    { id: 'rev-2c', topicId: 'top-2', revisionStage: 7, scheduledDate: addDays(today, 4), completed: false },

    // Genetics Revisions
    {
      id: 'rev-3a',
      topicId: 'top-4',
      revisionStage: 1,
      scheduledDate: addDays(today, -6), // May 28th
      completed: true,
      completedAt: new Date(addDays(today, -6) + 'T09:40:00').toISOString(),
    },
    {
      id: 'rev-3b',
      topicId: 'top-4',
      revisionStage: 3,
      scheduledDate: addDays(today, -4), // May 30th
      completed: true,
      completedAt: new Date(addDays(today, -4) + 'T10:15:00').toISOString(),
    },
    { id: 'rev-3c', topicId: 'top-4', revisionStage: 7, scheduledDate: addDays(today, 0), completed: false }, // Today!

    // Acids Revisions
    { id: 'rev-4a', topicId: 'top-5', revisionStage: 1, scheduledDate: addDays(today, -1), completed: false }, // Missed yesterday
    { id: 'rev-4b', topicId: 'top-5', revisionStage: 3, scheduledDate: addDays(today, 1), completed: false },
    { id: 'rev-4c', topicId: 'top-5', revisionStage: 7, scheduledDate: addDays(today, 5), completed: false },
  ];

  // Predefined Achievements list
  const achievements: Achievement[] = [
    {
      id: 'ach-1',
      title: 'First Study Session',
      description: 'Record your very first study timer session.',
      icon: 'BookOpen',
      earnedAt: new Date(addDays(today, -7)).toISOString(),
      progress: 1,
      maxProgress: 1,
    },
    {
      id: 'ach-2',
      title: '7-Day Streak',
      description: 'Keep your study streak going for 7 consecutive days.',
      icon: 'Flame',
      earnedAt: null,
      progress: 4, // seeded count
      maxProgress: 7,
    },
    {
      id: 'ach-3',
      title: '30-Day Streak',
      description: 'Maintain an epic 30-day revision habit.',
      icon: 'Award',
      earnedAt: null,
      progress: 4,
      maxProgress: 30,
    },
    {
      id: 'ach-4',
      title: '100 Hours Studied',
      description: 'Log 100 total hours of deep active focus.',
      icon: 'Hourglass',
      earnedAt: null,
      progress: 3, // ~3.05 hours seeded
      maxProgress: 100,
    },
    {
      id: 'ach-5',
      title: '100 Revisions Completed',
      description: 'Successfully complete 100 scheduled 1-3-7 revisions.',
      icon: 'CheckCircle2',
      earnedAt: null,
      progress: 3, // 3 completed revisions in seed
      maxProgress: 100,
    },
  ];

  return { topics, sessions, revisions, achievements };
}

// Default user settings
const DEFAULT_SETTINGS: UserSettings = {
  dailyGoalMinutes: 45,
  notificationTime: '18:00',
  theme: 'slate-dark',
  cloudSyncEnabled: false,
  lastSyncTime: null,
};

// Storage Keys
const KEYS = {
  SUBJECTS: 'rev137_subjects',
  TOPICS: 'rev137_topics',
  SESSIONS: 'rev137_sessions',
  REVISIONS: 'rev137_revisions',
  ACHIEVEMENTS: 'rev137_achievements',
  SETTINGS: 'rev137_settings',
};

// Main state load & save API
export function loadAppState() {
  // Ensure basic subjects exist
  let subjects = localStorage.getItem(KEYS.SUBJECTS);
  if (!subjects) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    subjects = JSON.stringify(DEFAULT_SUBJECTS);
  }

  let settings = localStorage.getItem(KEYS.SETTINGS);
  if (!settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    settings = JSON.stringify(DEFAULT_SETTINGS);
  }

  // Populate remainder seed when empty
  let topics = localStorage.getItem(KEYS.TOPICS);
  let sessions = localStorage.getItem(KEYS.SESSIONS);
  let revisions = localStorage.getItem(KEYS.REVISIONS);
  let achievements = localStorage.getItem(KEYS.ACHIEVEMENTS);

  if (!topics || !sessions || !revisions || !achievements) {
    const seed = generateSeedData();
    if (!topics) {
      localStorage.setItem(KEYS.TOPICS, JSON.stringify(seed.topics));
      topics = JSON.stringify(seed.topics);
    }
    if (!sessions) {
      localStorage.setItem(KEYS.SESSIONS, JSON.stringify(seed.sessions));
      sessions = JSON.stringify(seed.sessions);
    }
    if (!revisions) {
      localStorage.setItem(KEYS.REVISIONS, JSON.stringify(seed.revisions));
      revisions = JSON.stringify(seed.revisions);
    }
    if (!achievements) {
      localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(seed.achievements));
      achievements = JSON.stringify(seed.achievements);
    }
  }

  return {
    subjects: JSON.parse(subjects) as Subject[],
    topics: JSON.parse(topics) as Topic[],
    sessions: JSON.parse(sessions) as StudySession[],
    revisions: JSON.parse(revisions) as Revision[],
    achievements: JSON.parse(achievements) as Achievement[],
    settings: JSON.parse(settings) as UserSettings,
  };
}

export function saveSubjects(data: Subject[]) {
  localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(data));
}

export function saveTopics(data: Topic[]) {
  localStorage.setItem(KEYS.TOPICS, JSON.stringify(data));
}

export function saveSessions(data: StudySession[]) {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(data));
}

export function saveRevisions(data: Revision[]) {
  localStorage.setItem(KEYS.REVISIONS, JSON.stringify(data));
}

export function saveAchievements(data: Achievement[]) {
  localStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(data));
}

export function saveSettings(data: UserSettings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
}

// Complete calculations of stats based on stored objects
export function calculateStats(
  sessions: StudySession[],
  revisions: Revision[],
  settings: UserSettings,
  currentDateStr: string = '2026-06-03'
): StudyStats {
  const currentGoalMinutes = settings.dailyGoalMinutes;

  // 1. Today's minutes
  const todaySessions = sessions.filter(s => {
    return s.startTime.startsWith(currentDateStr);
  });
  const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const todayMinutes = Math.round(todaySeconds / 60);

  // 2. Streaks calculation
  // Group all unique session dates (YYYY-MM-DD)
  const sessionDates = new Set<string>();
  sessions.forEach(s => {
    sessionDates.add(s.startTime.substring(0, 10));
  });

  // Sort dates descending
  const sortedDates = Array.from(sessionDates).sort((a, b) => b.localeCompare(a));

  let currentStreak = 0;
  let longestStreak = 0;

  // Calculate current streak
  let checkDate = new Date(currentDateStr);
  const todayStr = formatDateString(checkDate);
  checkDate.setDate(checkDate.getDate() - 1);
  const yesterdayStr = formatDateString(checkDate);

  if (sessionDates.has(todayStr)) {
    // Streak includes today
    currentStreak = 1;
    let indexDate = new Date(todayStr);
    while (true) {
      indexDate.setDate(indexDate.getDate() - 1);
      const prevStr = formatDateString(indexDate);
      if (sessionDates.has(prevStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (sessionDates.has(yesterdayStr)) {
    // Streak includes yesterday but not today (yet)
    currentStreak = 1;
    let indexDate = new Date(yesterdayStr);
    while (true) {
      indexDate.setDate(indexDate.getDate() - 1);
      const prevStr = formatDateString(indexDate);
      if (sessionDates.has(prevStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // Calculate longest streak historically
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    let prev = new Date(sortedDates[sortedDates.length - 1]);

    longestStreak = 1;

    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currDate = new Date(sortedDates[i]);
      const diffTime = Math.abs(currDate.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
      prev = currDate;
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Fallback check
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 3. Weekly hours
  // Go back 7 days
  const anchorDate = new Date(currentDateStr);
  const sevenDaysAgo = new Date(anchorDate);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // past 7 days including today
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklySessions = sessions.filter(s => {
    const sDate = new Date(s.startTime);
    return sDate >= sevenDaysAgo;
  });
  const weeklySeconds = weeklySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const weeklyHours = parseFloat((weeklySeconds / 3600).toFixed(1));

  // 4. Revision completion rate
  // Completed divided by total due up to today
  const eligibleRevisions = revisions.filter(r => {
    // all revisions scheduled today or before
    return r.scheduledDate <= currentDateStr;
  });
  const completedEligible = eligibleRevisions.filter(r => r.completed);
  const completionRate = eligibleRevisions.length > 0
    ? Math.round((completedEligible.length / eligibleRevisions.length) * 100)
    : 100;

  // 5. Focus Score (weighted by duration)
  const allSessionsSeconds = sessions.reduce((acc, curr) => acc + curr.duration, 0);
  let focusScore = 90; // Default baseline in case no sessions
  if (allSessionsSeconds > 0) {
    const focusSecondsSum = sessions.reduce((acc, curr) => {
      // Focus amount: duration * (focusScore/100)
      return acc + curr.duration * (curr.focusScore / 100);
    }, 0);
    focusScore = Math.round((focusSecondsSum / allSessionsSeconds) * 100);
  }

  return {
    todayMinutes,
    currentStreak,
    longestStreak,
    weeklyHours,
    completionRate,
    focusScore,
  };
}

// Achievement update algorithm
export function evaluateAchievements(sessions: StudySession[], revisions: Revision[]): Achievement[] {
  const currentAchievements = JSON.parse(localStorage.getItem(KEYS.ACHIEVEMENTS) || '[]') as Achievement[];
  if (currentAchievements.length === 0) return [];

  const totalSessionsCount = sessions.length;
  const totalRevisionsCompleted = revisions.filter(r => r.completed).length;
  const totalSecondsStudied = sessions.reduce((acc, curr) => acc + curr.duration, 0);
  const totalHoursStudied = Math.round(totalSecondsStudied / 3600);

  const stats = calculateStats(sessions, revisions, DEFAULT_SETTINGS, '2026-06-03');

  const updated = currentAchievements.map(ach => {
    if (ach.earnedAt) return ach; // Already earned

    let progress = 0;
    let earned = false;

    switch (ach.id) {
      case 'ach-1': // First Study Session
        progress = totalSessionsCount >= 1 ? 1 : 0;
        earned = totalSessionsCount >= 1;
        break;
      case 'ach-2': // 7-Day Streak
        progress = Math.min(stats.currentStreak, 7);
        earned = stats.currentStreak >= 7;
        break;
      case 'ach-3': // 30-Day Streak
        progress = Math.min(stats.currentStreak, 30);
        earned = stats.currentStreak >= 30;
        break;
      case 'ach-4': // 100 Hours Studied
        progress = Math.min(totalHoursStudied, 100);
        earned = totalHoursStudied >= 100;
        break;
      case 'ach-5': // 100 Revisions Completed
        progress = Math.min(totalRevisionsCompleted, 100);
        earned = totalRevisionsCompleted >= 100;
        break;
    }

    return {
      ...ach,
      progress,
      earnedAt: earned ? new Date().toISOString() : null,
    };
  });

  saveAchievements(updated);
  return updated;
}

// 1-3-7 Revision Engine Automator
export function schedule137Revisions(topicId: string, baseDateStr: string): Revision[] {
  const revisions: Revision[] = [
    {
      id: `rev-${topicId}-1-${Date.now()}`,
      topicId,
      revisionStage: 1,
      scheduledDate: addDays(baseDateStr, 1),
      completed: false,
    },
    {
      id: `rev-${topicId}-3-${Date.now()}`,
      topicId,
      revisionStage: 3,
      scheduledDate: addDays(baseDateStr, 3),
      completed: false,
    },
    {
      id: `rev-${topicId}-7-${Date.now()}`,
      topicId,
      revisionStage: 7,
      scheduledDate: addDays(baseDateStr, 7),
      completed: false,
    },
  ];

  return revisions;
}
