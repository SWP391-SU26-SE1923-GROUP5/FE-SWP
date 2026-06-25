'use server'

import { IPaymentService } from "@/types";
import { LocalPayment } from "./providers/local.payment";

const getPaymentProvider = (): IPaymentService => {
    return new LocalPayment();
};

const paymentProvider = getPaymentProvider();

export const getMembershipTiers = paymentProvider.getMembershipTiers.bind(paymentProvider);
export const createCheckoutSession = paymentProvider.createCheckoutSession.bind(paymentProvider);
export const getCurrentUserTier = paymentProvider.getCurrentUserTier.bind(paymentProvider);