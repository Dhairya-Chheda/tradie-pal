// import wix module
import wixWindowFrontend from 'wix-window-frontend';
import { session, local } from 'wix-storage-frontend';
import wixLocation, { query } from 'wix-location-frontend';
import wixUsers from 'wix-users';
import wixData from "wix-data";

// import backend module
import { sendSMS, veryifyCode } from "backend/twilio/sms.web";
import { isMemberHaveActiveAccountById } from "backend/membership.web";
import { createCheckoutLink } from "backend/stripe.web";

// import utils
import { sleep } from "public/utils";

// import constant
import {
	CACHE_USER_ONBOARDING_STATE,
	CACHE_USER_CURRENCY,

	ONBOARDING_STATUS_REGISTER,
	ONBOARDING_STATUS_PAYMENT,
	ONBOARDING_STATUS_USER_INFO,
	ONBOARDING_STATUS_VOICE,
	ONBOARDING_STATUS_GREETING,
	ONBOARDING_STATUS_BUSINESS_INFO,
	ONBOARDING_STATUS_SPAM,
	ONBOARDING_STATUS_COMPLETED,


	ONBOARDING_ERROR_OTP_INVALID,
	ONBOARDING_ERROR_OTP_MISMATCH,
	ONBOARDING_ERROR_OTP_NOT_SEND,
	ONBOARDING_ERROR_FIELD_INVALID,

	BRAND_COLOR_PRIMARY
} from "public/constant";
import { handleOnBoardingCompleted } from 'backend/twilio/onboarding.web.js';


const STATE_BOX_ID = /** @type {const} */ ({
	LOADING: "LOADING",
	PAYMENT: "PAYMENT",
	USERINFO: "USERINFO",
	VOICE: "VOICE",
	GREETING: "GREETING",
	BUSINESSINFO: "BUSINESSINFO",
	SPAM: "SPAM"
});

// !CAUTION: DON'T CHANGE THE ORDER OF THE STATE!
const ONBOARDING_STATUS = /** @type {const} */ ([
	ONBOARDING_STATUS_REGISTER,
	ONBOARDING_STATUS_PAYMENT,
	ONBOARDING_STATUS_USER_INFO,
	ONBOARDING_STATUS_VOICE,
	ONBOARDING_STATUS_GREETING,
	ONBOARDING_STATUS_BUSINESS_INFO,
	ONBOARDING_STATUS_SPAM,
	ONBOARDING_STATUS_COMPLETED,
])

// Update account variable as state progress
let account;

$w.onReady(async function () {
	try {
		let email = await wixUsers.currentUser.getEmail();
		const resAccount = await wixData.query("Account").eq("email", email).find();
		account = resAccount.items?.[0];
		console.log("account", account);

		if( !account ) await initOnBoarding();
		console.log("account 1", account);
		
		session.setItem(CACHE_USER_ONBOARDING_STATE, account.state)
		await initRegisterState();
		renderState();
	}
	catch(e) {
		console.error("Something went wrong", e);
		wixLocation.to("/")
	}
});

// #region init
// Create a new user in the account database
async function initOnBoarding() {
	const state = "REGISTER";
	
	console.log("to inseting....")
    const currency = local.getItem(CACHE_USER_CURRENCY) || "USD";
	const toInsert = { state, email: await wixUsers.currentUser.getEmail() }

	if( currency ) toInsert.currency = currency;
	account = await wixData.insert("Account", toInsert);
	console.log("inseting....")
	session.setItem(CACHE_USER_ONBOARDING_STATE, state);
	return;	
}

