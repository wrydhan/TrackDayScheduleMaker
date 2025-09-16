'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Driver, TrackDayConfig, Schedule } from '@/types';
import { generateSchedule, assignDriversToGroups } from '@/lib/scheduleGenerator';
import { generatePDF } from '@/lib/pdfGenerator';
import { Plus, Trash2, Download, Zap, Users, Clock, Settings } from 'lucide-react';
import DraggableDriverGroups from './DraggableDriverGroups';

const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced'])
});

const formSchema = z.object({
  startTime: z.string().min(1, 'Start time is required'),
  totalTime: z.number().min(60, 'Minimum 60 minutes'),
  sessionDuration: z.number().min(10, 'Minimum 10 minutes'),
  numberOfRunGroups: z.number().min(2, 'Minimum 2 groups').max(6, 'Maximum 6 groups'),
  groupingMethod: z.enum(['skill', 'random']),
  lunchBreakDuration: z.number().min(30, 'Minimum 30 minutes'),
  techInspectionDuration: z.number().min(15, 'Minimum 15 minutes'),
  driverMeetingDuration: z.number().min(10, 'Minimum 10 minutes'),
  breakDuration: z.number().min(0, 'Minimum 0 minutes').max(60, 'Maximum 60 minutes'),
  drivers: z.array(driverSchema).min(1, 'At least one driver required')
});

type FormData = z.infer<typeof formSchema>;

