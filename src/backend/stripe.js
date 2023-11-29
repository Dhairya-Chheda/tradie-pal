import wixData from "wix-data";
//@ts-ignore
import Stripe from "stripe";
//@ts-ignore
import { v4 as uuid } from "uuid";
import { getSecret } from 'wix-secrets-backend';
import { isMemberHaveActiveAccountById } from "backend/membership";
import {
  STRIPE_MODE_IS_LIVE, STRIPE_API_KEY_TEST, STRIPE_API_KEY_LIVE, STRIPE_OPTIONS,
  STRIPE_PAYMENT_STATUS_WAITING, STRIPE_PAYMENT_STATUS_COMPLETED, STRIPE_PAYMENT_STATUS_FAILED, DOMAIN_URL,
  STRIPE_PORTAL_CONFIG
} from "public/constant";



export async function updateAllMembershipFromStripe() {
  const resMembership = await wixData
      .query("Membership")
      .limit(999)
      .find()

  resMembership.items.map(mem=>checkUserMembership(mem._id))
}

//planId is the itemId in the database
export async function createCheckoutLink(planId, email, currency="USD") {
  let toReturn = {
    status: "error",
    planId
  }

  try {
    const accountRes = await wixData.query("Account").eq("email", email).find({ suppressAuth: true });

    if( accountRes.length === 0 ) {
      toReturn.message = `No account found for email '${email}'.`
      throw new Error("Invalid account found in the database");
    }

    const account = accountRes.items[0];

    const hasActiveMember = await isMemberHaveActiveAccountById(account._id);
    if( hasActiveMember ) throw new Error(`Member with ${email} has an active membership?.`);

    const item = await wixData.get("PaymentPlans", planId);
    const planIdKey = STRIPE_MODE_IS_LIVE ? "stripePlanId": "stripePlanIdTest";
    if (!item || !item[planIdKey]) {
      toReturn.message = "Failed to find the plan id";
      throw new Error(toReturn.message)
    }

    //This is the priceId essentially
    const price = item[planIdKey];
    const quantity = 1;

    const reference = uuid();

    const sessionObj = {
      line_items: [ { price, quantity } ],
      mode: 'subscription',
      success_url: `${DOMAIN_URL}/checkout-redirect?client_reference_id=${reference}&view=success`,
      cancel_url: `${DOMAIN_URL}/checkout-redirect?client_reference_id=${reference}&view=failed`,
      customer_email: email,
      currency: currency.toLowerCase()
    }

    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create(sessionObj);
    
    const toInsert = {
      stripeCheckoutId: session.id,
      clientReferenceId: reference,
      status: STRIPE_PAYMENT_STATUS_WAITING,
      stripeSessionObj: sessionObj,
      account: account._id,
      plan: planId
    }

    const sessionRes = await wixData.insert("Session", toInsert, { suppressAuth: true });

    return session;

  }
  catch (e) {
    console.error(e);
    console.error(toReturn)
    return toReturn;
  }
}

export async function checkAndUpdateStripeSession(client_reference_id) {
  try {
    if( typeof client_reference_id !== "string" ) throw new Error("Invalid client reference id");

    const resSession = await wixData.query("Session").eq("clientReferenceId", client_reference_id).find({ suppressAuth: true });

    if( resSession.length === 0 ) throw new Error("Missing session to update");

    const session = resSession.items[0];
    
    const stripe = await getStripe();
    const stripeObj = await stripe.checkout.sessions.retrieve(session.stripeCheckoutId);
    await checkAndUpdateStripeCheckout(stripeObj);
    return true;
  }
  catch(e) {
    console.error(e);
    throw e;
  }
}


export async function hookAfterInsertStripeWebhook(item, context) {
  try {
    if( item.event !== "checkout.session.completed") {
      console.debug("Unhandle stripe webhook event : ", JSON.stringify(item));
      return;
    }

    const { rawData } = item;
    const stripeObj = rawData.data.object;

    await checkAndUpdateStripeCheckout(stripeObj);
  }
  catch(e) {
    console.error(e);
    throw e;
  }
}

