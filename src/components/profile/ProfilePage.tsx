"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { formatErrorForUser } from "@memberstack/dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SectionHeading from "@/components/dashboard/SectionHeading";
import FoundationCard from "@/components/dashboard/FoundationCard";
import CommunityFooterCard from "@/components/dashboard/CommunityFooterCard";
import { foundationCards, navSections } from "@/data/dashboard";
import { getMemberstack } from "@/lib/memberstack";
import {
  customFieldsForLegal,
  customFieldsForMasqueProfile,
  customFieldsForUploadedDetails,
  emptyProfileForm,
  getMemberInitials,
  mapMemberToHeaderUser,
  mapMemberToProfileForm,
} from "@/lib/profile-memberstack";
import type { MemberstackUser } from "@/types/dashboard";
import type { ProfileFormData } from "@/types/profile";
import ProfilePhotoPanel from "./ProfilePhotoPanel";
import ProfileField from "./ProfileField";

type ProfileSection = "masque-profile" | "legal" | "uploaded-details";

const EMPTY_HEADER_USER: MemberstackUser = {
  name: "",
  initials: "",
  email: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileFormData>(emptyProfileForm);
  const [headerUser, setHeaderUser] =
    useState<MemberstackUser>(EMPTY_HEADER_USER);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savingSection, setSavingSection] = useState<ProfileSection | null>(
    null,
  );
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [sectionMessage, setSectionMessage] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const loadMember = useCallback(async () => {
    setIsLoading(true);
    setSectionError(null);
    setSectionMessage(null);

    try {
      const memberstack = getMemberstack();
      const { data: member } = await memberstack.getCurrentMember();

      if (!member) {
        setIsAuthenticated(false);
        setForm(emptyProfileForm);
        setHeaderUser(EMPTY_HEADER_USER);
        return;
      }

      setIsAuthenticated(true);
      setForm(mapMemberToProfileForm(member));
      setHeaderUser(mapMemberToHeaderUser(member));
    } catch (err) {
      setIsAuthenticated(false);
      setForm(emptyProfileForm);
      setHeaderUser(EMPTY_HEADER_USER);
      setSectionError(
        formatErrorForUser(err) || "Unable to load your profile.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  const updateField =
    (key: keyof ProfileFormData) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleUpdate =
    (section: ProfileSection) => async (event: FormEvent) => {
      event.preventDefault();
      if (!isAuthenticated || savingSection) return;

      setSavingSection(section);
      setSectionError(null);
      setSectionMessage(null);

      const customFields =
        section === "masque-profile"
          ? customFieldsForMasqueProfile(form)
          : section === "legal"
            ? customFieldsForLegal(form)
            : customFieldsForUploadedDetails(form);

      try {
        const memberstack = getMemberstack();
        const { data: updated } = await memberstack.updateMember({
          customFields,
        });

        if (updated) {
          setForm(mapMemberToProfileForm(updated));
          setHeaderUser(mapMemberToHeaderUser(updated));
        } else {
          const { data: member } = await memberstack.getCurrentMember();
          if (member) {
            setForm(mapMemberToProfileForm(member));
            setHeaderUser(mapMemberToHeaderUser(member));
          }
        }

        setSectionMessage("Profile updated.");
      } catch (err) {
        setSectionError(
          formatErrorForUser(err) || "Unable to update your profile.",
        );
      } finally {
        setSavingSection(null);
      }
    };

  const handlePhotoChange = async (file: File, previewUrl: string) => {
    setForm((prev) => ({ ...prev, profilePhotoUrl: previewUrl }));
    if (!isAuthenticated) return;

    setIsUploadingPhoto(true);
    setSectionError(null);
    setSectionMessage(null);

    try {
      const memberstack = getMemberstack();
      const { data } = await memberstack.updateMemberProfileImage({
        profileImage: file,
      });

      if (data?.profileImage) {
        setForm((prev) => ({
          ...prev,
          profilePhotoUrl: data.profileImage,
        }));
      }
    } catch (err) {
      setSectionError(
        formatErrorForUser(err) || "Unable to update your profile photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const initials = getMemberInitials(form.firstName, form.lastName);
  const formsDisabled = isLoading || !isAuthenticated || Boolean(savingSection);

  return (
    <DashboardLayout user={headerUser} navSections={navSections}>
      {isLoading ? (
        <p className="profile-field__helper">Loading profile…</p>
      ) : !isAuthenticated ? (
        <p className="profile-field__helper">
          Please sign in to view your profile.
        </p>
      ) : (
        <>
          <SectionHeading badge="Visible to community">
            Masqué Profile
          </SectionHeading>

          <ProfilePhotoPanel
            initials={initials}
            photoUrl={form.profilePhotoUrl}
            disabled={formsDisabled || isUploadingPhoto}
            onPhotoChange={handlePhotoChange}
          />

          <form
            className="profile-section"
            onSubmit={handleUpdate("masque-profile")}
          >
            <div className="profile-form-grid">
              <ProfileField
                label="Masqué Profile Name"
                name="profileName"
                value={form.profileName}
                onChange={updateField("profileName")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Display Name Preference"
                name="displayName"
                value={form.displayName}
                onChange={updateField("displayName")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Bio (Coming soon)"
                name="bio"
                value={form.bio}
                onChange={updateField("bio")}
                fullWidth
                readOnly
              />
            </div>
            <div className="profile-actions">
              <button
                type="submit"
                className="profile-update-btn"
                disabled={formsDisabled}
              >
                {savingSection === "masque-profile" ? "Updating..." : "Update"}
              </button>
            </div>
          </form>

          <SectionHeading badge="Masqué only">Legal Information</SectionHeading>

          <form
            className="profile-section profile-section--card"
            onSubmit={handleUpdate("legal")}
          >
            <div className="profile-form-grid">
              <ProfileField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={updateField("firstName")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={updateField("lastName")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={updateField("dateOfBirth")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={updateField("phone")}
                disabled={formsDisabled}
              />
              <ProfileField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                fullWidth
                readOnly
              />
            </div>
            <div className="profile-actions">
              <button
                type="submit"
                className="profile-update-btn"
                disabled={formsDisabled}
              >
                {savingSection === "legal" ? "Updating..." : "Update"}
              </button>
            </div>
          </form>

          <SectionHeading>Uploaded Details</SectionHeading>

          <div className="profile-onboarding-tag">On Boarding</div>

          <form
            className="profile-section"
            onSubmit={handleUpdate("uploaded-details")}
          >
            <div className="profile-form-grid">
              <div className="profile-form-col">
                <ProfileField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={updateField("address")}
                  disabled={formsDisabled}
                />
                <ProfileField
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={updateField("state")}
                  disabled={formsDisabled}
                />
                <ProfileField
                  label="Instagram Handle"
                  name="instagram"
                  value={form.instagram}
                  onChange={updateField("instagram")}
                  helperText="Enter your Instagram username only (e.g. john_smith). Do not include @ or a URL."
                  disabled={formsDisabled}
                />
              </div>

              <div className="profile-form-col">
                <ProfileField
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={updateField("city")}
                  disabled={formsDisabled}
                />
                <ProfileField
                  label="Zip Code"
                  name="zipCode"
                  value={form.zipCode}
                  onChange={updateField("zipCode")}
                  disabled={formsDisabled}
                />
                <ProfileField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={updateField("gender")}
                  disabled={formsDisabled}
                />
              </div>
            </div>
            <div className="profile-actions">
              <button
                type="submit"
                className="profile-update-btn"
                disabled={formsDisabled}
              >
                {savingSection === "uploaded-details"
                  ? "Updating..."
                  : "Update"}
              </button>
            </div>
          </form>

          {sectionError ? (
            <p role="alert" className="profile-photo-panel__error">
              {sectionError}
            </p>
          ) : null}
          {sectionMessage ? (
            <p className="profile-field__helper">{sectionMessage}</p>
          ) : null}

          <SectionHeading>Community Foundation</SectionHeading>
          <div className="foundation-grid">
            {foundationCards.map((card) => (
              <FoundationCard key={card.id} card={card} />
            ))}
          </div>

          <CommunityFooterCard />
        </>
      )}
    </DashboardLayout>
  );
}