async function initRegisterState() {
	let state = account.state;
	if( !state || state === ONBOARDING_STATUS_REGISTER ) {
		saveAndNextState();
	}
}
// #endregion init
// #region payment
async function initPaymentState() {
	try {
		// Create a checkout url and link and enable the payment button
		$w("#multiStateBox1").changeState(STATE_BOX_ID.PAYMENT);

		if( await isMemberHaveActiveAccountById(account._id) ) {
			saveAndNextState();
			return;
		}

		const planId = query.plan
		if( !planId ) wixLocation.to("/?plan-highlight=true");

		const currency = local.getItem(CACHE_USER_CURRENCY) || "USD";

		const checkout = await createCheckoutLink(planId, currency);
		if( !checkout || !checkout.url ) throw new Error("Failed to get the checkout url!");
		$w("#btnPay").enable();
		$w("#btnPay").target = "_self";
		$w("#btnPay").link = checkout.url;
	}
	catch(e) {
		console.error(e);
		wixWindowFrontend.openLightbox("ERROR");
	}
}
// #endregion payment
// #region userInfo
function initUserInfoState() {
	$w("#multiStateBox1").changeState(STATE_BOX_ID.USERINFO)
	// TODO: CHECK THE FLAG AND STRIPS THE COUNTRY CODE
	$w("#btnSendOtp").onClick(handleSendOtpClick);
	$w("#inOtp").onInput(()=>{
		if( $w("#inOtp").valid ) {
			$w("#btnSendOtp").enable();
		}
		else {
			$w("#btnSendOtp").disable();
		}
	});

	$w("#btnResend").onClick(handleResendClick);
}
/**@type {"USER_INFO" | "VERIFY_OTP"} */
let STATE = "USER_INFO"; // "VERIFY_OTP"

async function handleSendOtpClick() {	
	$w("#btnSendOtp").disable();

	if( STATE === "USER_INFO" ) {
		const isValid = await validateUserInfo();
		if( !isValid ) return;
		$w("#inFirstName").disable();
		$w("#inLastName").disable();
		$w("#inPhone").disable();
		
		STATE = "VERIFY_OTP";
		updateVerifyOtpState();
	}
	else if( STATE === "VERIFY_OTP" ) {
		if( !$w("#inOtp").valid ) {
			showError(ONBOARDING_ERROR_OTP_INVALID);
			$w("#inOtp").updateValidityIndication();
			$w("#btnSendOtp").enable();
			return;
		}
		
		const matched = await veryifyCode($w("#inPhone").value, $w("#inOtp").value);

		if( !matched || matched.status !== "approved" ) {
			showError(ONBOARDING_ERROR_OTP_MISMATCH);
			$w("#btnSendOtp").enable();
			return;
		}
		account.phoneVerified = true;
		account.firstName = $w("#inFirstName").value;
		account.lastName = $w("#inLastName").value;
		account.phone = $w("#inPhone").value;
		saveAndNextState();
	}
}

async function validateUserInfo() {
	try {
		$w("#textError").hide();
		$w("#inFirstName").updateValidityIndication();
		$w("#inLastName").updateValidityIndication();
		$w("#inPhone").updateValidityIndication();
	
		if( !$w("#inFirstName").valid ) throw new Error("First name is not valid")
		if( !$w("#inLastName").valid ) throw new Error("Last name is not valid")
		if( !$w("#inPhone").valid ) throw new Error("Phone number is not valid")
	
		return true;
	}
	catch(e) {
		console.error(e);
		showError(ONBOARDING_ERROR_FIELD_INVALID)
		return false;
	}
}

async function showError(message="Something went wrong!") {
	$w("#textError").text = message;
	$w("#textError").show();
	await sleep(5000);
	$w("#textError").hide();
}

async function updateVerifyOtpState() {
	try {
		const codeSend = await sendSMS($w("#inPhone").value);
		if( codeSend && codeSend.status !== "pending" ) throw new Error(codeSend);
		$w("#inOtp").show();

		$w("#btnSendOtp").disable();
		$w("#btnSendOtp").label = "Verify OTP";
		
		$w("#btnResend").show();
		$w("#btnResend").disable();

		startOtpTimer();
	}
	catch(e) {
		console.error(e);
		showError(ONBOARDING_ERROR_OTP_NOT_SEND);
	}
}

let intervalResendTimerId;
function handleResendClick() {
	$w("#inOtp").value = null;
	$w("#inOtp").resetValidityIndication();
	updateVerifyOtpState()
}


