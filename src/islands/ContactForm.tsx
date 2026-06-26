import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../components/atoms/Button";
import { contactSchema, type ContactFormValues } from "../lib/contact-schema";

const ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormValues) => {
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
      } else {
        toast.error(json.message || "Failed to send. Please try again or email me directly.");
      }
    } catch {
      toast.error("Network error. Please email me directly at abdulmajidr708@gmail.com");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <input {...register("honeypot")} tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="cf-name" className="block text-sm font-medium text-text-primary mb-1">
          Name
        </label>
        <input
          id="cf-name"
          {...register("name")}
          placeholder="Your name"
          className={`w-full px-4 py-2.5 bg-bg-secondary border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
            errors.name ? "border-red-500" : "border-border"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cf-email" className="block text-sm font-medium text-text-primary mb-1">
          Email
        </label>
        <input
          id="cf-email"
          type="email"
          {...register("email")}
          placeholder="your@email.com"
          className={`w-full px-4 py-2.5 bg-bg-secondary border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 ${
            errors.email ? "border-red-500" : "border-border"
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-sm font-medium text-text-primary mb-1">
          Message
        </label>
        <textarea
          id="cf-message"
          {...register("message")}
          rows={4}
          placeholder="Your message..."
          className={`w-full px-4 py-2.5 bg-bg-secondary border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 resize-none ${
            errors.message ? "border-red-500" : "border-border"
          }`}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" variant="primary" size="md" loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}
