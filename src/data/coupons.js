// Coupon Codes Configuration
// ===========================
// Aap yahaan apne custom coupons add kar sakte ho!
// 
// FORMAT:
// {
//     code: "COUPON_CODE",      // Coupon code (uppercase recommended)
//     discount: 10,             // Discount amount
//     type: "percentage",       // "percentage" = % off, "fixed" = ₹ off
//     expiryDate: "2025-12-31", // Expiry date (YYYY-MM-DD format)
//     minOrder: 50,             // Minimum order amount (optional, 0 = no minimum)
//     maxDiscount: 100,         // Max discount for percentage coupons (optional)
//     description: "Description" // Coupon description
// }

export const coupons = [
    {
        code: "WELCOME10",
        discount: 10,
        type: "percentage",
        expiryDate: "2025-12-31",
        minOrder: 50,
        maxDiscount: 50,
        description: "10% off on your first order!"
    },
    {
        code: "FLAT20",
        discount: 20,
        type: "fixed",
        expiryDate: "2025-12-31",
        minOrder: 100,
        description: "Flat ₹20 off on orders above ₹100"
    },
    {
        code: "NEWYEAR25",
        discount: 25,
        type: "percentage",
        expiryDate: "2025-12-31",
        minOrder: 75,
        maxDiscount: 100,
        description: "New Year Special - 25% off!"
    },
    {
        code: "VIP50",
        discount: 50,
        type: "fixed",
        expiryDate: "2025-12-31",
        minOrder: 200,
        description: "VIP Exclusive - ₹50 off on orders above ₹200"
    }
];

// Helper function to validate coupon
export const validateCoupon = (code, orderTotal) => {
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
        return { valid: false, error: "Invalid coupon code" };
    }

    // Check expiry
    const today = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    expiryDate.setHours(23, 59, 59, 999); // End of expiry day

    if (today > expiryDate) {
        return { valid: false, error: "This coupon has expired" };
    }

    // Check minimum order
    if (coupon.minOrder && orderTotal < coupon.minOrder) {
        return {
            valid: false,
            error: `Minimum order of ₹${coupon.minOrder} required`
        };
    }

    // Calculate discount
    let discountAmount;
    if (coupon.type === "percentage") {
        discountAmount = (orderTotal * coupon.discount) / 100;
        // Apply max discount cap if exists
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    } else {
        discountAmount = coupon.discount;
    }

    // Don't allow discount more than order total
    discountAmount = Math.min(discountAmount, orderTotal);

    return {
        valid: true,
        coupon: coupon,
        discountAmount: discountAmount,
        message: `${coupon.description} - You save ₹${discountAmount.toFixed(2)}!`
    };
};
