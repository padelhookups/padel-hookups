// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();
const Stripe = require("stripe");
const { logger } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue, FieldPath } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");

initializeApp();

const INVALID_TOKEN_ERRORS = new Set([
	"messaging/registration-token-not-registered",
	"messaging/invalid-registration-token",
]);

const DEFAULT_WEB_ORIGIN = "https://padel-hookups.web.app";
const ALLOWED_WEB_ORIGINS = new Set([
	DEFAULT_WEB_ORIGIN,
	"http://localhost:3000",
	"http://127.0.0.1:3000",
]);
const CALLABLE_CORS_ORIGINS = [
	"https://padel-hookups.web.app",
	"http://localhost:3000",
	"http://127.0.0.1:3000",
];

let stripeClient;
let stripeSecretKeyPromise;

function toCents(value) {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value) || value <= 0) {
			return null;
		}
		return Math.round(value * 100);
	}

	if (typeof value === "string") {
		const parsed = Number(
			value
				.replace(/[€\s]/g, "")
				.replace(",", ".")
		);
		if (!Number.isFinite(parsed) || parsed <= 0) {
			return null;
		}
		return Math.round(parsed * 100);
	}

	return null;
}

function resolveAllowedOrigin(origin) {
	if (!origin || typeof origin !== "string") {
		return DEFAULT_WEB_ORIGIN;
	}

	try {
		const parsed = new URL(origin);
		return ALLOWED_WEB_ORIGINS.has(parsed.origin)
			? parsed.origin
			: DEFAULT_WEB_ORIGIN;
	} catch {
		return DEFAULT_WEB_ORIGIN;
	}
}

async function getStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	if (!stripeSecretKeyPromise) {
		stripeSecretKeyPromise = client
			.accessSecretVersion({ name: STRIPE_SECRET_NAME })
			.then(([result]) => {
				const secretKey = result.payload?.data?.toString("utf8")?.trim();
				if (!secretKey) {
					throw new Error("Stripe secret key is empty.");
				}
				logger.info(`Stripe secret key loaded from ${STRIPE_SECRET_NAME}`);
				return secretKey;
			})
			.catch((error) => {
				stripeSecretKeyPromise = null;
				throw error;
			});
	}

	const secretKey = await stripeSecretKeyPromise;
	stripeClient = new Stripe(secretKey);
	return stripeClient;
}

async function sendNotificationsAndCleanup({
	db,
	messaging,
	messages,
	tokenRefs,
	notificationType,
}) {
	if (messages.length === 0) {
		console.log("No messages to send.");
		return;
	}

	console.log(`Sending ${messages.length} ${notificationType} notifications`);

	const response = await messaging.sendEach(messages);
	const batch = db.batch();
	let deletedCount = 0;

	response.responses.forEach((res, index) => {
		if (res.success) {
			return;
		}

		const errorCode = res.error?.code;
		if (!INVALID_TOKEN_ERRORS.has(errorCode)) {
			return;
		}

		const tokenRef = tokenRefs[index];
		if (!tokenRef) {
			return;
		}

		const { userId, deviceId } = tokenRef;
		console.log(`Deleting invalid token for user ${userId}, device ${deviceId}`);

		batch.update(db.collection("Users").doc(userId), {
			[`Devices.${deviceId}`]: FieldValue.delete(),
		});

		deletedCount++;
	});

	if (deletedCount > 0) {
		await batch.commit();
		console.log(`Deleted ${deletedCount} invalid tokens`);
	} else {
		console.log("No invalid tokens found");
	}

	console.log(`${response.successCount} messages sent successfully`);
}

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

		await sendNotificationsAndCleanup({
			db,
			messaging,
			messages,
			tokenRefs,
			notificationType: "birthday",
		});
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

		await sendNotificationsAndCleanup({
			db,
			messaging,
			messages,
			tokenRefs,
			notificationType: "news",
		});
	}
);

exports.sendGroupsNotification = onCall({ region: "europe-west1" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be signed in.");
	}

	// Verify the caller is an admin
	const db = getFirestore();

	const { title, body, link, userIds } = request.data;
	if (!title || !body) {
		throw new HttpsError("invalid-argument", "'title' and 'body' are required.");
	}
	if (!Array.isArray(userIds) || userIds.length === 0) {
		throw new HttpsError("invalid-argument", "'userIds' must be a non-empty array.");
	}

	const messaging = getMessaging();

	const usersSnapshot = await db.collection("Users").where(FieldPath.documentId(), "in", userIds).get();
	const userDocs = usersSnapshot.docs;

	if (userDocs.length === 0) {
		return { sent: 0 };
	}

	const messages = [];
	const tokenRefs = [];

	for (const userDoc of userDocs) {
		const userData = userDoc.data();

		const devices = userData.Devices || {};

		for (const [deviceId, device] of Object.entries(devices)) {
			if (device?.Token && device?.SendNotifications) {
				const message = {
					token: device.Token,
					data: { title, body },
					webpush: { headers: { Urgency: "high" } },
				};
				if (link) {
					message.data.click_action = link;
					message.webpush.fcmOptions = { link };
				}
				messages.push(message);
				tokenRefs.push({ userId: userDoc.id, deviceId, token: device.Token });
			}
		}
	}

	await sendNotificationsAndCleanup({
		db,
		messaging,
		messages,
		tokenRefs,
		notificationType: "adminNotification",
	});

	return { sent: messages.length };
});

async function createStripePaymentLinkForRequest(request) {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be signed in.");
	}

	const { eventId, origin } = request.data || {};
	if (!eventId || typeof eventId !== "string") {
		throw new HttpsError(
			"invalid-argument",
			"'eventId' is required and must be a string."
		);
	}

	const db = getFirestore();
	const eventSnap = await db.collection("Events").doc(eventId).get();
	if (!eventSnap.exists) {
		throw new HttpsError("not-found", "Event not found.");
	}

	const eventData = eventSnap.data() || {};
	const amount = toCents(eventData.Price);
	if (!amount) {
		throw new HttpsError(
			"failed-precondition",
			"This event has no valid price configured."
		);
	}

	const safeOrigin = resolveAllowedOrigin(origin);

	let stripe;
	try {
		stripe = await getStripeClient();
	} catch (error) {
		logger.error("Failed to load Stripe secret key.", error);
		throw new HttpsError("internal", "Payment provider not configured.");
	}

	const eventName = eventData.Name || "Padel Event";
	const paymentLink = await stripe.paymentLinks.create({
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: "eur",
					unit_amount: amount,
					product_data: {
						name: `${eventName} entry fee`,
						description: eventData.Location || undefined,
					},
				},
			},
		],
		customer_creation: "always",
		after_completion: {
			type: "redirect",
			redirect: {
				url: `${safeOrigin}/Event/${eventId}?payment=success`,
			},
		},
		metadata: {
			eventId,
			userId: request.auth.uid,
			eventName,
		},
		payment_intent_data: {
			metadata: {
				eventId,
				userId: request.auth.uid,
				eventName,
			},
		},
	});

	if (!paymentLink.url) {
		throw new HttpsError("internal", "Unable to create payment link.");
	}

	const paymentLinkUrl = new URL(paymentLink.url);
	if (request.auth.token.email) {
		paymentLinkUrl.searchParams.set(
			"prefilled_email",
			request.auth.token.email
		);
	}

	return { url: paymentLinkUrl.toString() };
}

exports.createStripePaymentLink = onCall(
	{ region: "europe-west1", cors: CALLABLE_CORS_ORIGINS },
	async (request) => createStripePaymentLinkForRequest(request)
);
