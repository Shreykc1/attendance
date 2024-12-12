"use client"
import '../src/App.css'

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"


import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'


const chartConfig = {
  subject_precentages: {
    label: "Subject Precentages",
    color: "hsl(var(--chart-1))",
  },
}
type Attendance = {
    subject: string;
    percentage: number;
}
type ChartsProps = {
    setData: any;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Charts({ setData, isLoading, setIsLoading}: ChartsProps) {
    const [attendance, setAttendance] = useState<Attendance[]>([]);


    const fullSubjectNames: { [key: string]: string } = {
        "COMPUTER SCIENCE PRACTICAL XIII": "PRACT XIII",
        "COMPUTER SCIENCE PRACTICAL XIV": "PRACT XIV",
        "DATA SCIENCE": "Data Science",
        "ETHICAL HACKING & CYBER FORENSICS": "Ethical Hacking",
        "INFORMATON RETRIEVAL": "Info Retrieval",
        "PROJECT IMPLEMENTATION": "Project",
        "SKILL ENHANCEMENT: HUMAN COMPUTER INTERA": "HCI",
        "WIRELESS SENSOR NETWORKS AND MOBILE COMM": "WSN"
    };


    useEffect(() => {
        getData()
    }, [])

    const getData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:3000/attendance", {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                setIsLoading(false);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Transform the data for the chart
            const formattedData = Object.entries(data.subject_percentages).map(([subject, percentage]) => ({
                subject: fullSubjectNames[subject] || subject, // Use mapping or original if not found
                percentage: Number(percentage)
            }));
            setAttendance(formattedData);
            setData(data);
            console.log(data);
            setIsLoading(false);

        } catch (error) {
            console.error('Error fetching attendance data:', error);
            setIsLoading(false);

        }
    }

    return (
        <>
            {isLoading && <div className='w-screen h-screen bg-black/80 text-white flex justify-center  items-center'><Loader2 className='animate-spin'/></div>}
            <div className="overflow-x-hidden flex justify-center items-center h-screen w-screen ">
            <ChartContainer config={chartConfig} className="min-h-[400px] w-full px-4 ">
                <BarChart
                    data={attendance}
                    margin={{
                        top: 20,
                        bottom: 10
                    }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="subject"
                        tickLine={true}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fill: '#666', fontSize: 12 }}  // Customized tick style
                    />
                     <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                />
                    <Bar
                        dataKey="percentage"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                    >
                        <LabelList
                            dataKey="percentage"
                            position="top"
                            formatter={(value: number) => `${Math.round(value)}%`}
                            className="fill-foreground"
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
        </>
    )
}
