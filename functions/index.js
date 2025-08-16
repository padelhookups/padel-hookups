// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();
const { logger } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
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
			url: `https://padel-hookups.web.app/SignUp?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&inviteId=${snap.id}&isAdmin=${isAdmin}`,
			handleCodeInApp: true
		};

		const link = await auth.generateSignInWithEmailLink(
			email,
			actionCodeSettings
		);

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
	"every day 10:00",
	async (event) => {
		const db = getFirestore();

		const today = new Date();
		const month = today.getMonth() + 1; // JS months are 0-based
		const day = today.getDate();
		console.log(`Today's date is: ${day}/${month}`);

		const messages = [];

		const userRef = db.collection("Users");
		const snapshot = await userRef
			.where("BirthdayMonth", "==", month)
			.where("BirthdayDay", "==", day)
			.get();

		if (snapshot.empty) {
			console.log("No Users have a birthday today.");
			return;
		}

		console.log(snapshot.size);

		snapshot.forEach(async (userDoc) => {
			const devices = userDoc.data()?.Devices;
			Object.values(devices || {}).forEach(async (device) => {
				console.log(`Checking device: ${JSON.stringify(device)}`);

				const token = device.Token;				
				if (token && device.SendNotifications) {
					messages.push({
						notification: {
							title: "Happy Birthday!",
							body: ""
						},
						token: token
					});
				}
			});
		});
		console.log(`Messages to be sent: ${JSON.stringify(messages)}`);
		if (messages.length === 0) {
			console.log("No messages to send.");
			return;			
		}
		
		getMessaging()
			.sendEach(messages)
			.then((response) => {
				console.log(
					response.successCount + " messages were sent successfully"
				);
			});
	}
);
