import { FormSection } from './FormSection';
import { UploadBox } from './UploadBox';

export function BrandingAuthorizationSection() {
  return (
    <FormSection icon="verified_user" title="Branding & Authorization">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[#121715]">Clinic Logo</label>
          <UploadBox
            icon="add_photo_alternate"
            title="Click to upload logo"
            hint="SVG, PNG, JPG (MAX. 2MB)"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[#121715]">Digital Signature</label>
          <UploadBox
            icon="ink_pen"
            title="Click to upload signature"
            hint="Transparent PNG preferred"
          />
        </div>
      </div>
    </FormSection>
  );
}
