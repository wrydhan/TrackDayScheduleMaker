import { Driver, TrackDayConfig, Session, Schedule } from '@/types';

export function generateSchedule(drivers: Driver[], config: TrackDayConfig): Schedule {
  const groups = createGroups(drivers, config);
  const sessions = createSessions(config, groups);
  
  return {
    config,
    drivers,
    sessions,
    groups
  };
}

function createGroups(drivers: Driver[], config: TrackDayConfig): string[] {
  if (config.groupingMethod === 'skill') {
    // Stable, skill-named groups for any skills present
    const skillsInOrder: Array<Driver['skillLevel']> = ['beginner', 'intermediate', 'advanced'];
    const presentSkills = skillsInOrder.filter((skill) => drivers.some((d) => d.skillLevel === skill));
    return presentSkills.map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1));
  }
  // Random/numbered groups
  const groupNames: string[] = [];
  for (let i = 1; i <= config.numberOfRunGroups; i++) {
    groupNames.push(`Group ${i}`);
  }
  return groupNames;
}

function createSessions(config: TrackDayConfig, groups: string[]): Session[] {
  const sessions: Session[] = [];
  
  // Parse start time
  const [startHour, startMinute] = config.startTime.split(':').map(Number);
  const startTimeInMinutes = startHour * 60 + startMinute;
  
  let currentTime = 0; // Relative time from start
  
  // Convert relative time to actual time
  const formatTime = (relativeMinutes: number): string => {
    const totalMinutes = startTimeInMinutes + relativeMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  // Morning driver meeting
  sessions.push({
    id: 'meeting-1',
    startTime: formatTime(currentTime),
    endTime: formatTime(currentTime + config.driverMeetingDuration),
    group: 'All',
    type: 'meeting',
    description: 'Morning Driver Meeting'
  });
  currentTime += config.driverMeetingDuration;
  
  // Tech inspection
  sessions.push({
    id: 'tech-1',
    startTime: formatTime(currentTime),
    endTime: formatTime(currentTime + config.techInspectionDuration),
    group: 'All',
    type: 'tech',
    description: 'Tech Inspection'
  });
  currentTime += config.techInspectionDuration;
  
  // Calculate lunch break time - ensure it starts before 2:00 PM (14:00)
  const latestLunchStart = 14 * 60; // 2:00 PM in minutes from midnight
  const maxLunchStartFromStart = latestLunchStart - startTimeInMinutes;
  
  // Use the earlier of: 4 hours from start, or the time that would put lunch before 2 PM
  const desiredLunchStart = Math.min(240, maxLunchStartFromStart); // 240 minutes = 4 hours
  
  // Calculate how many morning sessions we can fit before lunch
  const availableMorningTime = desiredLunchStart - currentTime;
  const morningSessionsPerGroup = Math.floor(availableMorningTime / (config.sessionDuration * groups.length));
  
  // Calculate actual lunch start time based on morning sessions
  const actualLunchStart = currentTime + (morningSessionsPerGroup * config.sessionDuration * groups.length);
  
  // Ensure lunch starts before 2:00 PM
  const finalLunchStart = Math.min(actualLunchStart, maxLunchStartFromStart);
  const lunchEndTime = finalLunchStart + config.lunchBreakDuration;
  
  // Generate morning track sessions
  for (let round = 1; round <= morningSessionsPerGroup; round++) {
    for (const group of groups) {
      sessions.push({
        id: `track-morning-${round}-${group.toLowerCase().replace(' ', '-')}`,
        startTime: formatTime(currentTime),
        endTime: formatTime(currentTime + config.sessionDuration),
        group: group,
        type: 'track',
        description: `${group} - Morning Session ${round}`
      });
      currentTime += config.sessionDuration;
    }
    
    // Add break between rounds (except after last round)
    if (round < morningSessionsPerGroup && config.breakDuration > 0) {
      sessions.push({
        id: `break-morning-${round}`,
        startTime: formatTime(currentTime),
        endTime: formatTime(currentTime + config.breakDuration),
        group: 'All',
        type: 'break',
        description: 'Break'
      });
      currentTime += config.breakDuration;
    }
  }
  
  // Lunch break (no overlap with group sessions)
  sessions.push({
    id: 'lunch-1',
    startTime: formatTime(finalLunchStart),
    endTime: formatTime(lunchEndTime),
    group: 'All',
    type: 'break',
    description: 'Lunch Break'
  });
  
  // Set current time to after lunch
  currentTime = lunchEndTime;
  
  // Calculate remaining time after lunch
  const totalEndTime = config.totalTime;
  const remainingTime = totalEndTime - currentTime;
  const afternoonSessionsPerGroup = Math.floor(remainingTime / (config.sessionDuration * groups.length));
  
  // Generate afternoon track sessions
  for (let round = 1; round <= afternoonSessionsPerGroup; round++) {
    for (const group of groups) {
      sessions.push({
        id: `track-afternoon-${round}-${group.toLowerCase().replace(' ', '-')}`,
        startTime: formatTime(currentTime),
        endTime: formatTime(currentTime + config.sessionDuration),
        group: group,
        type: 'track',
        description: `${group} - Afternoon Session ${round}`
      });
      currentTime += config.sessionDuration;
    }
    
    // Add break between rounds (except after last round)
    if (round < afternoonSessionsPerGroup && config.breakDuration > 0) {
      sessions.push({
        id: `break-afternoon-${round}`,
        startTime: formatTime(currentTime),
        endTime: formatTime(currentTime + config.breakDuration),
        group: 'All',
        type: 'break',
        description: 'Break'
      });
      currentTime += config.breakDuration;
    }
  }
  
  return sessions;
}

export function assignDriversToGroups(drivers: Driver[], config: TrackDayConfig): Record<string, Driver[]> {
  const groups: Record<string, Driver[]> = {};
  
  if (config.groupingMethod === 'skill') {
    // Deterministic, pure skill groups (Beginner, Intermediate, Advanced)
    const skillsInOrder: Array<Driver['skillLevel']> = ['beginner', 'intermediate', 'advanced'];
    skillsInOrder.forEach((skill) => {
      const driversWithSkill = drivers
        .filter((d) => d.skillLevel === skill)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (driversWithSkill.length > 0) {
        const label = skill.charAt(0).toUpperCase() + skill.slice(1);
        groups[label] = driversWithSkill;
      }
    });
  } else {
    // Initialize numbered groups for random assignment
    for (let i = 1; i <= config.numberOfRunGroups; i++) {
      groups[`Group ${i}`] = [];
    }
    // Random grouping
    const shuffledDrivers = [...drivers].sort(() => Math.random() - 0.5);
    const groupNames = Object.keys(groups);
    
    shuffledDrivers.forEach((driver, index) => {
      const groupName = groupNames[index % groupNames.length];
      if (groups[groupName]) {
        groups[groupName].push(driver);
      }
    });
  }
  
  return groups;
}
