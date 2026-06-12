import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Prevent execution if no text is passed down
    if (!text) {
      console.warn("CopyButton: No text provided to copy!");
      return;
    }

    try {
      // Modern Secure Browser Check
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Absolute fallback for older browsers or non-HTTPS/local environments
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      // Explicitly set state to trigger the change
      setCopied(true);

      // Revert back to copy icon after 1 second
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150 active:scale-95 ${
        copied
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
      aria-label="Copy to clipboard"
      title={copied ? "Copied!" : "Copy"}
    >
      {copied ? (
        <Check size={14} className="scale-100 transition-transform duration-150" />
      ) : (
        <Copy size={14} className="scale-100 transition-transform duration-150" />
      )}
    </button>
  );
}