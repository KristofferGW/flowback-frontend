<script lang="ts">
	// @ts-ignore
	import { setTimeStamp, type Message, type PreviewMessage } from './interfaces';
	import Button from '$lib/Generic/Button.svelte';
	import { fetchRequest } from '$lib/FetchRequest';
	import type { User } from '$lib/User/interfaces';
	import { formatDate } from '$lib/Generic/DateFormatter';
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import TextArea from '$lib/Generic/TextArea.svelte';
	import Fa from 'svelte-fa/src/fa.svelte';
	import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
	import { faSmile } from '@fortawesome/free-solid-svg-icons/faSmile';
	import { statusMessageFormatter } from '$lib/Generic/StatusMessage';
	import StatusMessage from '$lib/Generic/StatusMessage.svelte';
	// import for emojis
	import { fly } from 'svelte/transition';
	import { each } from 'svelte/internal';

	// User Action variables
	let message: string = import.meta.env.VITE_MODE === 'DEV' ? 'a' : '',
		olderMessages: string,
		newerMessages: string,
		showEmoji = false,
		status: {
			message: any;
			success: boolean;
		};

	export let selectedChat: number | null,
		sendMessageToSocket: (
			message: string,
			selectedChat: number,
			selectedPage: 'direct' | 'group'
		) => Promise<boolean>,
		user: User,
		messages: Message[] = [],
		selectedPage: 'direct' | 'group',
		previewDirect: PreviewMessage[] = [],
		previewGroup: PreviewMessage[] = [],
		isLookingAtOlderMessages: boolean;

	// added variables for emoji modal
	let emojiSets = [
		{ type: "faces", minVal:128512, maxVal: 128580 },
		{ type: "faces2", minVal:129296, maxVal: 129327},
		{ type: "body", minVal:128066, maxVal: 128080},
		{ type: "animals", minVal:129408, maxVal: 129442},
		{ type: "transport", minVal:128640, maxVal: 128676},
		{ type: "misc", minVal:129494, maxVal: 129535},
	]; 

	let selectedSet = 0;
	// $: console.log(selectedSet)
	$: min = emojiSets[selectedSet].minVal;
	$: max = emojiSets[selectedSet].maxVal;

	let emojis: string[] = [];

	$: for (let i = min; i <= max; i++) {
		//console.log(String.fromCharCode(i))
		emojis = [...emojis, String.fromCodePoint(i)]
	}

	const clearEmojiMenu = () => emojis = []; 

	const chooseEmojiSet = (e: any) => {	
		selectedSet = Number(e.target.dataset.id);
		console.log('chooseEmojiSet was clicked');
		console.log('selectedSet', selectedSet);
		console.log('emojis', emojis);
		clearEmojiMenu();
	}

	let setIcons = [128512, 129313, 128074, 129417, 128664, 129504];

	// let modalOpen = false;

	const addEmoji = (e: any) => {
		console.log('addEmoji was clicked');
		message += e.target.textContent
	}

	$: (selectedPage || selectedChat) && getRecentMesseges();

	//When messages are recieved and not looking at history, scroll.
	$: messages &&
		(async () => {
			if (newerMessages) return;
			if (!browser) return;

			await setTimeout(() => {
				const d = document.querySelector('#chat-window');
				d?.scroll(0, 100000);
			}, 100);
		})();

	const getRecentMesseges = async () => {
		if (!selectedChat) return;

		const { res, json } = await fetchRequest(
			'GET',
			`chat/${selectedPage}/${selectedChat}?order_by=created_at_desc&limit=${25}`
		);

		if (res.ok) messages = json.results.reverse();

		//Temporary fix before json.next issue is fixed
		olderMessages = json.next;
		newerMessages = '';
	};

	//Runs when changing chats
	const postMessage = async () => {
		if (message.length === 0) return;
		if (!selectedChat) return;
		//If only spaces, return
		if (message.match(/^\s+$/)) return;

		//When sending, go to most recent messages
		if (newerMessages) getRecentMesseges();

		//Updates preview window to display recently typed chat message
		let previewMessage = (selectedPage === 'direct' ? previewDirect : previewGroup).find(
			(previewMessage) =>
				(selectedPage === 'direct' &&
					((previewMessage.user_id === user.id && previewMessage.target_id === selectedChat) ||
						(previewMessage.target_id === user.id && previewMessage.user_id === selectedChat))) ||
				(selectedPage === 'group' && previewMessage.group_id === selectedChat)
		);
		if (previewMessage) {
			previewMessage.message = message;
			previewMessage.created_at = new Date().toString();
		} else {
			//For brand new chats, create new preview message
			(selectedPage === 'direct' ? previewDirect : previewGroup).push({
				created_at: new Date().toString(),
				message,
				timestamp: new Date().toString(),
				username: user.username,
				user_id: user.id,
				target_id: selectedPage === 'direct' ? selectedChat : 0,
				target_username: user.username,
				profile_image: '',
				group_id: selectedPage === 'group' ? selectedChat : 0
			});
		}

		selectedPage === 'direct' ? (previewDirect = previewDirect) : (previewGroup = previewGroup);

		const didSend = await sendMessageToSocket(message, selectedChat, selectedPage);

		if (!didSend) status = { message: 'Could not send message', success: false };
		else
			messages.push({
				message,
				user: { username: user.username, id: user.id, profile_image: user.profile_image || '' },
				created_at: new Date().toString()
			});

		messages = messages;
		message = import.meta.env.VITE_MODE === 'DEV' ? message + 'a' : '';

		setTimeStamp(selectedChat, selectedPage);
	};

	const showOlderMessages = async () => {
		const { res, json } = await fetchRequest('GET', olderMessages);

		if (!res.ok) return;
		// nextMessagesAPI = json.next
		newerMessages = json.previous;
		olderMessages = json.next;

		messages = json.results.reverse();
	};

	$: {
		if (newerMessages) isLookingAtOlderMessages = true;
		else isLookingAtOlderMessages = false;
	}

