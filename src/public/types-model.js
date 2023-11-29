
/**
 * @typedef {object} ModelBase
 * @property {string} _id
 * @property {string} _updatedDate
 * @property {string} _createdDate
 * @property {string} _owner
 */

/**
 * @typedef {Object} ModelAccountRaw
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} fullName
 * @property {"REGISTER"|"PAYMENT"|"USER_INFO"|"VOICE"|"GREETING"|"BUSINESS_INFO"|"SPAM"|"COMPLETED"} state
 * @property {string} phone
 * @property {ModelVoiceAgent} agent
 * @property {boolean} spam
 * @property {string} greeting
 * @property {string} businessInfo
 * @property {"USD" |"AUD"} currency
 * @property {boolean} phoneVerified
 * @property {boolean} onBoardingCompleted
 * @property {"US" |"AU"} region
 * @property {string} profile
 */

/**
 * @typedef {Object} ModelMembershipRaw
 * @property {ModelAccount} account
 * @property {boolean} active
 * @property {"USD" | "AUD"} currency
 * @property {ModelPlan} plan
 * @property {ModelSessionRaw} session
 * @property {string} membership
 * @property {string} twillioDocumentId
 * @property {ModelServiceNumber} ServiceNumber
 * @property {Date} membershipDate
 */

/**
 * @typedef {Object} ModelVoiceAgentRaw
 * @property {string} title
 * @property {string} default
 * @property {string} selected
 * @property {string} audio
 * @property {string} description
 */

/**
 * @typedef {Object} ModelPlanRaw
 * @property {string} title
 * @property {string} titleTier
 * @property {"voice" |"voice-message"} type
 * @property {"Silver" | "Gold" | "Platinum"} tier
 * @property {number} amount
 * @property {number} amountAud
 * @property {string} stripePlanId
 * @property {string} stripePlanIdTest
 * @property {"USD"|"AUD"} currency
 * @property {string} paymentLink
 * @property {string} description
 */

/**
 * @typedef {Object} ModelSessionRaw
 * @property {string} clientReferenceId
 * @property {ModelAccount} account
 * @property {string} stripeCheckoutId
 * @property {"PAYMENT_COMPLETED" | "WAITING_FOR_PAYMENT"} status
 * @property {ModelPlan} plan
 */

/**
 * @typedef {Object} ModelServiceNumberRaw
 * @property {ModelAccount} account
 * @property {ModelMembership} membership
 * @property {string} phone
 * @property {Object} raw
 * @property {string} sid
 */

/**
 * @typedef {Object} ModelCallLogRaw
 * @property {string} fromNumber
 * @property {string} toNumber
 * @property {string} name
 * @property {string} callReason
 * @property {string[]} callTranscript
 * @property {string} memberId
 * @property {"spam" | "business" | "personal"} callType
 */

/**
 * @typedef {Object} ModelSmsLogsRaw
 * @property {number} conversationTime
 * @property {string} fromNumber
 * @property {string} toNumber
 * @property {string} name
 * @property {string} smsReason
 * @property {"spam" | "business" | "personal"} smsCategory
 * @property {string[]} smsTranscript
 * @property {string} memberId
 */

/**
 * @typedef {ModelBase & ModelAccountRaw} ModelAccount
 * @typedef {ModelBase & ModelMembershipRaw} ModelMembership
 * @typedef {ModelBase & ModelVoiceAgentRaw} ModelVoiceAgent
 * @typedef {ModelBase & ModelPlanRaw} ModelPlan
 * @typedef {ModelBase & ModelSessionRaw} ModelSession
 * @typedef {ModelBase & ModelServiceNumberRaw} ModelServiceNumber
 * @typedef {ModelBase & ModelCallLogRaw} ModelCallLog
 * @typedef {ModelBase & ModelSmsLogsRaw} ModelSmsLogs
 */



/**@type {ModelAccount} */
export let ModelAccount;
/**@type {ModelMembership} */
export let ModelMembership;
/**@type {ModelVoiceAgent} */
export let ModelVoiceAgent;
/**@type {ModelPlan} */
export let ModelPlan;
/**@type {ModelSession} */
export let ModelSession;
/**@type {ModelServiceNumber} */
export let ModelServiceNumber;
/**@type {ModelCallLog} */
export let ModelCallLog;
/**@type {ModelSmsLogs} */
export let ModelSmsLogs;

/**
 * @template T
 * @typedef {Object} WixDataQueryResponse<T>
 * @property {T[]} items
 * @property {()=>boolean} hasNext
 * @property {()=>boolean} hasPrev
 * @property {number} length
 */

/**@type {WixDataQueryResponse<ModelAccount>} */
export let resModelAccount;
/**@type {WixDataQueryResponse<ModelMembership>} */
export let resModelMembership;
/**@type {WixDataQueryResponse<ModelVoiceAgent>} */
export let resModelVoiceAgent;
/**@type {WixDataQueryResponse<ModelPlan>} */
export let resModelPlan;
/**@type {WixDataQueryResponse<ModelSession>} */
export let resModelSession;
/**@type {WixDataQueryResponse<ModelServiceNumber>} */
export let resModelServiceNumber;
/**@type {WixDataQueryResponse<ModelCallLog>} */
export let resModelCallLog;
/**@type {WixDataQueryResponse<ModelSmsLogs>} */
export let resModelSmsLogs;
