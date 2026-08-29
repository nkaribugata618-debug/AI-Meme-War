"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
      <h2 className="text-3xl font-bold text-red-500 mb-4">Something went wrong!</h2>
      <p className="text-slate-400 max-w-md mb-8">
        We encountered an unexpected error while trying to render this page.
      </p>
      <Button 
        onClick={() => reset()}
        className="bg-pink-600 hover:bg-pink-700"
      >
        Try again
      </Button>
    </div>
  );
}
