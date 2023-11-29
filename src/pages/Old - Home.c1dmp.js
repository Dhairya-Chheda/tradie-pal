import wixData from "wix-data";

import { session } from 'wix-storage';
import { CACHE_PRICE_SELECT } from "public/constant";
import wixLocation, { query } from "wix-location-frontend";

$w.onReady(function () {
    try {
        // if (!("product" in query) ) return wixLocation.to("/product")
        
        // const { product } = query;
        // if (!product || !["voice-message", "voice"].includes(product)) {
        //     console.debug("Invalid product type");
        //     return wixLocation.to("/product");
        // }
        filterDs();

        $w("#dropCurrency").onChange(filterDs);
        
        $w("#btnPay").onClick(async e=>{
            const $item = $w.at(e.context);
            const item = await $item("#dsPricing").getCurrentItem();
            const currency = $w("#dropCurrency").value;
            session.setItem(CACHE_PRICE_SELECT, item._id);
            wixLocation.to(`/on-boarding?currency=${currency}`);
        });
    }
    catch(e) {
        console.error(e)
    }
});

async function filterDs() {
    await $w("#dsPricing").onReadyAsync();
 
    $w("#sectionLoading").expand();
    $w("#sectionRepeater").collapse();
    // const { product } = query;
    await $w("#dsPricing").setFilter(wixData.filter().eq("currency", $w("#dropCurrency").value))
    $w("#sectionLoading").collapse();
    $w("#sectionRepeater").expand();
}
