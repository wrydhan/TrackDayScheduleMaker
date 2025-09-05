export interface Driver {
  id: string;
  name: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface TrackDayConfig {
  startTime: string; // in HH:MM format
  totalTime: number; // in minutes
  sessionDuration: number; // in minutes
  numberOfRunGroups: number;
  groupingMethod: 'skill' | 'random';
  lunchBreakDuration: number; // in minutes, default 60
  techInspectionDuration: number; // in minutes, default 30
  driverMeetingDuration: number; // in minutes, default 15
  breakDuration: number; // in minutes, between sessions
}

export interface Session {
  id: string;
  startTime: string;
  endTime: string;
  group: string;
  type: 'track' | 'break' | 'meeting' | 'tech';
  description: string;
}

export interface Schedule {
  config: TrackDayConfig;
  drivers: Driver[];
  sessions: Session[];
  groups: string[];
}
