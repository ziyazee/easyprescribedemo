import { FIELD_BASE_CLASS, LABEL_CLASS, SECTION_WRAPPER_CLASS } from '../constants';
import { FormSection } from './FormSection';

export function PersonalDetailsSection({ values, onChange }) {
  return (
    <FormSection icon="person" title="Personal Details">
      <div className={SECTION_WRAPPER_CLASS}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="fullname">Full Name</label>
            <input className={FIELD_BASE_CLASS} id="fullname" placeholder="e.g. Dr. Rajesh Kumar" type="text" value={values.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="reg_number">Medical Registration Number</label>
            <input className={FIELD_BASE_CLASS} id="reg_number" placeholder="e.g. WBMC-12345" type="text" value={values.medicalRegistrationNumber} onChange={(e) => onChange('medicalRegistrationNumber', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="dob">Date of Birth</label>
            <input className={FIELD_BASE_CLASS} id="dob" type="date" value={values.dateOfBirth} onChange={(e) => onChange('dateOfBirth', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS} htmlFor="qualification">Qualification</label>
            <input
              className={FIELD_BASE_CLASS}
              id="qualification"
              placeholder="e.g. MBBS, MD (General Medicine)"
              type="text"
              value={values.qualification}
              onChange={(e) => onChange('qualification', e.target.value)}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
