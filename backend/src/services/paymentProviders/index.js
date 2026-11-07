const stripeProvider = require('./stripeSimulator.provider');
const adyenProvider = require('./adyenSimulator.provider');
const paypalProvider = require('./paypal.provider');
const upiProvider = require('./upiSimulator.provider');
const dlocalProvider = require('./dlocalSimulator.provider');

const providers = {
  stripe: stripeProvider,
  adyen: adyenProvider,
  paypal: paypalProvider,
  razorpay_upi: upiProvider,
  dlocal: dlocalProvider
};

function getProvider(providerId) {
  return providers[providerId] || stripeProvider;
}

function getAllProviders() {
  return Object.values(providers);
}

module.exports = {
  providers,
  getProvider,
  getAllProviders
};

