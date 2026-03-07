/**
 * Planning Conversation UI Component
 * 
 * Displays multi-turn conversation for AI day planning
 * with chat bubbles and user input
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlanningConversationProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  onSkipQuestions?: () => void;
  showSkipButton?: boolean;
}

export function PlanningConversation({
  messages,
  isLoading = false,
  onSendMessage,
  onSkipQuestions,
  showSkipButton = false,
}: PlanningConversationProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-muted-foreground">
              <p className="text-sm">Describe your day and I'll help you plan it.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-muted-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {showSkipButton && (
          <Button
            onClick={onSkipQuestions}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isLoading}
          >
            Skip and generate plan
          </Button>
        )}
      </div>
    </div>
  );
}
