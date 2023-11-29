import {
  createCheckoutLink as createCheckoutLinkBackend,
  checkAndUpdateStripeSession as checkAndUpdateStripeSessionBackend,
  createStripePortal as createStripePortalBackend,
  createStripePortalUpdateUrl as createStripePortalUpdateUrlBackend,
  checkUserMembership as checkUserMembershipBackend
} from "backend/stripe";
import wixData from "wix-data";
import wixUsersBackend from 'wix-users-backend';
import {Permissions, webMethod} from "wix-web-module";

export const createCheckoutLink = webMethod(Permissions.SiteMember, (planId, currency) => handleCreateCheckoutLink(planId, currency));
export const checkAndUpdateStripeSession = webMethod(Permissions.SiteMember, (client_reference_id) => handleCheckAndUpdateStripeSession(client_reference_id));
export const createStripePortal = webMethod(Permissions.SiteMember, () => handleCreateStripePortal());
export const createStripePortalUpdateUrl = webMethod(Permissions.SiteMember, () => handleCreateStripePortalUpdateUrl());
export const checkMembership = webMethod(Permissions.SiteMember, () => handleCheckUserMembership())

export async function handleCreateCheckoutLink(planId, currency) {
  const email = await wixUsersBackend.currentUser.getEmail();
  return createCheckoutLinkBackend(planId, email, currency);
}

export async function handleCheckAndUpdateStripeSession(client_reference_id) {
  return checkAndUpdateStripeSessionBackend(client_reference_id);
}

export async function handleCreateStripePortal() {
  return createStripePortalBackend()
}
export async function handleCreateStripePortalUpdateUrl() {
  return createStripePortalUpdateUrlBackend()
}


export async function handleCheckUserMembership() {
  const resMembership = await wixData.query("Membership").find();
  const membership = resMembership.items[0];
  checkUserMembershipBackend(membership.id);
}
