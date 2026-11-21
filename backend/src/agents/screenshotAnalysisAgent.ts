
import { AgentResult } from './agentTypes';
import { ThreatIndicator } from '../types';
import { messageAnalysisAgent } from './messageAnalysisAgent';
import { computeSha256 } from '../utils/hash';
import { createWorker } from 'tesseract.js';
import fs from 'fs/promises';

export class ScreenshotAnalysisAgent {
  public readonly name = 'Screenshot Analysis Agent';

  public async analyze(
    investigationId: string,
    evidenceId: string,
    filePath: string,
    userCorrectedText?: string
  ): Promise<AgentResult & {
    extractedOcrText: string;
    fileHash: string;
  }> {
    const startTime = Date.now();

    // 1. Verify screenshot exists
    if (!filePath) {
      throw new Error('Screenshot file path is required.');
    }

    let imageBuffer: Buffer;

    try {
      imageBuffer = await fs.readFile(filePath);
    } catch {
      throw new Error('Screenshot file could not be accessed.');
    }

    if (imageBuffer.length === 0) {
      throw new Error('Uploaded screenshot is empty.');
    }

    // 2. Calculate screenshot SHA-256 hash
    const fileHash = computeSha256(imageBuffer);

    // 3. Extract actual text using OCR
    let ocrText = userCorrectedText?.trim() || '';
    let ocrUsed = false;

    if (!ocrText) {
      const worker = await createWorker('eng');

      try {
        const result = await worker.recognize(filePath);

        ocrText = result.data.text.trim();
        ocrUsed = true;
      } catch (error) {
        throw new Error(
          'Screenshot OCR extraction failed. Please upload a clearer image.'
        );
      } finally {
        await worker.terminate();
      }
    }

    // 4. Reject images without readable text
    if (!ocrText) {
      return {
        agentName: this.name,
        executionTimeMs: Date.now() - startTime,
        confidence: 0,
        extractedEntities: {
          urls: [],
          phones: [],
          emails: [],
          upiIds: [],
          organizations: [],
          amounts: [],
          dates: [],
          remoteAccessApps: [],
        },
        indicators: [],
        summary: 'No readable text was detected in the screenshot.',
        uncertainties: [
          'OCR could not identify readable text.',
          'The screenshot may be blurry, distorted or contain unsupported text.',
          'No scam conclusion can be made from this screenshot alone.',
        ],
        extractedOcrText: '',
        fileHash,
      };
    }

    // 5. Analyse extracted text using Message Analysis Agent
    const messageAnalysis = await messageAnalysisAgent.analyze(
      investigationId,
      evidenceId,
      ocrText
    );

    // 6. Preserve original findings and identify OCR source
    const adjustedIndicators: ThreatIndicator[] =
      messageAnalysis.indicators.map((indicator) => ({
        ...indicator,
        source: this.name,
        confidence: ocrUsed
          ? Math.round(indicator.confidence * 0.95)
          : indicator.confidence,
      }));

    // 7. Return structured investigation result
    return {
      agentName: this.name,
      executionTimeMs: Date.now() - startTime,
      confidence: ocrUsed
        ? Math.round(messageAnalysis.confidence * 0.95)
        : messageAnalysis.confidence,
      extractedEntities: messageAnalysis.extractedEntities,
      indicators: adjustedIndicators,
      summary: `OCR extracted ${ocrText.length} characters. Found ${adjustedIndicators.length} threat indicator(s).`,
      uncertainties: [
        ...(ocrUsed
          ? ['OCR may contain character recognition inaccuracies.']
          : []),
        'Extracted text should be reviewed if image quality is poor.',
        'Detected indicators require independent verification.',
      ],
      extractedOcrText: ocrText,
      fileHash,
    };
  }
}

export const screenshotAnalysisAgent =
  new ScreenshotAnalysisAgent();
