const User = require('../models/userSchema');
const Wallet = require('../models/walletSchema');

// Generate referral code
const generateReferralCode = (firstName, lastName) => {
  const base = (firstName + lastName).toLowerCase().replace(/\s+/g, "");
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return base.slice(0, 2) + randomPart;
};

// Apply referral code
const applyReferral = async (newUserId, referralCode) => {
  const referrer = await User.findOne({ referralCode: referralCode });
  const newUser = await User.findById(newUserId);

  if (!referrer) throw new Error("Invalid referral code");
  if (newUser.redeemed) throw new Error("Referral already used");

  // ===== Handle new user's wallet =====
  let newUserWallet = await Wallet.findOne({ userId: newUser._id });
  if (!newUserWallet) {
    newUserWallet = new Wallet({ userId: newUser._id, balance: 0, transactions: [] });
  }
  newUserWallet.balance += 50;
  newUserWallet.transactions.push({
    type: "credit",
    amount: 50,
    reason: "Referral bonus (joining)",
    status: "success"
  });

  // ===== Handle referrer's wallet =====
  let referrerWallet = await Wallet.findOne({ userId: referrer._id });
  if (!referrerWallet) {
    referrerWallet = new Wallet({ userId: referrer._id, balance: 0, transactions: [] });
  }
  referrerWallet.balance += 100;
  referrerWallet.transactions.push({
    type: "credit",
    amount: 100,
    reason: "Referral bonus (referring)",
    status: "success"
  });

  // ===== Update users =====
  newUser.redeemed = true;
  newUser.walletBalance = (newUser.walletBalance || 0) + 50;   // keep in sync
  referrer.redeemedUsers.push(newUser._id);
  referrer.walletBalance = (referrer.walletBalance || 0) + 100; // keep in sync

  // ===== Save all =====
  await Promise.all([
    newUser.save(),
    referrer.save(),
    newUserWallet.save(),
    referrerWallet.save()
  ]);

  return { success: true, message: "Referral applied successfully" };
};

module.exports = { generateReferralCode, applyReferral };