</script>

{#if selectedChat !== null}
	<ul
		class="dark:bg-darkobject col-start-2 col-end-3 bg-white h-100% overflow-y-scroll overflow-x-hidden break-all"
		id="chat-window"
	>
		{#if messages.length === 0}
			<span class="self-center">{'Chat is currently empty, maybe say hello?'}</span>
		{/if}
		{#if olderMessages}
			<li class="text-center mt-6 mb-6">
				<Button action={showOlderMessages}>{$_('Show older messages')}</Button>
			</li>
		{/if}
		<!-- <div class="absolute bottom-0 right-0">{$_("New messages")}</div> -->
		{#each messages as message}
			<li class="p-3 hover:bg-gray-200">
				<span>{message.user?.username || message.username}</span>
				<span class="text-[14px] text-gray-400 ml-3">{formatDate(message.created_at)}</span>
				<p>{message.message}</p>
			</li>
		{/each}
		{#if newerMessages}
			<li class="text-center mt-6 mb-6">
				<Button
					action={async () => {
						const { res, json } = await fetchRequest('GET', newerMessages);

						olderMessages = json.next;
						newerMessages = json.previous;

						messages = json.results.reverse();
					}}
					buttonStyle="secondary">{$_('Show earlier messages')}</Button
				>
			</li>
		{/if}
		<StatusMessage bind:status disableSuccess />
	</ul>
	<!-- <div class:invisible={!showEmoji} class="fixed">
	</div> -->
	<div class="dark:bg-darkobject col-start-2 col-end-3 bg-white shadow rounded p-2 w-full">
		<!-- Here the user writes a message to be sent -->
		<form
			class="w-full flex gap-2 md:mt-2 lg:mt-5 xl:mt-14 items-center relative"
			on:submit|preventDefault={postMessage}
		>
			<TextArea
				autofocus
				label=""
				onKeyPress={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						postMessage();
						e.preventDefault();
					}
				}}
				required
				max={3000}
				bind:value={message}
				Class="w-full"
			/>

			<div class="relative">
				{#if import.meta.env.VITE_MODE === 'DEV'}
					<Button
						action={() => (showEmoji = !showEmoji)}
						class="rounded-full pl-3 pr-3 pt-3 pb-3 h-1/2 relative z-10"
					>
						<Fa icon={faSmile} />
					</Button>
				{/if}
			
				{#if showEmoji}
					
					<div
						id="icons"
						class="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-md flex items-center"
					>
					<header>
						{#each setIcons as icon, i}
							<!-- <div data-id={i} on:click={chooseEmojiSet} class="cursor-pointer"> -->
							<div data-id={i} on:click={chooseEmojiSet} class="cursor-pointer">	
								{String.fromCodePoint(icon)}
							</div>
						{/each}
						<div id="closer-icon" on:click={() => showEmoji = false}>X</div>
					</header>
					</div>
						{#each emojis as emoji}
							<span on:click={addEmoji}>{emoji}</span>
						{/each}
				{/if}
			</div>
			

			<Button type="submit" Class="rounded-full pl-3 pr-3 pt-3 pb-3 h-1/2 z-10 relative"
				><Fa icon={faPaperPlane} /></Button
			>

			<!-- {#if showEmoji}
				<div
					id="icons"
					class="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-md flex items-center justify-center"
				>
					<header>
						{#each setIcons as icon, i}
							<div data-id={i} on:click={chooseEmojiSet} class="cursor-pointer">{String.fromCodePoint(icon)}</div>
						{/each}
					</header>
				</div>
			{/if} -->
		</form>
	</div>
{:else}
	<div>{("No chat selected")}</div>
{/if}
