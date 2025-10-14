function calculateItemRefund(item, orderTotal, couponDiscount) {
  const itemPrice = item.price;
  const ratio = couponDiscount / orderTotal; // percentage of coupon on total
  // Discounted price of single item
  const discountedPrice = itemPrice - itemPrice * ratio;

  // Multiply by quantity
  const refundAmount = discountedPrice * item.stock;

  return refundAmount;
}


module.exports = calculateItemRefund;