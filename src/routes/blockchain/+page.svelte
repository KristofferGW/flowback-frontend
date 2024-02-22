<script>
	import Layout from '$lib/Generic/Layout.svelte';
	//@ts-ignore
	import { test } from '$lib/Blockchain/javascript/test.ts';
	import { newWallet } from '$lib/Blockchain/javascript/newWallet';
	import { becomeMemberOfGroup } from '$lib/Blockchain/javascript/delegationsBlockchain';
	import Button from '$lib/Generic/Button.svelte';
	import { onMount } from 'svelte';
	import Create from '$lib/Group/Permissions/Create.svelte';
	import Modal from '$lib/Generic/Modal.svelte';

	let walletInfo = null;

	async function createWallet() {
		const wallet = await newWallet();
		walletInfo = {
			privateKey: "0xfa536aa76e0a1c47e4304591d20f50014be9702c86d10b9f9505dc6100c588a3",
			publicKey: "0x24FE6b26682175b076586AE86F0e731A31980Bd7",
		};
		console.log('Wallet address: ', wallet.address);
		console.log('Wallet PK: ', wallet.privateKey);
	}

	// onMount(() => {
	// 	test();
	// })
</script>

<Layout>
	<div class="p-6">
		<Button action={createWallet}>Make Wallet</Button>
		{#if walletInfo}
			<div>
				<p>Fund this wallet with Sepolia ETH before calling become member of group: {walletInfo.publicKey}</p>
				<p>Save the private key until we store it on the server: {walletInfo.privateKey}</p>
			</div>
			<Button action={() => becomeMemberOfGroup(5, "0xfa536aa76e0a1c47e4304591d20f50014be9702c86d10b9f9505dc6100c588a3")}>Become member of group</Button>
		{/if}
	</div>
</Layout>
