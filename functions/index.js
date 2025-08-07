// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const functions = require('firebase-functions');
const { logger } = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const brevoApiKey = process.env.BREVO_API_KEY;

exports.sendInviteOnCreateUser = onDocumentCreated(
	{ region: "europe-west1", document: "/Invites/{inviteId}" },
	async (event) => {
		logger.log("BREVO_API_KEY", brevoApiKey);
		const snap = event.data;
		if (!snap) {
			console.error("No data in document.");
			return;
		}

		const data = snap.data();
		const email = data.Email;
		const name = data.Name;

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
			url: `https://padel-hookups.web.app/SignUp?email=${encodeURIComponent(email)}`,
			handleCodeInApp: true
		};

		const link = await auth.generateSignInWithEmailLink(
			email,
			actionCodeSettings
		);

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
