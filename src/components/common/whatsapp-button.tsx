import { MessageCircleIcon } from "lucide-react";

import { WHATSAPP } from "@/config/constants";
import { publicConfig } from "@/config/public-config";

/** FR-34: floating WhatsApp button with a prefilled message, on every page. */
export function WhatsAppButton() {
  if (!publicConfig.whatsappNumber) return null;

  const href = `https://wa.me/${publicConfig.whatsappNumber}?text=${encodeURIComponent(
    WHATSAPP.prefilledMessage
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircleIcon className="size-6" />
    </a>
  );
}
