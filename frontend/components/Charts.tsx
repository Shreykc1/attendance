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
const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
}

export default function Charts() {

    const [attendance, setAttendance] = useState();

    useEffect(() => {
      getData()
    }, [])


    const getData = async () =>{
        const result =  await fetch('http://127.0.0.1:3000/attendance',{
            method: "POST"
        }).then(
            res => {
                // setAttendance(res.json());
                console.log(res)
            }
        )
    }
  return (
        <div className="overflow-x-hidden flex justify-center items-center h-screen w-screen">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              bottom:20
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" fill="#2563eb" radius={4} >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
        </div>
  )
}
