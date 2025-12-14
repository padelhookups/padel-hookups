// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();
const { logger } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");

initializeApp();

exports.sendInviteOnCreateUser = onDocumentCreated(
	{ region: "europe-west1", document: "/Invites/{inviteId}" },
	async (event) => {
		let brevoApiKey;
		try {
			const [result] = await client.accessSecretVersion({
				name: `projects/padel-hookups/secrets/brevo-api-key/versions/latest`
			});
			brevoApiKey = result.payload.data.toString("utf8");
			logger.info("BREVO_API_KEY successfully retrieved.");
		} catch (err) {
			logger.error("Failed to access brevo-api-key secret:", err);
			return;
		}

		const snap = event.data;
		if (!snap) {
			console.error("No data in document.");
			return;
		}

		const data = snap.data();
		const email = data.Email;
		const name = data.Name;
		const isAdmin = data.IsAdmin || false;
		const isTester = data.IsTester || false;

		if (!email) {
			console.error("Email is missing from document.");
			return;
		}

		const auth = getAuth();

		try {
			// Check if user exists, else create
			await auth.getUserByEmail(email);
			console.log(
				`User with email ${email} already exists, skipping creation.`
			);
		} catch {
			console.log(`User with email ${email} does not exist, creating...`);
			await auth.createUser({ email });
		}

		const actionCodeSettings = {
			url: `https://padel-hookups.web.app/SignUp?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&inviteId=${snap.id}&isAdmin=${isAdmin}&isTester=${isTester}`,
			handleCodeInApp: true
		};

		const link = await auth.generateSignInWithEmailLink(
			email,
			actionCodeSettings
		);

		/* const link = `https://padel-hookups.web.app/SignUp?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&inviteId=${snap.id}&isAdmin=${isAdmin}&isTester=${isTester}`; */


		logger.info("Link generated for email:", link);

		const emailBody = {
			sender: { name: "Padel Hookups", email: "padelhookups@gmail.com" }, // replace with your verified sender
			to: [{ email }],
			subject: "You're Invited to Register!",
			templateId: 2,
			params: {
				NAME: name,
				REGISTER_URL: link
			}
		};

		logger.info("BREVO_API_KEY:", brevoApiKey);

		try {
			const response = await fetch(
				"https://api.brevo.com/v3/smtp/email",
				{
					method: "POST",
					headers: {
						"api-key": brevoApiKey,
						"Content-Type": "application/json",
						Accept: "application/json"
					},
					body: JSON.stringify(emailBody)
				}
			);

			if (!response.ok) {
				const errText = await response.text();
				console.error(`Failed to send email: ${errText}`);
			} else {
				console.log(`Invitation email sent to ${email}`);
			}
		} catch (error) {
			console.error(`Error sending email to ${email}:`, error);
		}
	}
);

