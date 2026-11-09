import { Request, Response } from "express";
import { voiceService } from "../services/VoiceService";
import { sendSuccess } from "../utils/response";
import { VoiceProcessSchema } from "../validators/schemas";

export class VoiceController {
  static async processVoice(req: Request, res: Response) {
    const validated = VoiceProcessSchema.parse(req.body);
    const transcript = validated.transcript || "Help me draw";
    const language = validated.language || "en";

    const result = voiceService.parseIntent(transcript, language);

    return sendSuccess(res, {
      receivedTranscript: transcript,
      language,
      currentScreen: validated.currentScreen,
      intent: result,
      timestamp: new Date().toISOString(),
    });
  }
}
