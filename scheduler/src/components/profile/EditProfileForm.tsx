/**
 * @file EditProfileForm.tsx
 * @description An inline form component for updating user profile details (name and bio). 
 */
'use client';

import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { updateProfile } from "@/app/actions/profile";

const CLOSE_DELAY_MS = 500;

interface Profile {
  fname?: string;
  lname?: string;
  bio?: string;
}

interface EditProfileFormProps {
  profile: Profile;
  onClose: () => void;
}

interface FormInputProps {
  id: string;
  label: string;
  defaultValue: string;
  isTextArea?: boolean;
}

/**
 * Reusable form input unit to maintain DRY markup.
 *
 * @param {FormInputProps} props - Component props.
 * @returns {JSX.Element} A labelled input or textarea field.
 */
function FormInput({ id, label, defaultValue, isTextArea = false }: FormInputProps) {
  const baseClass = "lunar-input w-full p-2.5 rounded-xl";

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="lunar-label">{label}</label>
      {isTextArea ? (
        <textarea
          id={id}
          name={id}
          defaultValue={defaultValue}
          className={`${baseClass} h-24 resize-none`}
          placeholder="Tell us a bit about yourself..."
        />
      ) : (
        <input
          id={id}
          name={id}
          defaultValue={defaultValue}
          className={baseClass}
        />
      )}
    </div>
  );
}

/**
 * Submit button that automatically handles React's pending form state.
 *
 * @param {{ text: string; loadingText: string }} props - Component props.
 * @returns {JSX.Element} A submit button reflecting the current form state.
 */
function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  const pendingClass = pending ? "opacity-50 cursor-not-allowed" : "";

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`lunar-button-primary ${pendingClass}`}
    >
      {pending ? loadingText : text}
    </Button>
  );
}

/**
 * Renders the inline form to edit user profile details.
 *
 * @param {EditProfileFormProps} props - Component props.
 * @returns {JSX.Element} The profile editing form.
 */
export default function EditProfileForm({ profile, onClose }: EditProfileFormProps) {
  const handleSubmit = () => setTimeout(onClose, CLOSE_DELAY_MS);

  return (
    <div className="lunar-card p-6 mt-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="lunar-label">Edit Details</h3>
        <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X size={16} />
        </Button>
      </div>

      <form action={updateProfile} className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput id="fname" label="First Name" defaultValue={profile.fname ?? ""} />
          <FormInput id="lname" label="Last Name" defaultValue={profile.lname ?? ""} />
        </div>

        <FormInput id="bio" label="Bio" defaultValue={profile.bio ?? ""} isTextArea />

        <div className="flex justify-end pt-2">
          <SubmitButton text="Save Changes" loadingText="Saving..." />
        </div>
      </form>
    </div>
  );
}