import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "../components/atoms/FormField";
import { Input } from "../components/atoms/Input";
import { InteractionButton } from "../components/atoms/InteractionButton";
import { Textarea } from "../components/atoms/Textarea";
import { type ContactFormValues, contactSchema } from "../lib/contact-schema";

const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY || "YOUR_ACCESS_KEY_HERE";

if (import.meta.env.DEV && !import.meta.env.PUBLIC_WEB3FORMS_ACCESS_KEY) {
  // Dev-only warning: tanpa key, submit akan gagal di production juga. Set PUBLIC_WEB3FORMS_ACCESS_KEY di .env.
  console.error(
    "[ContactForm] PUBLIC_WEB3FORMS_ACCESS_KEY tidak diset — memakai fallback placeholder. Set key di .env agar pesan benar-benar terkirim.",
  );
}

export default function ContactForm() {
  const {
    register,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (): Promise<boolean> => {
    const isValid = await trigger();
    if (!isValid) return false;

    const data = getValues();
    try {
      const formData = new FormData();
      formData.append("access_key", ACCESS_KEY);
      formData.append("subject", "New contact from portfolio");
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("message", data.message);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (json.success) {
        toast.success("Message sent successfully! I'll get back to you soon.");
        reset();
        return true;
      }
      toast.error(json.message || "Failed to send. Please try again or email me directly.");
      return false;
    } catch {
      toast.error("Network error. Please email me directly at abdulmajidr708@gmail.com");
      return false;
    }
  };

  const nameErrorId = "cf-name-error";
  const emailErrorId = "cf-email-error";
  const messageErrorId = "cf-message-error";

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
      </div>

      <FormField id="cf-name" label="Name" error={errors.name?.message}>
        <Input
          id="cf-name"
          {...register("name")}
          placeholder="Your name"
          error={!!errors.name}
          aria-describedby={errors.name ? nameErrorId : undefined}
          className="transition-all duration-200 focus-visible:border-transparent"
        />
      </FormField>

      <FormField id="cf-email" label="Email" error={errors.email?.message}>
        <Input
          id="cf-email"
          type="email"
          {...register("email")}
          placeholder="your@email.com"
          error={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
          className="transition-all duration-200 focus-visible:border-transparent"
        />
      </FormField>

      <FormField id="cf-message" label="Message" error={errors.message?.message}>
        <Textarea
          id="cf-message"
          {...register("message")}
          rows={4}
          placeholder="Your message..."
          error={!!errors.message}
          aria-describedby={errors.message ? messageErrorId : undefined}
          className="transition-all duration-200 resize-none focus-visible:border-transparent"
        />
      </FormField>

      <InteractionButton
        type="submit"
        variant="primary"
        size="md"
        onClick={onSubmit}
        feedbackDuration={3000}
      >
        Send Message
      </InteractionButton>
    </form>
  );
}
