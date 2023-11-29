import wixWindow from "wix-window";
import FetchData from "public/fetch";
import { BRAND_COLOR_PRIMARY } from "public/constant";
import { sleep } from "public/utils";

$w.onReady(initVoiceState);

let DEFAULT_TEXT_HTML;
async function initVoiceState() {
	await $w("#dsAgentL").onReadyAsync();
    const fetch = new FetchData();
    const account = await fetch.getAccount();
    const agentId = account.agent && account.agent._id;

	DEFAULT_TEXT_HTML = $w("#textAgentNameL").html;
	setAgentById(agentId);

	$w("#repeaterAgentL").forEachItem(($item, itemData, index)=>{
		$item("#boxContainerL").onClick(()=>{
			setAgentById(itemData._id);
		});
		$item("#textAgentNameL").text = itemData.title;
	});

	$w("#btnPlayAgentL").onClick(()=>{
		$w("#audioPlayerAgent1").togglePlay();
	})

	$w("#audioPlayerAgent1").onPlay(()=>{
		$w("#btnPlayAgentL").label =	$w("#btnPlayAgentL").label.replace("Listen", "Listening");
	});
	
	$w("#audioPlayerAgent1").onPause(()=>{
		$w("#btnPlayAgentL").label =	$w("#btnPlayAgentL").label.replace("Listening", "Listen");
	});

	$w("#audioPlayerAgent1").onEnded(()=>{
		$w("#btnPlayAgentL").label =	$w("#btnPlayAgentL").label.replace("Listening", "Listen");
	});

	$w("#btnAgentContinueL").onClick(async ()=>{
		/**@type {import('wix-dataset').Dataset} */
		const $dsAgent = $w("#dsAgentL");
		const agentId = $dsAgent.getCurrentItem()._id;
		wixWindow.lightbox.close(agentId);
	});
}

async function setAgentById(agentId) {
	$w("#repeaterAgentL").forEachItem(async ($item, itemData, index)=>{
		if( itemData._id === agentId ) {
			$item("#textAgentNameL").html = DEFAULT_TEXT_HTML.replace("{agentName}", `<span style="color:${BRAND_COLOR_PRIMARY}">{agentName}</span>`)
			$item("#textAgentNameL").text = itemData.title;
			$item("#imgVoiceL").hide();
			
			$w("#btnAgentContinueL").label = `Choose ${itemData.title}`;
			// Update Audio
			$w("#btnPlayAgentL").label = `Listen to ${itemData.title}`;
			await $w("#dsAgentL").setCurrentItemIndex(index);
			await sleep()
			$w("#audioPlayerAgent1").seek(0);
			$w("#audioPlayerAgent1").stop()
			

		}
		else {
			$item("#textAgentNameL").html = DEFAULT_TEXT_HTML;
			$item("#textAgentNameL").text = itemData.title;
			$item("#imgVoiceL").show();
		}
	});
}