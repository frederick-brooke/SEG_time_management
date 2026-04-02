'use client';
import { Button } from "@/components/ui/Button";

import { X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/app/actions/profile";

// types
interface EditProfileFormProps {
  profile: any;
  onClose: () => void;
}

interface FormInputProps {
  id: string;
  label: string;
  defaultValue: string;
  isTextArea?: boolean;
}

// components

/**
 * Reusable form input unit.
 */
function FormInput({ id, label, defaultValue, isTextArea = false }: FormInputProps) {
  const commonClasses = "lunar-input w-full p-2.5 rounded-xl";
  
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="lunar-label">{label}</label>
      {isTextArea ? (
        <textarea
          id={id}
          name={id}
          defaultValue={defaultValue}
          className={`${commonClasses} h-24 resize-none`}
          placeholder="Tell us a bit about yourself..."
        />
      ) : (
        <input
          id={id}
          name={id}
          defaultValue={defaultValue}
          className={commonClasses}
        />
      )}
    </div>
  );
}

/**
 * Submit button that automatically handles React's pending form state.
 */
function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={`lunar-button-primary ${pending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {pending ? loadingText : text}
    </Button>
  );
}

/**
 * Renders the inline form to edit user profile details.
 * * @param {EditProfileFormProps} props - Component props.
 * @return {JSX.Element} The profile editing form.
 */
export default function EditProfileForm({ profile, onClose }: EditProfileFormProps) {
  return (
    <div className="lunar-card p-6 mt-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="lunar-label">Edit Details</h3>
        <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={16} />
        </Button>
      </div>

      <form action={updateProfile} className="space-y-4" onSubmit={() => setTimeout(onClose, 500)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput id="fname" label="First Name" defaultValue={profile.fname || ""} />
          <FormInput id="lname" label="Last Name" defaultValue={profile.lname || ""} />
        </div>

        <FormInput id="bio" label="Bio" defaultValue={profile.bio || ""} isTextArea />

        <div className="flex justify-end pt-2">
          <SubmitButton text="Save Changes" loadingText="Saving..." />
        </div>
      </form>
    </div>
  );
}