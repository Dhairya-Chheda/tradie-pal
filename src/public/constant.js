// handle text error message
export const ONBOARDING_ERROR_OTP_INVALID = "Please enter a valid OTP and try again!";
export const ONBOARDING_ERROR_OTP_MISMATCH = "OTP entered didn't match!";
export const ONBOARDING_ERROR_OTP_NOT_SEND = "Something went wrong, during sending OTP.";
export const ONBOARDING_ERROR_FIELD_INVALID = "Please check the field(s) and try again!";


// brand color and images
export const BRAND_COLOR_PRIMARY = "#0B8C49";
export const BRAND_COLOR_ASCENT = "#808080";
export const BRAND_PROFILE_IMAGE = "https://static.wixstatic.com/media/d46ff4_38be8bed354f4ca7896a123b563e5d4c~mv2.png"

// maps
export const CURRENCY_MAP_REGION = {
  USD: "US",
  AUD: "AU"
}

export const REGION_MAP_NUMBER = {
  AU:  "+61 483 900 725",
  US: "+1 951 356 7431"
}

export const REGION_MAP_SERVICE = {
  AU: "ISfd3bf2ab07d3877362b25b68afdc2217",
  US: "IS8552feade558feecfea69e29f61f43ef"
}

// site setting
export const DOMAIN_URL = "https://tradiepal.ai";

// session storage key
export const CACHE_USER_ONBOARDING_STATE = "CACHE_USER_ONBOARDING_STATE";
export const CACHE_PRICE_SELECT = "CACHE_PRICE_SELECT";
export const CACHE_USER_CURRENCY = "CACHE_USER_CURRENCY";

// SECRET 
export const STRIPE_API_KEY_TEST = "STRIPE_API_KEY_TEST";
export const STRIPE_API_KEY_LIVE = "STRIPE_API_KEY_LIVE";
export const TWILIO_AUTH_TOKEN = "TWILIO_AUTH_TOKEN";
export const TWILIO_ACCOUNT_SID = "TWILIO_ACCOUNT_SID";

// stripe
export const STRIPE_MODE_IS_LIVE = false;
export const STRIPE_API_VERSION = "2022-11-15";
export const STRIPE_OPTIONS = {apiVersion: STRIPE_API_VERSION};

// ON BOARDING STATUS
export const ONBOARDING_STATUS_REGISTER = "REGISTER";
export const ONBOARDING_STATUS_PAYMENT = "PAYMENT";
export const ONBOARDING_STATUS_USER_INFO = "USER_INFO";
export const ONBOARDING_STATUS_VOICE = "VOICE";
export const ONBOARDING_STATUS_GREETING = "GREETING";
export const ONBOARDING_STATUS_BUSINESS_INFO = "BUSINESS_INFO";
export const ONBOARDING_STATUS_SPAM = "SPAM";
export const ONBOARDING_STATUS_COMPLETED = "COMPLETED";

// STRIPE PAYMENT STATUS
export const STRIPE_PAYMENT_STATUS_WAITING = "WAITING_FOR_PAYMENT";
export const STRIPE_PAYMENT_STATUS_COMPLETED = "PAYMENT_COMPLETED";
export const STRIPE_PAYMENT_STATUS_FAILED = "PAYMENT_FAILED";

// STRIPE PAYMENT
export const STRIPE_PORTAL_CONFIG = {
  features: {
    subscription_cancel: {enabled: true, mode: "at_period_end"},
    subscription_update: {enabled: true},
    payment_method_update: {enabled: true},
    invoice_history: {enabled: true},

    // disabled
    customer_update: { enabled: false },
    subscription_pause: {enabled: false},
  },

  business_profile: {
    privacy_policy_url: `${DOMAIN_URL}/dashboard`,
    terms_of_service_url: `${DOMAIN_URL}/dashboard`,
  }
}
