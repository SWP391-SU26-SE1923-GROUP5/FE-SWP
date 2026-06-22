"use client";

import {
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
    PolarAngleAxis,
} from "recharts";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { calculatePercentage, convertFileSize } from "@/lib/utils";

const chartConfig = {
    size: {
        label: "Size",
    },
    used: {
        label: "Used",
        color: "white",
    },
} satisfies ChartConfig;

export const Chart = ({ used = 0 }: { used: number }) => {
    const percentage = Number(calculatePercentage(used)) || 0;

    const chartData = [{ name: "Used", storage: percentage, fill: "#064e3b" }];

    return (
        <Card className="chart flex flex-row items-center justify-between p-6 bg-emerald-500 text-white border-none shadow-md">

            <CardContent className="p-0 flex items-center justify-center">
                <ChartContainer config={chartConfig} className="w-[140px] h-[140px]">
                    <RadialBarChart
                        data={chartData}
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={50}
                        outerRadius={65}
                        width={140}
                        height={140}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            dataKey="storage"
                            background={{ fill: "rgba(255, 255, 255, 0.2)" }}
                            cornerRadius={10}
                        />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="text-3xl font-bold fill-white"
                                                >
                                                    {percentage
                                                        ? percentage
                                                        : "0"}
                                                    %
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 20}
                                                    className="text-xs font-medium fill-white/80"
                                                >
                                                    Space used
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>

            <CardHeader className="chart-details text-left p-0 flex-1 ml-6 space-y-1">
                <CardTitle className="text-xl font-bold text-white">Available Storage</CardTitle>
                <CardDescription className="text-sm text-white/90">
                    {used ? convertFileSize(used) : "2GB"} / 2GB
                </CardDescription>
            </CardHeader>
        </Card>
    );
};