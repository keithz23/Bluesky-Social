"use client"
interface AuthBannerProps {
  title: string;
  description: string;
}

export default function AuthBanner({
  title,
  description,
}: AuthBannerProps) {
  return (
    <div className="flex items-center justify-center px-12">
      <div className="max-w-full text-right space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-600">
          {title}
        </h1>

        <p className="text-[18px] text-gray-600 font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}
