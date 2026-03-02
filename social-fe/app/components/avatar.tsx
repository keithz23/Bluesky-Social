import React from "react";
import { User } from "../interfaces/user.interface";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  data: User;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ data, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`w-12 h-12 rounded-full bg-[#FF4F5A] flex items-center justify-center text-xl text-white font-bold shrink-0 overflow-hidden cursor-pointer ${className || ""}`}
      >
        {data?.avatarUrl ? (
          <img
            src={data.avatarUrl}
            alt={data.username}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          data?.username?.charAt(0).toUpperCase()
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export default Avatar;
