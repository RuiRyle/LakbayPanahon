// Fictional lesson exchanges use authored quantities, never historical market prices.
export function validateTradeActivity(activity) {
    const positive = value => Number.isInteger(value) && value > 0 && value <= 200;
    const inventory = goods => Array.isArray(goods) && goods.length > 0 &&
        goods.every(good => typeof good.id === 'string' && good.id && typeof good.name === 'string' && good.name.trim() && positive(good.quantity)) &&
        new Set(goods.map(good => good.id)).size === goods.length;
    if (!activity || !inventory(activity.ownGoods) || !inventory(activity.partnerGoods) ||
        !activity.ownNeed || !activity.partnerNeed || !activity.agreement ||
        !positive(activity.ownNeed.quantity) || !positive(activity.partnerNeed.quantity) ||
        !positive(activity.agreement.offerQuantity) || !positive(activity.agreement.receiveQuantity) ||
        typeof activity.title !== 'string' || !activity.title.trim() ||
        typeof activity.instructions !== 'string' || !activity.instructions.trim()) throw new Error('This exchange activity needs valid Firestore content.');
    const offer = activity.ownGoods.find(good => good.id === activity.partnerNeed.goodId);
    const receive = activity.partnerGoods.find(good => good.id === activity.ownNeed.goodId);
    if (!offer || !receive || activity.agreement.offerGoodId !== offer.id ||
        activity.agreement.receiveGoodId !== receive.id) throw new Error('The exchange goods do not match the authored needs.');
    const bundles = Math.max(Math.ceil(activity.partnerNeed.quantity / activity.agreement.offerQuantity),
        Math.ceil(activity.ownNeed.quantity / activity.agreement.receiveQuantity));
    if (bundles * activity.agreement.offerQuantity > offer.quantity ||
        bundles * activity.agreement.receiveQuantity > receive.quantity) throw new Error('This exchange has no workable plan.');
    return activity;
}

export function evaluateTradePlan(activity, plan) {
    validateTradeActivity(activity);
    const offer = activity.ownGoods.find(good => good.id === plan?.offerGoodId);
    const receive = activity.partnerGoods.find(good => good.id === plan?.receiveGoodId);
    const offered = Number(plan?.offerQuantity), received = Number(plan?.receiveQuantity);
    if (!offer || !receive || !Number.isInteger(offered) || !Number.isInteger(received) || offered < 1 || received < 1)
        return {valid: false, message: 'Choose both goods and whole quantities for your plan.'};
    if (offered > offer.quantity || received > receive.quantity)
        return {valid: false, message: 'Your plan uses more goods than a community has. Check the evidence journal.'};
    if (offer.id !== activity.partnerNeed.goodId || receive.id !== activity.ownNeed.goodId)
        return {valid: false, message: 'Check what each community needs. Does your plan give both communities a useful good?'};
    const agreement = activity.agreement;
    if (offered % agreement.offerQuantity !== 0 || received % agreement.receiveQuantity !== 0 ||
        offered / agreement.offerQuantity !== received / agreement.receiveQuantity)
        return {valid: false, message: 'Check the exchange the communities agreed on. Both sides of your plan must follow that agreement.'};
    if (offered < activity.partnerNeed.quantity || received < activity.ownNeed.quantity)
        return {valid: false, message: 'Your plan follows the agreement, but a community still needs more. Compare both needs.'};
    return {valid: true, ownRemaining: offer.quantity - offered, partnerRemaining: receive.quantity - received,
        message: 'Your plan meets both needs and follows the agreement. Now explain why the exchange helps both communities.'};
}
