import { hookAfterInsertStripeWebhook } from "backend/stripe";
import { hookBeforeInsertMembership, hookBeforeUpdateMembership } from "./membership";
import { CURRENCY_MAP_REGION } from "public/constant";

export function StripeWebhook_afterInsert(item, context) {
	return hookAfterInsertStripeWebhook(item, context);
}

export function membership_beforeInsert(item, context) {
	return hookBeforeInsertMembership(item, context);
}

export async function membership_beforeUpdate(item, context) {
	return hookBeforeUpdateMembership(item, context)
}

export function Account_beforeInsert(item, context) {
	item.fullName = [item.firstName || "", item.lastName || "" ].join(" ");
	item.region = CURRENCY_MAP_REGION[item.currency];
	return item;
}

export function Account_beforeUpdate(item, context) {
	item.fullName = [item.firstName || "", item.lastName || "" ].join(" ");
	item.region = CURRENCY_MAP_REGION[item.currency];
	return item;
}

export function CallLogs_beforeQuery(query, context) {
	if( context.userRole === "siteMember" ) {
		query =  query.eq("memberId", context.userId);
	}
	return query;
}
  
export function SmsLogs_beforeQuery(query, context) {
	if( context.userRole === "siteMember" ) {
		query =  query.eq("memberId1", context.userId);
	}
	return query;
}


export function Account_onFailure(error, context) {
	console.log({error, context})
}