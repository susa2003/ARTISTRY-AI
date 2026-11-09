import { aiService } from "../../services/ai/AIServiceManager";
import type { ArtMentorMessage } from "../../services/ai/types";

export const INITIAL_MENTOR_MESSAGES: ArtMentorMessage[] = [
  {
    role: "mentor",
    text: "Welcome to your personal Studio Atelier! I am your AI Art Mentor. Ask me any technique question—whether you're working through Loomis head constructions, controlling 5-step shading values, or mastering 2-point perspective.",
    suggestedAction: {
      toolId: "learning",
      label: "Browse Curriculum",
    },
  },
];

export async function askArtMentor(
  conversation: ArtMentorMessage[],
  query: string,
  context?: { skillLevel: string; currentTool?: string }
): Promise<ArtMentorMessage> {
  return aiService.consultMentor(conversation, query, context);
}