export async function checkAndUpdateStripeCheckout(stripeObj) {
  const stripeCheckoutId = stripeObj.id;
  const stripePaymentStatusPaid = stripeObj.payment_status === "paid";
  const stripeStatusIncomplete = stripeObj.status === "open"
  if( stripeStatusIncomplete ) return console.error("Payment didn't complete! waiting for the user to complete the checkout but log the event!");

  const stripe = await getStripe();

  const resSession = await wixData.query("Session").eq("stripeCheckoutId", stripeCheckoutId).include("account").find({ suppressAuth: true });

  if( resSession.length === 0 ) {
    console.error({ status: 400, message: "Invalid stripe webhook error - Missing resSession length", stripeCheckoutId });
    return;
  }

  const session = resSession.items[0];
  const account = session.account;
  const accountId = account._id;
  const stripeCurr = stripeObj.currency ? stripeObj.currency.toUpperCase() : "USD";

  if( session.status !== STRIPE_PAYMENT_STATUS_WAITING ) {
    console.log("stripe session is already changed from waiting. No need to update")
    return true;
  }

  let toSaveMembership, toSaveAccount;

  if( stripePaymentStatusPaid ) {
    session.status = STRIPE_PAYMENT_STATUS_COMPLETED;
    
    const stripeSubscriptionId = stripeObj.subscription;
    // https://stripe.com/docs/api/subscriptions/object
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscriptionStartTimestamp = stripeSubscription.start_date * 1000;

    // Only one session can be active at a moment
    toSaveMembership = {
      session: session._id,
      account: accountId,
      currency: stripeCurr,
      _owner: account._owner, // Use the current member id

      membershipDate: new Date(subscriptionStartTimestamp), // stripe returns without millisec
      plan: session.plan,
      active: stripeSubscription.status === "active",
      subscriptionStartTimestamp,
      stripeSubscriptionId,
      stripeSubscription
    }
    
    const resOldMembership = await wixData.query("Membership").eq("account", accountId ).find({ suppressAuth: true });
    if( resOldMembership.length > 0 ) {
      const oldMembership = resOldMembership.items[0];

      toSaveMembership = {...oldMembership, ...toSaveMembership}
    }
    
    // If the stripe checkout currency is not the same as account config currency!
    if( stripeCurr !== account.currency ) toSaveAccount = { ...account, currency: stripeCurr }
    
  }
  else {
    session.status = STRIPE_PAYMENT_STATUS_FAILED;
  }
  
  const [
    resMembership,
    resAccount,
    resSessionNew
  ] = await Promise.all([
    toSaveMembership ? wixData.save("Membership", toSaveMembership, { suppressAuth: true } ) : Promise.resolve(),
    toSaveAccount ? wixData.save("Account", toSaveAccount, { suppressAuth: true } ) : Promise.resolve(),
    wixData.save("Session", session, { suppressAuth: true })
  ]);

  console.log(`Checkout successful : ${JSON.stringify({ resMembership, resAccount, resSessionNew })}`)
  
  return true;
}

export async function checkUserMembership(memId) {
  if( !memId ) throw new Error(`Failed to get membership id ${memId}`);
  const membership = await wixData.get("Membership", memId, { suppressAuth: true, });

  const {stripeSubscriptionId, plan} = membership;
  let planId = plan._id;
  const planIdKey = STRIPE_MODE_IS_LIVE ? "stripePlanId": "stripePlanIdTest"
  const stripePlanId = plan[planIdKey];
  const stripe = await getStripe();
  
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  if( stripeSubscription.items.data.length > 0 ) {
    const stripNewPlanId = stripeSubscription.items.data.price.id;

    // plan update
    if( stripePlanId !== stripNewPlanId ) {
      const resPaymentPlan = await wixData.query("PaymentPlans").eq("stripePlanId", stripNewPlanId).find();
      planId = resPaymentPlan.items[0]._id;
      // TODO:
      // Check if the plan type is a change from voice to voice-message
        // In that case, Update the twilio document based on the document
        // Create a new document and remove the old document
        // Update the document ID
        // Either delete or create a serice account number based on the account type change
    }
  }

  membership.plan = planId;
  membership.active = stripeSubscription.status === "active";
  membership.stripeSubscription = stripeSubscription;
  const updateMembership = await wixData.save("Membership", membership, { suppressAuth: true, });

  return updateMembership;
}

export async function createStripePortal() {
  const stripe = await getStripe();
  const resOldMembership = await wixData.query("Membership").find();

  const membership = resOldMembership.items[0];
  const customerId = membership?.stripeSubscription?.customer;
  if(!customerId) throw new Error(`Failed to get the stripe customer id!`);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    configuration: await findOrCreatePortal(),
    return_url: `${DOMAIN_URL}/dashboard?update_subscription=true`,
  });
  return session;
}

export async function createStripePortalUpdateUrl() {
  const stripe = await getStripe();
  const resOldMembership = await wixData.query("Membership").find();

  const membership = resOldMembership.items[0];
  const customerId = membership?.stripeSubscription?.customer;
  if(!customerId) throw new Error(`Failed to get the stripe customer id!`);

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    configuration: await findOrCreatePortal(),
    return_url: `${DOMAIN_URL}/dashboard?update_subscription=true`,
  });
  const { url } = portal;

  return `${url}/subscriptions/${membership.stripeSubscriptionId}/update`
}


async function findOrCreatePortal() {
  const stripe = await getStripe();
  const resConfiguration = await stripe.billingPortal.configurations.list({ limit: 1});
  const { data } = resConfiguration;

  let bpc;
  if( data.length === 0 ) {
    bpc = await stripe.billingPortal.configurations.create(STRIPE_PORTAL_CONFIG);
  }
  else {
    const itemId = data[0].id;
    bpc = await stripe.billingPortal.configurations.update( itemId, STRIPE_PORTAL_CONFIG ); 
  }

  return bpc.id;
}

// helper
let lastStripe;
async function getStripe() {
  if( lastStripe ) return lastStripe;
  const API_KEY = await getSecret(STRIPE_MODE_IS_LIVE ? STRIPE_API_KEY_LIVE : STRIPE_API_KEY_TEST);
  const stripe = new Stripe(API_KEY, STRIPE_OPTIONS);
  lastStripe = stripe;
  return stripe;
}
