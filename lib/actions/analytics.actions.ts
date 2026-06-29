'use server'

import { IAnalyticsService } from "@/types";
import { LocalAnalytics } from "./providers/local.analytics";

const getAnalyticsProvider = (): IAnalyticsService => {
    return new LocalAnalytics();
};

const analyticsProvider = getAnalyticsProvider();

export const getAnalyticsDashboard = analyticsProvider.getDashboard.bind(analyticsProvider);