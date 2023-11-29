import { fetch } from 'wix-fetch';
import { session } from "wix-storage";
import { REGION_MAP_NUMBER } from './constant';

export function sleep(ms = 500) {
  return new Promise(res=>setTimeout(res, ms))
}

/**
 * Return "AUS" Australian user, if not "USD"
 * @returns {Promise<"USD"|"AUD">}
 */
export async function getCurrency() {
  const res = await getFetch("https://cloudflare.com/cdn-cgi/trace", "text");
  const country = /loc=(?<country>\w+)/.exec(res).groups.country;
  
  if( country === "AU" ) return "AUD";
  
  return "USD"
}

function getFetch(url, type="json") {
  return fetch(url).then(r=>r[type]())
}

export function SESSION_RESTORE_JSON(KEY, toReturn = null) {
  try {
    const restored = session.getItem(KEY)
    if( !restored ) return toReturn;

    const restored_json = JSON.parse(restored);
    return restored_json;
  }
  catch(e) {
    console.error(`Failed to restored from session : ${KEY}`)
    return toReturn;
  }
}

////////////////////////////////////////////////
/// NOTE: BUG USING THIS FUNCTION IN BACKEND ///
////////////////////////////////////////////////
/**
 * Should have an account object with membership
 * @param {import("./types-model").ModelMembership} membership 
 * @returns {string}
 */
export function getServiceNumberFromMemsbership(membership) {
  if( !membership || !membership._id || !membership.account) throw new Error(`Invalid params passed to get service number! ${membership}`)
  if( typeof membership.account === "string" ) throw new Error("Membership.account is string. Should be a object");
  
  if( !membership.active ) return "N/A";
  if( membership.plan.type === "voice" ) {
    return REGION_MAP_NUMBER[membership.account.region];
  }
  else if ( membership.plan.type === "voice-message" ) {
    return membership.ServiceNumber.phone
  }
  return "N/A";
} 
