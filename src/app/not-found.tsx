/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
      <h1 className="text-6xl font-bold text-pink-500 mb-4">404</h1>
      <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
      <p className="text-slate-400 max-w-md mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button className="bg-purple-600 hover:bg-purple-700">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
