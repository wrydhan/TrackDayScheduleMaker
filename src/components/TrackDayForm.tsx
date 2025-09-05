'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Driver, TrackDayConfig, Schedule } from '@/types';
import { generateSchedule, assignDriversToGroups } from '@/lib/scheduleGenerator';
import { generatePDF } from '@/lib/pdfGenerator';
import { Plus, Trash2, Download } from 'lucide-react';
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
      totalTime: 480, // 8 hours
      sessionDuration: 20,
      numberOfRunGroups: 3,
      groupingMethod: 'skill',
      lunchBreakDuration: 60,
      techInspectionDuration: 30,
      driverMeetingDuration: 15,
      breakDuration: 15, // 15 minutes between sessions
      drivers: [{ name: '', skillLevel: 'beginner' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'drivers'
  });

  const breakDuration = watch('breakDuration');
  const startTime = watch('startTime');
  const drivers = watch('drivers');
  const groupingMethod = watch('groupingMethod');
  const numberOfRunGroups = watch('numberOfRunGroups');

  // Auto-update groups when drivers, grouping method, or number of groups changes
  useEffect(() => {
    if (hasGeneratedSchedule && drivers.length > 0) {
      const config: TrackDayConfig = {
        startTime: startTime,
        totalTime: 480, // Use default for auto-update
        sessionDuration: 20,
        numberOfRunGroups: numberOfRunGroups,
        groupingMethod: groupingMethod,
        lunchBreakDuration: 60,
        techInspectionDuration: 30,
        driverMeetingDuration: 15,
        breakDuration: breakDuration
      };

      const driverObjects: Driver[] = drivers.map((driver, index) => ({
        id: `driver-${index}`,
        name: driver.name,
        skillLevel: driver.skillLevel
      }));

      // Update groups for both skill and random grouping if we have valid drivers
      if (driverObjects.every(d => d.name.trim() !== '')) {
        const groups = assignDriversToGroups(driverObjects, config);
        setDriverGroups(groups);
      }
    }
  }, [drivers, groupingMethod, numberOfRunGroups, hasGeneratedSchedule, startTime, breakDuration]);

  const onSubmit = (data: FormData) => {
    const config: TrackDayConfig = {
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

    const drivers: Driver[] = data.drivers.map((driver, index) => ({
      id: `driver-${index}`,
      name: driver.name,
      skillLevel: driver.skillLevel
    }));

    const generatedSchedule = generateSchedule(drivers, config);
    const groups = assignDriversToGroups(drivers, config);

    setSchedule(generatedSchedule);
    setDriverGroups(groups);
    setHasGeneratedSchedule(true);
  };

  const handleDownloadPDF = () => {
    if (schedule) {
      generatePDF(schedule, driverGroups);
    }
  };

  const handleGroupsChange = (newGroups: Record<string, Driver[]>) => {
    setDriverGroups(newGroups);
  };

  // Generate time options for the dropdown
  const generateTimeOptions = () => {
    const options = [];
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
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Track Day Schedule Maker</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Configuration Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Track Day Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Start Time</label>
              <select
                {...register('startTime')}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
              >
                {generateTimeOptions()}
              </select>
              {errors.startTime && <p className="text-red-500 text-sm mt-1 font-medium">{errors.startTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Total Track Time (minutes)</label>
              <input
                type="number"
                {...register('totalTime', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="480"
              />
              {errors.totalTime && <p className="text-red-500 text-sm mt-1 font-medium">{errors.totalTime.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Session Duration (minutes)</label>
              <input
                type="number"
                {...register('sessionDuration', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="20"
              />
              {errors.sessionDuration && <p className="text-red-500 text-sm mt-1 font-medium">{errors.sessionDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Number of Run Groups</label>
              <input
                type="number"
                {...register('numberOfRunGroups', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="3"
              />
              {errors.numberOfRunGroups && <p className="text-red-500 text-sm mt-1 font-medium">{errors.numberOfRunGroups.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Grouping Method</label>
              <select
                {...register('groupingMethod')}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
              >
                <option value="skill">By Skill Level</option>
                <option value="random">Random Groups</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Lunch Break Duration (minutes)</label>
              <input
                type="number"
                {...register('lunchBreakDuration', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="60"
              />
              {errors.lunchBreakDuration && <p className="text-red-500 text-sm mt-1 font-medium">{errors.lunchBreakDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Tech Inspection Duration (minutes)</label>
              <input
                type="number"
                {...register('techInspectionDuration', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="30"
              />
              {errors.techInspectionDuration && <p className="text-red-500 text-sm mt-1 font-medium">{errors.techInspectionDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">Driver Meeting Duration (minutes)</label>
              <input
                type="number"
                {...register('driverMeetingDuration', { valueAsNumber: true })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                placeholder="15"
              />
              {errors.driverMeetingDuration && <p className="text-red-500 text-sm mt-1 font-medium">{errors.driverMeetingDuration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Break Between Sessions: {breakDuration} minutes
              </label>
              <div className="mt-2">
                <input
                  type="range"
                  {...register('breakDuration', { valueAsNumber: true })}
                  min="0"
                  max="60"
                  step="5"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>
              {errors.breakDuration && <p className="text-red-500 text-sm mt-1 font-medium">{errors.breakDuration.message}</p>}
            </div>
          </div>
        </div>

        {/* Drivers Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Drivers</h2>
          
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-4 mb-4 p-4 border border-gray-200 rounded-md">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Driver Name</label>
                <input
                  {...register(`drivers.${index}.name`)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
                  placeholder="Enter driver name"
                />
                {errors.drivers?.[index]?.name && (
                  <p className="text-red-500 text-sm mt-1 font-medium">{errors.drivers[index]?.name?.message}</p>
                )}
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Skill Level</label>
                <select
                  {...register(`drivers.${index}.skillLevel`)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-900"
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
                  className="p-3 text-red-500 hover:bg-red-50 rounded-md font-medium"
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
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md font-semibold"
          >
            <Plus size={20} />
            Add Driver
          </button>
          
          {errors.drivers && <p className="text-red-500 text-sm mt-2 font-medium">{errors.drivers.message}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold"
          >
            Generate Schedule
          </button>
        </div>
      </form>

      {/* Schedule Display */}
      {schedule && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Generated Schedule</h2>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold"
            >
              <Download size={20} />
              Download PDF
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900">Start Time</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900">End Time</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900">Group</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold text-gray-900">Description</th>
                </tr>
              </thead>
              <tbody>
                {schedule.sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{session.startTime}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{session.endTime}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{session.group}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-gray-900">{session.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Draggable Driver Groups Display */}
      {Object.keys(driverGroups).length > 0 && (
        <DraggableDriverGroups
          driverGroups={driverGroups}
          onGroupsChange={handleGroupsChange}
        />
      )}
    </div>
  );
}
