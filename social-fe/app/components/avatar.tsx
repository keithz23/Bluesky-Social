import Link from "next/link";
import React from "react";
import { User } from "../interfaces/user.interface";

interface AvatarProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  data: User;
}

const Avatar = React.forwardRef<HTMLAnchorElement, AvatarProps>(
  ({ data, className, ...props }, ref) => {
    return (
      <Link
        href={`/profile/${data.username}`}
        ref={ref}
        {...props}
        className={`w-12 h-12 rounded-full bg-[#FF4F5A] flex items-center justify-center text-xl text-white font-bold shrink-0 overflow-hidden ${className || ""}`}
      >
        {data?.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.username}
            className="w-full h-full object-cover"
          />
        ) : (
          data?.username?.charAt(0).toUpperCase()
        )}
      </Link>
    );
  },
);

Avatar.displayName = "Avatar";

export default Avatar;
