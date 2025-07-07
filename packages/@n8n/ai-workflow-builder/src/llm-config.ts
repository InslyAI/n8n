type LLMConfig = {
	apiKey: string;
	baseUrl?: string;
	headers?: Record<string, string>;
};

export const o4mini = async (config: LLMConfig) => {
	const { ChatOpenAI } = await import('@langchain/openai');
	return new ChatOpenAI({
		model: 'o4-mini-2025-04-16',
		apiKey: config.apiKey,
		configuration: {
			baseURL: config.baseUrl,
			defaultHeaders: config.headers,
		},
	});
};

export const gpt41mini = async (config: LLMConfig) => {
	const { ChatOpenAI } = await import('@langchain/openai');
	return new ChatOpenAI({
		model: 'gpt-4.1',
		apiKey: config.apiKey,
		temperature: 0,
		configuration: {
			baseURL: config.baseUrl,
			defaultHeaders: config.headers,
		},
	});
};

export const anthropicClaude37Sonnet = async (config: LLMConfig) => {
	const { ChatAnthropic } = await import('@langchain/anthropic');
	return new ChatAnthropic({
		model: 'claude-sonnet-4-20250514',
		apiKey: config.apiKey,
		temperature: 0,
		maxTokens: 32000,
		anthropicApiUrl: config.baseUrl,
		clientOptions: {
			defaultHeaders: config.headers,
		},
	});
};