function startOtpTimer() {
	if(intervalResendTimerId) clearInterval(intervalResendTimerId);
	const TIMEOUT_IN_MS = 10 * 60 * 1000;
	const ALLOW_RESEND_OTP_AT = 0.1 * 60 * 1000;

	let now = new Date();
	let timeoutAt = new Date( now.getTime() + TIMEOUT_IN_MS);
	
	setTimeout(()=>{
		$w("#btnResend").enable();
	}, ALLOW_RESEND_OTP_AT)

	intervalResendTimerId = setInterval(()=>{
  
	  now = new Date();
	  let diff = timeoutAt.getTime() - now.getTime();
	  if( diff <= 0 ) {
		clearInterval(intervalResendTimerId);
		return;
	  }
	  
	  const m = "0" + Math.floor(diff / (60 * 1000));
	  const s = "0" + Math.floor(diff / 1000 % 60);
	  const mm = m.slice(-2);
	  const ss = s.slice(-2);
	  $w("#btnResend").label = `Resend ${mm}:${ss}`;
	}, 500)

}
// #endregion userInfo
// #region voice
let DEFAULT_TEXT_HTML;
async function initVoiceState() {
	await $w("#dsAgent").onReadyAsync()
	$w("#multiStateBox1").changeState(STATE_BOX_ID.VOICE);

	DEFAULT_TEXT_HTML = $w("#textAgentName").html;
	setAgent(0);

	$w("#repeaterAgent").forEachItem(($item, itemData, index)=>{
		$item("#boxContainer").onClick(()=>{
			setAgent(index);
		});
		$item("#textAgentName").text = itemData.title;
	});

	$w("#btnPlayAgent").onClick(()=>{
		$w("#audioPlayerAgent").togglePlay();
	})

	$w("#audioPlayerAgent").onPlay(()=>{
		$w("#btnPlayAgent").label =	$w("#btnPlayAgent").label.replace("Listen", "Listening");
	});
	
	$w("#audioPlayerAgent").onPause(()=>{
		$w("#btnPlayAgent").label =	$w("#btnPlayAgent").label.replace("Listening", "Listen");
	});

	$w("#audioPlayerAgent").onEnded(()=>{
		$w("#btnPlayAgent").label =	$w("#btnPlayAgent").label.replace("Listening", "Listen");
	});

	$w("#btnAgentContinue").onClick(async ()=>{
		/**@type {import('wix-dataset').Dataset} */
		const $dsAgent = $w("#dsAgent");
		account.agent = $dsAgent.getCurrentItem()._id;
		saveAndNextState();
	});
}

