//@ts-nocheck
import './App.css'
import Charts from '../components/Charts'
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
function App() {
    const [data, setData] = useState();
    const [isLoading, setIsLoading] = useState(false);
    return (
        <>
            {isLoading && <div className='w-screen h-screen bg-black/80 text-white flex justify-center items-center'><Loader2 className='animate-spin'/></div>}
            <div className='min-h-screen w-screen bg-zinc-950 text-white tracking-tight flex justify-center items-center overflow-x-hidden flex-col font-geist'>
            <div className='max-w-7xl w-full px-4 py-10 space-y-8 mt-10'>
                {/* Header Section */}
                <div className='space-y-4 text-center '>
                    <h1 className='font-extrabold text-6xl text-blue-500 overflow-hidden'>
                        Welcome Shrey
                    </h1>
                    <p className='text-3xl font-semibold text-zinc-200 overflow-hidden'>
                        Attendance Dashboard
                    </p>
                </div>

                {/* Stats Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 overflow-hidden'>
                    {/* Overall Attendance Card */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium '>Overall Attendance</h3>
                        <p className='text-4xl font-bold mt-2 overflow-hidden'>{data?.overall_attendance.toFixed(2)}%</p>
                    </div>

                    {/* Present/Absent Stats */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium'>Attendance Record</h3>
                        <div className='flex justify-between mt-2'>
                            <div>
                                <p className='text-2xl font-bold text-green-400'>{data?.present_entries}</p>
                                <p className='text-sm text-zinc-400'>Present</p>
                            </div>
                            <div>
                                <p className='text-2xl font-bold text-red-400 ml-3'>{data?.absent_entries}</p>
                                <p className='text-sm text-zinc-400'>Absent</p>
                            </div>
                        </div>
                    </div>

                    {/* Forecast Card */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium'>Forecast</h3>
                        <div className='space-y-2 mt-2'>
                            <p className='text-sm'>Attend: <span className='text-green-400'>{data?.forecast_attend.toFixed(2)}%</span></p>
                            <p className='text-sm'>Miss: <span className='text-red-400'>{data?.forecast_miss.toFixed(2)}%</span></p>
                        </div>
                    </div>

                    {/* Average Lectures */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium'>Average Lectures</h3>
                        <div className='space-y-2 mt-2'>
                            <p className='text-sm'>Per Day: <span className='text-white font-bold'>{data?.avg_lectures_per_day.toFixed(1)}</span></p>
                            <p className='text-sm'>Per Week: <span className='text-white font-bold'>{data?.avg_lectures_per_week.toFixed(1)}</span></p>
                        </div>
                    </div>

                    {/* Attendance Patterns */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium'>Attendance Patterns</h3>
                        <div className='space-y-2 mt-2'>
                            <p className='text-sm'>Most Attended: <span className='text-green-400'>{data?.most_attended_day}</span></p>
                            <p className='text-sm'>Most Missed: <span className='text-red-400'>{data?.most_missed_day}</span></p>
                        </div>
                    </div>

                    {/* Missable Classes */}
                    <div className='bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all'>
                        <h3 className='text-zinc-400 text-sm font-medium'>Missable Classes</h3>
                        <p className='text-4xl font-bold mt-2 overflow-hidden'>{data?.missable_classes}</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className='h-[600px] w-[800px] flex justify-center items-center ml-60 relative overflow-hidden'>
                    <Charts isLoading={isLoading} setIsLoading={setIsLoading} setData={setData}/>
                </div>

                {/* Skippable Lectures  */}
                <div className='w-full flex flex-col'>
                    <h1 className='text-4xl overflow-hidden'>Lects You Can Miss</h1>
                    <div className='flex w-full mt-4 gap-4'>
                    {data && data.skippable_lectures &&
                        Object.keys(data.skippable_lectures).map((key) => {

                            if (data.skippable_lectures[key] !== 0) {
                                return (
                                    <div
                                        key={key}
                                        className='w-full sm:w-1/2 lg:w-1/3 bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between'
                                    >
                                        <p className="text-lg font-medium">{key}</p>
                                        <h2 className='text-4xl font-bold mt-2 overflow-hidden text-green-400'>{data.skippable_lectures[key]}</h2>
                                    </div>
                                );
                            }
                        return null;
                        })
                     }
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default App