export default function TrackDayForm() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [driverGroups, setDriverGroups] = useState<Record<string, Driver[]>>({});
  const [hasGeneratedSchedule, setHasGeneratedSchedule] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startTime: '08:00',
      totalTime: 480,
      sessionDuration: 20,
      numberOfRunGroups: 3,
      groupingMethod: 'skill',
      lunchBreakDuration: 60,
      techInspectionDuration: 30,
      driverMeetingDuration: 15,
      breakDuration: 15,
      drivers: [{ name: '', skillLevel: 'beginner' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'drivers'
  });

  const watchedValues = watch();

  // Memoize computed values to prevent infinite loops
  const validDrivers = useMemo(() => {
    return watchedValues.drivers
      .filter(driver => driver.name.trim() !== '')
      .map((driver, index) => ({
        id: `driver-${index}`,
        name: driver.name,
        skillLevel: driver.skillLevel
      }));
  }, [watchedValues.drivers]);

  const config = useMemo(() => ({
    startTime: watchedValues.startTime,
    totalTime: watchedValues.totalTime,
    sessionDuration: watchedValues.sessionDuration,
    numberOfRunGroups: watchedValues.numberOfRunGroups,
    groupingMethod: watchedValues.groupingMethod,
    lunchBreakDuration: watchedValues.lunchBreakDuration,
    techInspectionDuration: watchedValues.techInspectionDuration,
    driverMeetingDuration: watchedValues.driverMeetingDuration,
    breakDuration: watchedValues.breakDuration
  }), [
    watchedValues.startTime,
    watchedValues.totalTime,
    watchedValues.sessionDuration,
    watchedValues.numberOfRunGroups,
    watchedValues.groupingMethod,
    watchedValues.lunchBreakDuration,
    watchedValues.techInspectionDuration,
    watchedValues.driverMeetingDuration,
    watchedValues.breakDuration
  ]);

  // Optimized useEffect with debounced updates
  useEffect(() => {
    if (hasGeneratedSchedule && validDrivers.length > 0) {
      const timer = setTimeout(() => {
        try {
          const groups = assignDriversToGroups(validDrivers, config);
          setDriverGroups(groups);
        } catch (error) {
          console.error('Error assigning drivers to groups:', error);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [hasGeneratedSchedule, validDrivers, config.groupingMethod, config.numberOfRunGroups]);

  const onSubmit = useCallback((data: FormData) => {
    const submissionConfig: TrackDayConfig = {
      startTime: data.startTime,
      totalTime: data.totalTime,
      sessionDuration: data.sessionDuration,
      numberOfRunGroups: data.numberOfRunGroups,
      groupingMethod: data.groupingMethod,
      lunchBreakDuration: data.lunchBreakDuration,
      techInspectionDuration: data.techInspectionDuration,
      driverMeetingDuration: data.driverMeetingDuration,
      breakDuration: data.breakDuration
    };

    const drivers: Driver[] = data.drivers
      .filter(driver => driver.name.trim() !== '')
      .map((driver, index) => ({
        id: `driver-${index}`,
        name: driver.name,
        skillLevel: driver.skillLevel
      }));

    try {
      const generatedSchedule = generateSchedule(drivers, submissionConfig);
      const groups = assignDriversToGroups(drivers, submissionConfig);

      setSchedule(generatedSchedule);
      setDriverGroups(groups);
      setHasGeneratedSchedule(true);
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  }, []);

  const handleDownloadPDF = useCallback(() => {
    if (schedule) {
      try {
        generatePDF(schedule, driverGroups);
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  }, [schedule, driverGroups]);

  const handleGroupsChange = useCallback((newGroups: Record<string, Driver[]>) => {
    setDriverGroups(newGroups);
  }, []);

  const timeOptions = useMemo(() => {
    const options: React.ReactNode[] = [];
    for (let hour = 6; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = hour === 12 ? `12:${minute.toString().padStart(2, '0')} PM` :
                           hour > 12 ? `${hour - 12}:${minute.toString().padStart(2, '0')} PM` :
                           `${hour}:${minute.toString().padStart(2, '0')} AM`;
        options.push(
          <option key={timeString} value={timeString}>
            {displayTime}
          </option>
        );
      }
    }
    return options;
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12 floating">
        <h1 className="text-5xl font-bold mb-4 tracking-wide">
          Track Day Schedule Maker
        </h1>
        <p className="text-xl text-gray-300 font-medium">
          Create Racing Schedules
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-2xl text-blue-400" />
            <h2 className="text-2xl font-bold">Track Day Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Clock size={16} />
                Start Time
              </label>
              <select
                {...register('startTime')}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                {timeOptions}
              </select>
              {errors.startTime && <p className="text-red-400 text-sm mt-2 font-medium">{errors.startTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Clock size={16} />
                Total Track Time (minutes)
              </label>
              <input
                type="number"
                {...register('totalTime', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="480"
              />
              {errors.totalTime && <p className="text-red-400 text-sm mt-2 font-medium">{errors.totalTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Zap size={16} />
                Session Duration (minutes)
              </label>
              <input
                type="number"
                {...register('sessionDuration', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="20"
              />
              {errors.sessionDuration && <p className="text-red-400 text-sm mt-2 font-medium">{errors.sessionDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Users size={16} />
                Number of Run Groups
              </label>
              <input
                type="number"
                {...register('numberOfRunGroups', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="3"
              />
              {errors.numberOfRunGroups && <p className="text-red-400 text-sm mt-2 font-medium">{errors.numberOfRunGroups.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Users size={16} />
                Grouping Method
              </label>
              <select
                {...register('groupingMethod')}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="skill">By Skill Level</option>
                <option value="random">Random Groups</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Clock size={16} />
                Lunch Break Duration (minutes)
              </label>
              <input
                type="number"
                {...register('lunchBreakDuration', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="60"
              />
              {errors.lunchBreakDuration && <p className="text-red-400 text-sm mt-2 font-medium">{errors.lunchBreakDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Settings size={16} />
                Tech Inspection Duration (minutes)
              </label>
              <input
                type="number"
                {...register('techInspectionDuration', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="30"
              />
              {errors.techInspectionDuration && <p className="text-red-400 text-sm mt-2 font-medium">{errors.techInspectionDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Users size={16} />
                Driver Meeting Duration (minutes)
              </label>
              <input
                type="number"
                {...register('driverMeetingDuration', { valueAsNumber: true })}
                className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                placeholder="15"
              />
              {errors.driverMeetingDuration && <p className="text-red-400 text-sm mt-2 font-medium">{errors.driverMeetingDuration.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <Zap size={16} />
                Break Between Sessions: <span className="text-blue-400 font-bold text-lg">{watchedValues.breakDuration}</span> minutes
              </label>
              <div className="mt-4">
                <input
                  type="range"
                  {...register('breakDuration', { valueAsNumber: true })}
                  min="0"
                  max="60"
                  step="5"
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-3 font-medium">
                  <span>0 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>
              {errors.breakDuration && <p className="text-red-400 text-sm mt-2 font-medium">{errors.breakDuration.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-2xl text-purple-400" />
            <h2 className="text-2xl font-bold">Drivers</h2>
          </div>
          
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 mb-6 p-6 border border-muted rounded-xl card-muted">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-3 text-gray-300">Driver Name</label>
                <input
                  {...register(`drivers.${index}.name`)}
                  className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  placeholder="Enter driver name"
                />
                {errors.drivers?.[index]?.name && (
                  <p className="text-red-400 text-sm mt-2 font-medium">{errors.drivers[index]?.name?.message}</p>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-3 text-gray-300">Skill Level</label>
                <select
                  {...register(`drivers.${index}.skillLevel`)}
                  className="w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="btn-danger p-4"
                  disabled={fields.length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => append({ name: '', skillLevel: 'beginner' })}
            className="flex items-center gap-3 px-6 py-4 text-blue-400 hover:bg-blue-900/20 rounded-xl font-semibold border-2 border-dashed border-blue-400 hover:border-blue-300 transition-all duration-300"
          >
            <Plus size={24} />
            Add Driver
          </button>
          {errors.drivers && <p className="text-red-400 text-sm mt-3 font-medium">{errors.drivers.message}</p>}
        </div>

        <div className="flex justify-center mt-8">
          <button 
            type="submit" 
            className="btn-primary px-8 py-4 text-lg font-bold flex items-center gap-3 pulsing"
          >
            <Zap size={24} />
            Generate Schedule
          </button>
        </div>
      </form>

      {schedule && (
        <div className="mt-12 card p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Download className="text-2xl text-green-400" />
              <h2 className="text-2xl font-bold">Generated Schedule</h2>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="btn-success flex items-center gap-3 px-6 py-3"
            >
              <Download size={20} />
              Download PDF
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left">Start Time</th>
                  <th className="px-6 py-4 text-left">End Time</th>
                  <th className="px-6 py-4 text-left">Group</th>
                  <th className="px-6 py-4 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {schedule.sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 font-medium text-gray-200">{session.startTime}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">{session.endTime}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">{session.group}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">{session.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {Object.keys(driverGroups).length > 0 && (
        <DraggableDriverGroups
          driverGroups={driverGroups}
          onGroupsChange={handleGroupsChange}
        />
      )}
    </div>
  );
}
