"use client";

import {
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
    PolarAngleAxis,
} from "recharts";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/lib/utils";

import { getCurrentUserTier } from "@/lib/actions/payment.actions";

const chartConfig = {
    size: {
        label: "Size",
    },
    used: {
        label: "Used",
        color: "white",
    },
} satisfies ChartConfig;

export const Chart = ({ used = 0 }: { used?: number }) => {
    const [storageLimitMb, setStorageLimitMb] = useState(0);
    const [tierName, setTierName] = useState("Loading...");

    useEffect(() => {
        const fetchTierData = async () => {
            try {
                const userTier = await getCurrentUserTier();

                if (userTier) {
                    setStorageLimitMb(userTier.storageLimitMb);
                    setTierName(userTier.tierName);
                }
            } catch (error) {
                console.error("Failed to load tier data", error);
                setTierName("Free Plan");
            }
        };

        fetchTierData();
    }, []);

    const totalBytes = storageLimitMb * 1024 * 1024;
    const percentage = totalBytes > 0 ? Number(((used / totalBytes) * 100).toFixed(2)) : 0;
    const chartData = [{ name: "Used", storage: Math.min(percentage, 100), fill: "#064e3b" }];

    return (
        <Card className="chart flex flex-row items-center justify-between p-6 bg-emerald-500 text-white border-none shadow-md">

            <CardContent className="p-0 flex items-center justify-center shrink-0">
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
                                                    {percentage}%
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

            <CardHeader className="chart-details text-left p-0 flex-1 ml-6 space-y-1.5">
                <span className="text-[10px] font-bold bg-white/20 w-fit px-2.5 py-0.5 rounded-full backdrop-blur-sm mb-1">
                    {tierName}
                </span>
                <CardTitle className="text-xl font-bold text-white">Available Storage</CardTitle>
                <CardDescription className="text-sm text-white/90">
                    {convertFileSize(used)} / {totalBytes > 0 ? convertFileSize(totalBytes) : "0 B"}
                </CardDescription>

                <div className="pt-2">
                    <Button asChild className="w-full bg-white text-emerald-600 hover:bg-slate-100 h-9 text-xs font-semibold rounded-full cursor-pointer">
                        <Link href="/pricing">
                            Upgrade Plan
                        </Link>
                    </Button>
                </div>
            </CardHeader>

        </Card>
    );
};