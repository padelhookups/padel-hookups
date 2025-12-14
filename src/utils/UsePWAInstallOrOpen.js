import { useEffect, useState } from "react";

export function usePWAInstallOrOpen(appProtocolUrl) {
	const [isInstalled, setIsInstalled] = useState(false);
	const [isRunningInApp, setIsRunningInApp] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [deferredPrompt, setDeferredPrompt] = useState(null);

	// Detect if installed
	useEffect(() => {
		async function checkInstalled() {
			/* console.log("Checking if PWA is installed..."); */
			/* console.log(
				window.matchMedia("(display-mode: standalone)").matches
			);
			console.log(window.navigator.standalone); */

			if (
				window.matchMedia("(display-mode: standalone)").matches ||
				window.navigator.standalone === true
			) {
				setIsInstalled(true);
				setIsRunningInApp(true);
				setIsChecking(false);
				return;
			}
			if (navigator.getInstalledRelatedApps()) {
				const relatedApps = await navigator.getInstalledRelatedApps();
				//console.log("relatedApps:", relatedApps);

				if (relatedApps.length > 0) {
					setIsInstalled(true);
					return;
				}
			}
			setIsChecking(false);
		}
		checkInstalled();
	}, []);

	// Capture install prompt
	useEffect(() => {
		const handleBeforeInstallPrompt = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
		};
		window.addEventListener(
			"beforeinstallprompt",
			handleBeforeInstallPrompt
		);
		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt
			);
		};
	}, []);

	// Trigger install prompt
	const promptInstall = async () => {
		if (!deferredPrompt) return false;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		setDeferredPrompt(null);
		return outcome === "accepted";
	};

	// Open installed app
	const openApp = () => {
		if (!appProtocolUrl) return;
		window.location.href = appProtocolUrl;
	};

	return {
		isInstalled,
		isRunningInApp,
		isChecking,
		promptInstall,
		openApp,
		canInstall: !!deferredPrompt
	};
}
