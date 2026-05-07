import type { Dispatch, SetStateAction } from "react";
import type { RestaurantProfile, TextLookup } from "../types";

type ProfileField =
  | "ownerFirstName"
  | "ownerLastName"
  | "email"
  | "name"
  | "phone"
  | "address"
  | "country"
  | "city";

interface ProfilePanelProps {
  profile: RestaurantProfile;
  profileLabels: Record<ProfileField, string>;
  text: TextLookup;
  onDeleteAccount: () => void;
  onLogoUpload: (file?: File) => void;
  onSaveProfile: () => void;
  setProfile: Dispatch<SetStateAction<RestaurantProfile>>;
}

const profileFields: ProfileField[] = [
  "ownerFirstName",
  "ownerLastName",
  "email",
  "name",
  "phone",
  "address",
  "country",
  "city",
];

export function ProfilePanel({
  profile,
  profileLabels,
  text,
  onDeleteAccount,
  onLogoUpload,
  onSaveProfile,
  setProfile,
}: ProfilePanelProps) {
  return (
    <section className="registration-form restaurant-profile-form">
      <div className="restaurant-logo-uploader">
        <div className="restaurant-logo-preview">
          {profile.logoUrl ? (
            <img alt={profile.name} src={profile.logoUrl} />
          ) : (
            <strong>{profile.name.slice(0, 1) || "S"}</strong>
          )}
        </div>
        <label className="file-upload-control compact">
          {text("restaurant.upload_logo")}
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onLogoUpload(event.target.files?.[0])}
          />
        </label>
      </div>
      {profileFields.map((field) => (
        <label key={field}>
          {profileLabels[field]}
          <input
            value={String(profile[field] ?? "")}
            onChange={(event) =>
              setProfile({ ...profile, [field]: event.target.value })
            }
          />
        </label>
      ))}
      <button
        className="public-button primary wide"
        type="button"
        onClick={() => void onSaveProfile()}
      >
        {text("common.save")}
      </button>
      <button
        className="danger-button wide"
        type="button"
        onClick={() => void onDeleteAccount()}
      >
        {text("restaurant.delete_account")}
      </button>
    </section>
  );
}
