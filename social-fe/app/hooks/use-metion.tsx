import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { UserService } from "../services/user.service";

export const useMention = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(
    debounce(async (q: string) => {
      try {
        const data = await UserService.searchUsers(q);
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch users for mention:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [],
  );

  const handleInput = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1 || textBeforeCursor.slice(atIndex + 1).includes(" ")) {
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const afterAt = textBeforeCursor.slice(atIndex + 1);

    setMentionStart(atIndex);
    setQuery(afterAt);
    setIsOpen(true);
    setActiveIndex(0);

    setIsLoading(true);
    fetchUsers(afterAt);
  };

  const closeMention = () => {
    setIsOpen(false);
    setResults([]);
    setQuery("");
    setIsLoading(false);
  };

  return {
    query,
    isOpen,
    mentionStart,
    results,
    activeIndex,
    setActiveIndex,
    handleInput,
    closeMention,
    isLoading,
  };
};
