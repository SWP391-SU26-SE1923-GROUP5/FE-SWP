'use server'

import { IProfileService } from "@/types";
import { LocalProfile } from "./providers/local.profile";

const getProfileProvider = (): IProfileService => {
    return new LocalProfile();
};

const profileProvider = getProfileProvider();

export const getMyTierInfo = profileProvider.getMyTierInfo.bind(profileProvider);
export const getMyAchievements = profileProvider.getMyAchievements.bind(profileProvider);