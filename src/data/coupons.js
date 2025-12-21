// Coupon Codes Configuration
// ===========================
// All coupons are now managed from Admin Panel
// This file is kept for backward compatibility only

export const coupons = [];

// Helper function to validate coupon (legacy - now uses API)
export const validateCoupon = (code, orderTotal) => {
    return { valid: false, error: "Invalid coupon code" };
};
