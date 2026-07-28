'use server'

import { IAdminService } from "@/types";
import { LocalAdmin } from "./providers/local.admin";

const getAdminProvider = (): IAdminService => {
    return new LocalAdmin();
};

const adminProvider = getAdminProvider();

export const getAdminDashboard = adminProvider.getDashboard.bind(adminProvider);
export const getAdminUsers = adminProvider.getUsers.bind(adminProvider);
export const updateAdminUser = adminProvider.updateUser.bind(adminProvider);