exports.sendBirthdayNotifications = onSchedule(
	{
		schedule: "every day 10:00",
		timeZone: "Europe/Lisbon",
		region: "europe-west1",
	},
	async () => {
		const db = getFirestore();
		const messaging = getMessaging();

		const today = new Date();
		const month = today.getMonth() + 1;
		const day = today.getDate();

		console.log(`Today's date is: ${day}/${month}`);

		const snapshot = await db
			.collection("Users")
			.where("BirthdayMonth", "==", month)
			.where("BirthdayDay", "==", day)
			.get();

		if (snapshot.empty) {
			console.log("No users have a birthday today.");
			return;
		}

		const messages = [];
		const tokenRefs = []; // keep references for cleanup

		for (const userDoc of snapshot.docs) {
			const userData = userDoc.data();
			const birthdayEnabled = userData.NotificationPrefs?.Birthdays || false;

			// 🚫 User opted out
			if (!birthdayEnabled) {
				continue;
			}

			const devices = userDoc.data()?.Devices || {};

			for (const [deviceId, device] of Object.entries(devices)) {
				if (device?.Token && device?.SendNotifications) {
					messages.push({
						token: device.Token,
						data: {
							title: "Happy Birthday! 🎉",
							body: "The whole padel community wishes you a great day!",
						},
						webpush: {
							headers: {
								Urgency: "high",
							},
						},
					});

					tokenRefs.push({
						userId: userDoc.id,
						deviceId,
						token: device.Token,
					});
				}
			}
		}

		if (messages.length === 0) {
			console.log("No messages to send.");
			return;
		}

		console.log(`Sending ${messages.length} birthday notifications`);

		const response = await messaging.sendEach(messages);

		const batch = db.batch();
		let deletedCount = 0;

		response.responses.forEach((res, index) => {
			if (!res.success) {
				const errorCode = res.error?.code;

				if (
					errorCode === "messaging/registration-token-not-registered" ||
					errorCode === "messaging/invalid-registration-token"
				) {
					const { userId, deviceId } = tokenRefs[index];

					console.log(
						`Deleting invalid token for user ${userId}, device ${deviceId}`
					);

					batch.update(
						db.collection("Users").doc(userId),
						{
							[`Devices.${deviceId}`]: FieldValue.delete(),
						}
					);

					deletedCount++;
				}
			}
		});

		if (deletedCount > 0) {
			await batch.commit();
			console.log(`Deleted ${deletedCount} invalid tokens`);
		} else {
			console.log("No invalid tokens found");
		}

		console.log(
			`${response.successCount} messages sent successfully`
		);
	}
);

exports.sendNewsNotifications = onDocumentCreated(
	{ region: "europe-west1", document: "/News/{newsId}" },
	async (event) => {
		const snap = event.data;
		if (!snap) {
			console.error("No data in document.");
			return;
		}

		const newsData = snap.data();
		const title = newsData.Title || "New Post!";
		const body = newsData.Description || "Check out the latest news!";

		console.log(`New news item created: ${title}`);

		const db = getFirestore();
		const messaging = getMessaging();

		// Get all users
		const usersSnapshot = await db.collection("Users").get();

		if (usersSnapshot.empty) {
			console.log("No users found.");
			return;
		}

		const messages = [];
		const tokenRefs = []; // keep references for cleanup

		for (const userDoc of usersSnapshot.docs) {
			const userData = userDoc.data();
			const newsEnabled = userData.NotificationPrefs?.Community_News || false;

			// 🚫 User opted out
			if (!newsEnabled) {
				continue;
			}

			const devices = userDoc.data()?.Devices || {};

			for (const [deviceId, device] of Object.entries(devices)) {
				if (device?.Token && device?.SendNotifications) {
					messages.push({
						token: device.Token,
						data: {
							title: title,
							body: body,
							click_action: "/Community",
						},
						webpush: {
							headers: {
								Urgency: "high",
							},
							fcmOptions: {
								link: "https://padel-hookups.web.app/Community",
							},
						},
					});

					tokenRefs.push({
						userId: userDoc.id,
						deviceId,
						token: device.Token,
					});
				}
			}
		}

		if (messages.length === 0) {
			console.log("No messages to send.");
			return;
		}

		console.log(`Sending ${messages.length} news notifications`);

		const response = await messaging.sendEach(messages);

		const batch = db.batch();
		let deletedCount = 0;

		response.responses.forEach((res, index) => {
			if (!res.success) {
				const errorCode = res.error?.code;

				if (
					errorCode === "messaging/registration-token-not-registered" ||
					errorCode === "messaging/invalid-registration-token"
				) {
					const { userId, deviceId } = tokenRefs[index];

					console.log(
						`Deleting invalid token for user ${userId}, device ${deviceId}`
					);

					batch.update(
						db.collection("Users").doc(userId),
						{
							[`Devices.${deviceId}`]: FieldValue.delete(),
						}
					);

					deletedCount++;
				}
			}
		});

		if (deletedCount > 0) {
			await batch.commit();
			console.log(`Deleted ${deletedCount} invalid tokens`);
		} else {
			console.log("No invalid tokens found");
		}

		console.log(
			`${response.successCount} messages sent successfully`
		);
	}
);
