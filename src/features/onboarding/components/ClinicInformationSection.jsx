import { FIELD_BASE_CLASS, LABEL_CLASS, SECTION_WRAPPER_CLASS } from '../constants';
import { FormSection } from './FormSection';
import { UploadBox } from './UploadBox';

export function ClinicInformationSection({ values, onChange }) {
  return (
    <FormSection icon="apartment" title="Clinic Information">
      <div className={SECTION_WRAPPER_CLASS}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="clinic_name">Clinic Name</label>
            <input className={FIELD_BASE_CLASS} id="clinic_name" placeholder="e.g. Life Care Polyclinic" type="text" value={values.clinicName} onChange={(e) => onChange('clinicName', e.target.value)} />
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="address">Address</label>
            <textarea
              className={`${FIELD_BASE_CLASS} resize-none`}
              id="address"
              placeholder="Street Address, Area"
              rows="2"
              value={values.address}
              onChange={(e) => onChange('address', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="city">City</label>
            <div className="relative">
              <input className={FIELD_BASE_CLASS} id="city" placeholder="e.g. Asansol" type="text" value={values.city} onChange={(e) => onChange('city', e.target.value)} />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#67837a]">
                <span className="material-symbols-outlined text-[20px]">location_city</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="state">State</label>
            <div className="relative">
              <select className={`${FIELD_BASE_CLASS} appearance-none`} id="state" value={values.state} onChange={(e) => onChange('state', e.target.value)}>
                <option disabled value="">Select State</option>
                <option value="WB">West Bengal</option>
                <option value="MH">Maharashtra</option>
                <option value="DL">Delhi</option>
                <option value="KA">Karnataka</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#67837a]">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="contact">Clinic Contact Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#67837a] text-base border-r border-[#dde4e2] pr-3 my-2">
                +91
              </span>
              <input className={`${FIELD_BASE_CLASS} pl-16`} id="contact" placeholder="98765 43210" type="tel" value={values.clinicContactNumber} onChange={(e) => onChange('clinicContactNumber', e.target.value)} />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Clinic Logo</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">This logo will appear on patient prescriptions and reports.</p>
              <UploadBox icon="add_photo_alternate" title="Upload Clinic Logo" hint="PNG, JPG up to 2 MB" value={values.clinicLogo} onChange={(v) => onChange('clinicLogo', v)} variant="logo" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Digital Signature</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Sign on a clean white paper and upload the photo.</p>
              <UploadBox icon="draw" title="Upload Signature" hint="Transparent PNG preferred" value={values.digitalSignature} onChange={(v) => onChange('digitalSignature', v)} variant="signature" />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