async function setAgent(selIndex) {
	$w("#repeaterAgent").forEachItem(async ($item, itemData, index)=>{
		if( index === selIndex ) {
			$item("#textAgentName").html = DEFAULT_TEXT_HTML.replace("{agentName}", `<span style="color:${BRAND_COLOR_PRIMARY}">{agentName}</span>`)
			$item("#textAgentName").text = itemData.title;
			$item("#imgVoice").hide();
			
			$w("#btnAgentContinue").label = `Choose ${itemData.title}`;
			// Update Audio
			$w("#btnPlayAgent").label = `Listen to ${itemData.title}`;
			await $w("#dsAgent").setCurrentItemIndex(index);
			await sleep()
			$w("#audioPlayerAgent").seek(0);
			$w("#audioPlayerAgent").stop()
			

		}
		else {
			$item("#textAgentName").html = DEFAULT_TEXT_HTML;
			$item("#textAgentName").text = itemData.title;
			$item("#imgVoice").show();
		}
	});
}
// #endregion
// #region greeting
function initGreetingState() {
	$w("#multiStateBox1").changeState(STATE_BOX_ID.GREETING);

	let placeHolder = $w("#textBoxGreeting").placeholder;
	placeHolder = placeHolder.replace("{firstName}", account.firstName);
	placeHolder = placeHolder.replace("{lastName}", account.lastName);
	placeHolder = placeHolder.replace(/"|”/g, "").trim()
	$w("#textBoxGreeting").value = placeHolder;

	$w("#btnContinueGreeting").onClick(()=>{
		$w("#textBoxGreeting").updateValidityIndication();
		if( $w("#textBoxGreeting").valid ) {
			account.greeting = $w("#textBoxGreeting").value;
			saveAndNextState();
		}
	})
}
// #endregion greeting
// #region businessInfo
function initBusinessInfo() {
	$w("#multiStateBox1").changeState(STATE_BOX_ID.BUSINESSINFO);

	$w("#btnContinueBusinessInfo").onClick(()=>{
		$w("#textBoxBusinessInfo").updateValidityIndication();
		if( $w("#textBoxBusinessInfo").valid ) {
			account.businessInfo = $w("#textBoxBusinessInfo").value;
			saveAndNextState();
		}
	})
}
// #endregion businessInfo
// #region spam
function initSpam() {
	$w("#multiStateBox1").changeState(STATE_BOX_ID.SPAM);

	$w("#btnContinueSpam").onClick(()=>{
		account.spam = $w("#switchSpam").checked;
		initMarkComplete();
	});

}
// #endregion spam
// #region complete
async function initMarkComplete() {
	if( account.onBoardingCompleted ) { 
		wixLocation.to("/dashboard");
		return;
	};

	$w("#multiStateBox1").changeState(STATE_BOX_ID.LOADING);
	
	try {
		const twilioOnBoardingComplete = await handleOnBoardingCompleted(account._id);
		if( !twilioOnBoardingComplete ) throw new Error("Failed to onBoarding via twilio as admin. Should return true")
		account.onBoardingCompleted = true;
		account.state = ONBOARDING_STATUS_COMPLETED;
		account = await wixData.update("Account", account );
		session.setItem(CACHE_USER_ONBOARDING_STATE, account.state);
		wixLocation.to("/dashboard");
	}
	catch(e) {
		console.error(e);
		wixWindowFrontend.openLightbox("ERROR");
	}
}
// #endregion complete
// #region helper
/**
 * 
 * @param {typeof ONBOARDING_STATUS[number]} state 
 */
async function checkAndUpdateState(state) {
	$w("#multiStateBox1").changeState(STATE_BOX_ID.LOADING);
	if( !validOnBoarding(state) ) {
		wixWindowFrontend.openLightbox("ERROR")
		throw new Error(`Invalid state : ${state}`);
	}
	account.state = state;
	console.log("Updating state: ", state, account);
	account = await wixData.update("Account", account );
	session.setItem(CACHE_USER_ONBOARDING_STATE, account.state);
	renderState();
}

async function saveAndNextState() {
	const $CACHE_USER_ONBOARDING_STATE = session.getItem(CACHE_USER_ONBOARDING_STATE);
	const index = ONBOARDING_STATUS.findIndex(item=> item === $CACHE_USER_ONBOARDING_STATE );
	if( index === -1 ) {
		session.removeItem(CACHE_USER_ONBOARDING_STATE);
		throw new Error(`Failed to find the current state: ${$CACHE_USER_ONBOARDING_STATE}`);
	}
	checkAndUpdateState(ONBOARDING_STATUS[index+1]);
}


async function renderState() {
	const $CACHE_USER_ONBOARDING_STATE = session.getItem(CACHE_USER_ONBOARDING_STATE);
	console.log("Rendering state: ", $CACHE_USER_ONBOARDING_STATE)

	switch($CACHE_USER_ONBOARDING_STATE) {
		case ONBOARDING_STATUS_REGISTER:
			break;
		case ONBOARDING_STATUS_PAYMENT:
			initPaymentState();
			break;
		case ONBOARDING_STATUS_USER_INFO:
			initUserInfoState();
			break;
		case ONBOARDING_STATUS_VOICE:
			initVoiceState();
			break;
		case ONBOARDING_STATUS_GREETING:
			initGreetingState();
			break;
		case ONBOARDING_STATUS_BUSINESS_INFO:
			initBusinessInfo();
			break;
		case ONBOARDING_STATUS_SPAM:
			initSpam();
			break;
		case ONBOARDING_STATUS_COMPLETED:
			initMarkComplete();
			break;
		default:
			console.log("PANIC: INVALID STATE ID FONUND", $CACHE_USER_ONBOARDING_STATE);
			wixWindowFrontend.openLightbox("ERROR")
	}
}

function validOnBoarding(state) {
	return [
		ONBOARDING_STATUS_REGISTER,
		ONBOARDING_STATUS_PAYMENT,
		ONBOARDING_STATUS_USER_INFO,
		ONBOARDING_STATUS_VOICE,
		ONBOARDING_STATUS_GREETING,
		ONBOARDING_STATUS_BUSINESS_INFO,
		ONBOARDING_STATUS_SPAM,
		ONBOARDING_STATUS_COMPLETED,
	].includes(state);
}

// #endregion helper