"use client";

import { TierBreakdownDto } from "@/types";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell
} from "recharts";
import { Layers } from "lucide-react";

interface TierRevenueChartProps {
    data: TierBreakdownDto[];
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: readonly {
        value?: number | string;
        name?: string | number;
        color?: string;
        payload?: TierBreakdownDto;
    }[];
    label?: string | number;
}

const TIER_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#6366F1", "#EC4899"];

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    const dataItem = payload[0];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[160px]">
            <p className="font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-1">
                {label || dataItem?.payload?.tierName || "Tier"}
            </p>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Total Revenue:</span>
                <span className="font-extrabold text-slate-900 dark:text-emerald-400">
                    {(dataItem?.payload?.totalRevenue ?? 0).toLocaleString("vi-VN")} VND
                </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Transactions:</span>
                <span className="font-bold text-slate-900 dark:text-slate-200">
                    {(dataItem?.payload?.transactionCount ?? 0).toLocaleString()}
                </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Unit Price:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {(dataItem?.payload?.price ?? 0).toLocaleString("vi-VN")} VND
                </span>
            </div>
        </div>
    );
};

export default function TierRevenueChart({ data }: TierRevenueChartProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div className="mb-6">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Revenue by Subscription Tier
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Total revenue performance generated per tier
                    </p>
                </div>

                {data.length === 0 ? (
                    <div className="h-[320px] flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 p-6">
                        <Layers className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No tier data found</p>
                        <p className="text-xs max-w-xs mt-1 text-slate-500">Subscription transactions will populate this analytics chart once available.</p>
                    </div>
                ) : (
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                                <XAxis
                                    dataKey="tierName"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
                                    tickFormatter={(val) => `${Number(val).toLocaleString("vi-VN")} ₫`}
                                />
                                <Tooltip content={(props: unknown) => <CustomTooltip {...(props as CustomTooltipProps)} />} cursor={{ fill: "rgba(148, 163, 184, 0.04)", rx: 8 }} />
                                <Bar
                                    dataKey="totalRevenue"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={50}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry.tierName}-${index}`}
                                            fill={TIER_COLORS[index % TIER_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                    <div className="mb-6">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Tier Breakdown Details
                        </h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Detailed transaction counts and pricing structure
                        </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Tier Name</th>
                                    <th className="py-3 px-4 text-right">Price</th>
                                    <th className="py-3 px-4 text-right">Transactions</th>
                                    <th className="py-3 px-4 text-right">Total Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                            No subscription tiers to display
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, index) => {
                                        const color = TIER_COLORS[index % TIER_COLORS.length];
                                        return (
                                            <tr key={`row-${item.tierName}-${index}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
                                                    <span>{item.tierName}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                                    {(item?.price ?? 0).toLocaleString("vi-VN")} VND
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-bold text-slate-600 dark:text-slate-400">
                                                    {(item?.transactionCount ?? 0).toLocaleString()}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {(item?.totalRevenue ?? 0).toLocaleString("vi-VN")} VND
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
