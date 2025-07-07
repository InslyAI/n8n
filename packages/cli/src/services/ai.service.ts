import type {
	AiApplySuggestionRequestDto,
	AiAskRequestDto,
	AiChatRequestDto,
} from '@n8n/api-types';
import { GlobalConfig } from '@n8n/config';
import { Service } from '@n8n/di';
import { AiAssistantClient } from '@n8n_io/ai-assistant-sdk';
import { assert, type IUser } from 'n8n-workflow';

import { N8N_VERSION } from '../constants';
import { License } from '../license';

@Service()
export class AiService {
	private client: AiAssistantClient | undefined;

	constructor(
		private readonly licenseService: License,
		private readonly globalConfig: GlobalConfig,
	) {}

	async init() {
		const aiAssistantEnabled = this.licenseService.isAiAssistantEnabled();

		if (!aiAssistantEnabled) {
			return;
		}

		const baseUrl = this.globalConfig.aiAssistant.baseUrl;

		// Skip initialization if baseUrl is empty
		if (!baseUrl) {
			return;
		}

		const licenseCert = await this.licenseService.loadCertStr();
		const consumerId = this.licenseService.getConsumerId();
		const logLevel = this.globalConfig.logging.level;

		this.client = new AiAssistantClient({
			licenseCert,
			consumerId,
			n8nVersion: N8N_VERSION,
			baseUrl,
			logLevel,
		});
	}

	async chat(payload: AiChatRequestDto, user: IUser) {
		if (!this.client) {
			await this.init();
		}

		// If client is still not initialized, it means we're using direct OpenAI
		if (!this.client) {
			throw new Error(
				'AI Assistant is not configured. Please set N8N_AI_ASSISTANT_BASE_URL or use the workflow builder AI instead.',
			);
		}

		return await this.client.chat(payload, { id: user.id });
	}

	async applySuggestion(payload: AiApplySuggestionRequestDto, user: IUser) {
		if (!this.client) {
			await this.init();
		}

		// If client is still not initialized, it means we're using direct OpenAI
		if (!this.client) {
			throw new Error(
				'AI Assistant is not configured. Please set N8N_AI_ASSISTANT_BASE_URL or use the workflow builder AI instead.',
			);
		}

		return await this.client.applySuggestion(payload, { id: user.id });
	}

	async askAi(payload: AiAskRequestDto, user: IUser) {
		if (!this.client) {
			await this.init();
		}

		// If client is still not initialized, it means we're using direct OpenAI
		if (!this.client) {
			throw new Error(
				'AI Assistant is not configured. Please set N8N_AI_ASSISTANT_BASE_URL or use the workflow builder AI instead.',
			);
		}

		return await this.client.askAi(payload, { id: user.id });
	}

	async createFreeAiCredits(user: IUser) {
		if (!this.client) {
			await this.init();
		}

		// If client is still not initialized, it means we're using direct OpenAI
		if (!this.client) {
			throw new Error(
				'AI Assistant is not configured. Please set N8N_AI_ASSISTANT_BASE_URL or use the workflow builder AI instead.',
			);
		}

		return await this.client.generateAiCreditsCredentials(user);
	}
}
