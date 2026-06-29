'use server'

import { IGamificationService } from "@/types";
import { LocalGamification } from "./providers/local.gamification";

const getGamificationProvider = (): IGamificationService => {
    return new LocalGamification();
};

const gamificationProvider = getGamificationProvider();

export const getLeaderboard = gamificationProvider.getLeaderboard.bind(gamificationProvider);
export const getMyStats = gamificationProvider.getMyStats.bind(gamificationProvider);