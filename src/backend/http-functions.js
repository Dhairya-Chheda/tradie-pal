import wixData from "wix-data";
import { ok, badRequest } from "wix-http-functions";

export async function get_stripe_webhook(request) {
  try {
    return json_ok({ status: "ok! webhook is working" });
  } catch (error) {
    return badRequest({ body: { error } });
  }
}

export async function post_stripe_webhook(request) {
  try {
    let body = await request.body.json();
    const toInsert = {
      event: body.type,
      rawData: body
    }
    
    const resHook = await wixData.insert("StripeWebhook", toInsert, { suppressAuth: true} );

    return json_ok({ status: "ok", id: resHook._id});
  } catch (error) {
    return badRequest({ body: { error } });
  }
}

function json_ok(body) {
  return ok({
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}
