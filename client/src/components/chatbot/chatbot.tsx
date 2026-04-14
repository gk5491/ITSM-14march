import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock initial messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi there! I'm your IT Support Assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate API delay and response
    setTimeout(() => {
      let responseContent = "I'm not sure how to help with that yet. Try asking to 'create a ticket' or 'check status'.";
      const lowerInput = userMessage.content.toLowerCase();

      if (lowerInput.includes("create") && lowerInput.includes("ticket")) {
        responseContent = "I can help you create a ticket. Please describe the issue you're facing.";
      } else if (lowerInput.includes("status") || lowerInput.includes("check")) {
        responseContent = "You can check your ticket status on the 'My Tickets' page. Would you like me to take you there?";
      } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        responseContent = "Hello! How can I assist you with your IT needs today?";
      } else if (lowerInput.includes("password") || lowerInput.includes("reset")) {
        responseContent = "To reset your password, please visit the settings page or contact the helpdesk directly if you're locked out.";
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-0 flex items-center justify-center transition-transform hover:scale-105"
            >
              <MessageSquare className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span>
            </Button>
                                      <span className="font-medium">{line}</span>
                                    </div>
                                    <Link href={`/tickets/${ticketId}`}>
                                      <a className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 mt-1">
                                        <ExternalLink className="h-3 w-3" />
                                        View Ticket Details
                                      </a>
                                    </Link>
                                  </div>
      );
                              }
                            }
      return <p key={lineIndex}>{line}</p>;
                          })}
    </div >
                      ) : (
    <p>{msg.message}</p>
  )
}
                    </div >
                  </div >
                </div >
              ))
            )}
<div ref={messagesEndRef} />
          </CardContent >

  <CardFooter className="border-t p-3">
    <form onSubmit={handleSendMessage} className="flex w-full gap-2">
      <Input
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1"
        disabled={sendMessageMutation.isPending || !user}
      />
      <Button
        type="submit"
        size="icon"
        disabled={sendMessageMutation.isPending || !message.trim() || !user}
      >
        <Send size={16} />
      </Button>
    </form>
  </CardFooter>
        </Card >

  {!user && (
    <div className="mt-2 text-xs text-center p-2 bg-white rounded shadow-md">
      <p className="text-gray-700">
        Please <Link href="/auth"><a className="text-primary hover:underline">login</a></Link> to chat with support
      </p>
    </div>
  )}
      </div >
    </>
  );
}
