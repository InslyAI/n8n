import sanitizeHtml from 'sanitize-html';

import type { AuthenticationChatOption, LoadPreviousSessionChatOption } from './types';
export function createPage({
	instanceId,
	webhookUrl,
	showWelcomeScreen,
	loadPreviousSession,
	i18n: { en },
	initialMessages,
	authentication,
	allowFileUploads,
	allowedFilesMimeTypes,
	customCss,
	enableStreaming,
}: {
	instanceId: string;
	webhookUrl?: string;
	showWelcomeScreen?: boolean;
	loadPreviousSession?: LoadPreviousSessionChatOption;
	i18n: {
		en: Record<string, string>;
	};
	initialMessages: string[];
	mode: 'test' | 'production';
	authentication: AuthenticationChatOption;
	allowFileUploads?: boolean;
	allowedFilesMimeTypes?: string;
	customCss?: string;
	enableStreaming?: boolean;
}) {
	const validAuthenticationOptions: AuthenticationChatOption[] = [
		'none',
		'basicAuth',
		'n8nUserAuth',
	];
	const validLoadPreviousSessionOptions: LoadPreviousSessionChatOption[] = [
		'manually',
		'memory',
		'notSupported',
	];

	const sanitizedAuthentication = validAuthenticationOptions.includes(authentication)
		? authentication
		: 'none';
	const sanitizedShowWelcomeScreen = !!showWelcomeScreen;
	const sanitizedAllowFileUploads = !!allowFileUploads;
	const sanitizedAllowedFilesMimeTypes = allowedFilesMimeTypes?.toString() ?? '';
	const sanitizedCustomCss = sanitizeHtml(`<style>${customCss?.toString() ?? ''}</style>`, {
		allowedTags: ['style'],
		allowedAttributes: false,
	});

	const sanitizedLoadPreviousSession = validLoadPreviousSessionOptions.includes(
		loadPreviousSession as LoadPreviousSessionChatOption,
	)
		? loadPreviousSession
		: 'notSupported';

	return `<!doctype html>
	<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Chat</title>
			<link href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css" rel="stylesheet" />
			<link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />
			<style>
				html,
				body,
				#n8n-chat {
					width: 100%;
					height: 100%;
				}
			</style>
			${sanitizedCustomCss}
		</head>
		<body>
			<script type="module">
				import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

				(async function () {
					const authentication = '${sanitizedAuthentication}';
					let metadata;
					if (authentication === 'n8nUserAuth') {
						try {
							const response = await fetch('/rest/login', {
									method: 'GET',
									headers: { 'browser-id': localStorage.getItem('n8n-browserId') }
							});

							if (response.status !== 200) {
								throw new Error('Not logged in');
							}

							const responseData = await response.json();
							metadata = {
								user: {
									id: responseData.data.id,
									firstName: responseData.data.firstName,
									lastName: responseData.data.lastName,
									email: responseData.data.email,
								},
							};
						} catch (error) {
							window.location.href = '/signin?redirect=' + window.location.href;
							return;
						}
					}

					createChat({
						mode: 'fullscreen',
						webhookUrl: '${webhookUrl}',
						showWelcomeScreen: ${sanitizedShowWelcomeScreen},
						loadPreviousSession: ${sanitizedLoadPreviousSession !== 'notSupported'},
						enableStreaming: ${enableStreaming ?? false},
						metadata: metadata,
						webhookConfig: {
							headers: {
								'Content-Type': 'application/json',
								'X-Instance-Id': '${instanceId}',
							}
						},
						allowFileUploads: ${sanitizedAllowFileUploads},
						allowedFilesMimeTypes: '${sanitizedAllowedFilesMimeTypes}',
						i18n: {
							${en ? `en: ${JSON.stringify(en)},` : ''}
						},
						${initialMessages.length ? `initialMessages: ${JSON.stringify(initialMessages)},` : ''}
						enableStreaming: ${!!enableStreaming},
					});
				})();
			</script>
		</body>
	</html>`;
}
