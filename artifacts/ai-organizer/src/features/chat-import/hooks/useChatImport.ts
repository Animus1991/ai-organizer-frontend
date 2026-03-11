/**
 * useChatImport Hook
 * Manages the state and logic for importing chat archives
 */

import { useState, useCallback } from 'react';
import { ParserRegistry, ParseResult, ParsedConversation } from '../parsers/ChatArchiveParser';
import { ChatGPTParser } from '../parsers/ChatGPTParser';
import { ClaudeParser } from '../parsers/ClaudeParser';
import { GeminiParser } from '../parsers/GeminiParser';
import { CopilotParser } from '../parsers/CopilotParser';
import { PerplexityParser } from '../parsers/PerplexityParser';
import { MetaAIParser } from '../parsers/MetaAIParser';
import { PiAIParser } from '../parsers/PiAIParser';
import { CharacterAIParser } from '../parsers/CharacterAIParser';
import { DeepSeekParser } from '../parsers/DeepSeekParser';
import { MistralParser } from '../parsers/MistralParser';
import { YouParser } from '../parsers/YouParser';
import { HuggingChatParser } from '../parsers/HuggingChatParser';
import { isZipFile } from '../utils/zipExtractor';

// Register all parsers once
let parsersRegistered = false;
function registerParsers() {
  if (parsersRegistered) return;
  ParserRegistry.register(new ChatGPTParser());
  ParserRegistry.register(new ClaudeParser());
  ParserRegistry.register(new GeminiParser());
  ParserRegistry.register(new CopilotParser());
  ParserRegistry.register(new PerplexityParser());
  ParserRegistry.register(new MetaAIParser());
  ParserRegistry.register(new PiAIParser());
  ParserRegistry.register(new CharacterAIParser());
  ParserRegistry.register(new DeepSeekParser());
  ParserRegistry.register(new MistralParser());
  ParserRegistry.register(new YouParser());
  ParserRegistry.register(new HuggingChatParser());
  parsersRegistered = true;
}

export interface ImportState {
  isLoading: boolean;
  progress: number;
  currentFile: string;
  totalFiles: number;
  processedFiles: number;
}

export interface ImportResult {
  success: boolean;
  conversations: ParsedConversation[];
  errors: string[];
  warnings: string[];
  totalConversations: number;
}

export function useChatImport() {
  // Register parsers on first use
  registerParsers();

  const [state, setState] = useState<ImportState>({
    isLoading: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0
  });

  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
      currentFile: '',
      totalFiles: 0,
      processedFiles: 0
    });
    setResult(null);
  }, []);

  const importFiles = useCallback(async (files: File[]): Promise<ImportResult> => {
    setState({
      isLoading: true,
      progress: 0,
      currentFile: '',
      totalFiles: files.length,
      processedFiles: 0
    });

    const finalResult: ImportResult = {
      success: false,
      conversations: [],
      errors: [],
      warnings: [],
      totalConversations: 0
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setState(prev => ({
        ...prev,
        currentFile: file.name,
        progress: Math.round((i / files.length) * 100)
      }));

      try {
        // Handle ZIP files
        if (isZipFile(file)) {
          finalResult.warnings.push(`ZIP extraction for ${file.name} requires JSZip library`);
          continue;
        }

        // Find appropriate parser
        const parser = ParserRegistry.findParser(file);
        if (!parser) {
          finalResult.errors.push(`No parser found for ${file.name}`);
          continue;
        }

        // Read and parse file
        const content = await file.text();
        const parseResult: ParseResult = await parser.parse(content, file.name);

        // Merge results
        finalResult.conversations.push(...parseResult.conversations);
        finalResult.errors.push(...parseResult.errors);
        finalResult.warnings.push(...parseResult.warnings);

      } catch (error) {
        finalResult.errors.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      setState(prev => ({
        ...prev,
        processedFiles: i + 1,
        progress: Math.round(((i + 1) / files.length) * 100)
      }));
    }

    finalResult.success = finalResult.errors.length === 0;
    finalResult.totalConversations = finalResult.conversations.length;

    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: 100,
      currentFile: ''
    }));

    setResult(finalResult);
    return finalResult;
  }, []);

  return {
    state,
    result,
    importFiles,
    reset
  };
}
