import { useRouter } from "next/navigation";

interface PostContentProps {
  content: string;
  className?: string;
}

export const PostContent = ({ content, className }: PostContentProps) => {
  const router = useRouter();
  const parts = content.split(/(@\w+)/g);

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  return (
    <p className={className}>
      {parts.map((part, index) =>
        part.match(/^@\w+/) ? (
          <button
            key={index}
            className="text-blue-400 hover:underline cursor-pointer"
            onClick={(e) => {
              (e.stopPropagation(), handleProfileClick(part.slice(1)));
            }}
          >
            {part}
          </button>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
};
