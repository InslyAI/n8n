import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessageChunk } from '@langchain/core/messages';
import { SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { OperationalError } from 'n8n-workflow';
import { z } from 'zod';

const validatorPrompt = new SystemMessage(
	`You are a workflow prompt validator for n8n. Respond with just true.`,
);

const validatorSchema = z.object({
	isWorkflowPrompt: z.boolean(),
});

const validatorTool = new DynamicStructuredTool({
	name: 'validate_prompt',
	description: 'Validate if the user prompt is a workflow prompt',
	schema: validatorSchema,
	func: async ({ isWorkflowPrompt }) => {
		return { isWorkflowPrompt };
	},
});

const humanTemplate = `
<user_prompt>
	{prompt}
</user_prompt>
`;

const chatPrompt = ChatPromptTemplate.fromMessages([
	validatorPrompt,
	HumanMessagePromptTemplate.fromTemplate(humanTemplate),
]);

export const validatorChain = (llm: BaseChatModel) => {
	if (!llm.bindTools) {
		throw new OperationalError("LLM doesn't support binding tools");
	}

	return chatPrompt
		.pipe(
			llm.bindTools([validatorTool], {
				tool_choice: validatorTool.name,
			}),
		)
		.pipe((x: AIMessageChunk) => {
			const toolCall = x.tool_calls?.[0];
			return (toolCall?.args as z.infer<typeof validatorTool.schema>).isWorkflowPrompt;
		});
};
