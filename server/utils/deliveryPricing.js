/**
 * Weight-based delivery charge logic
 * All weights in kg
 */
const DELIVERY_TIERS = [
  { maxWeight: 50,  charge: 0   },
  { maxWeight: 200, charge: 50  },
  { maxWeight: 500, charge: 120 },
  { maxWeight: Infinity, charge: 250 },
];

const GST_RATE = 0.18; // 18%
const DELIVERY_RATE_PER_ITEM = 120; // ₹120 per delivery for rider earnings

/**
 * Parse a weight string like "50kg", "12m", "500g" to kg
 */
function parseWeightKg(weightStr) {
  if (!weightStr) return 0;
  const str = String(weightStr).toLowerCase().trim();
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (str.includes('g') && !str.includes('kg')) return num / 1000;
  if (str.includes('kg')) return num;
  if (str.includes('t')) return num * 1000;
  // For rods like "12m" treat as negligible for weight calc
  return 0;
}

function getDeliveryCharge(totalWeightKg) {
  for (const tier of DELIVERY_TIERS) {
    if (totalWeightKg <= tier.maxWeight) return tier.charge;
  }
  return 250;
}

function calculateCartTotals(items, discountAmount = 0) {
  const subtotal = items.reduce((s, i) => s + (i.priceSnapshot || i.price) * i.quantity, 0);
  const totalWeight = items.reduce((s, i) => {
    const w = i.weightSnapshot !== undefined ? i.weightSnapshot : parseWeightKg(i.weight);
    return s + w * i.quantity;
  }, 0);
  const deliveryCharge = getDeliveryCharge(totalWeight);
  const discounted = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(discounted * GST_RATE);
  const grandTotal = discounted + deliveryCharge + gstAmount;
  return { subtotal, totalWeight: Math.round(totalWeight * 100) / 100, deliveryCharge, gstAmount, grandTotal };
}

module.exports = { getDeliveryCharge, calculateCartTotals, parseWeightKg, GST_RATE, DELIVERY_RATE_PER_ITEM };
