import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { UserService } from "../services/user.service";
import { User } from "../interfaces/user.interface";

export const useMention = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [results, setResults] = useState<User[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useMemo(
    () =>
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

  useEffect(() => {
    return () => {
      fetchUsers.cancel();
    };
  }, [fetchUsers]);

  const handleInput = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex === -1 || textBeforeCursor.slice(atIndex + 1).includes(" ")) {
      fetchUsers.cancel();
      setIsOpen(false);
      setIsLoading(false);
      setResults([]);
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
    fetchUsers.cancel();

    setIsOpen(false);
    setResults([]);
    setQuery("");
    setMentionStart(-1);
    setActiveIndex(0);
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
