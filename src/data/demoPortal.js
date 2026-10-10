export const DEMO_ORGANIZATIONS = [
  { id: '11111111-1111-4111-8111-111111111111', slug: 'clinica-san-miguel', name: 'Clínica San Miguel', kind: 'Clínica comunitaria', location: 'Bronx, NY' },
  { id: '22222222-2222-4222-8222-222222222222', slug: 'centro-esperanza', name: 'Centro de Salud Esperanza', kind: 'Centro de salud', location: 'Washington Heights, NY' },
  { id: '33333333-3333-4333-8333-333333333333', slug: 'hospital-la-familia', name: 'Hospital Comunitario La Familia', kind: 'Hospital comunitario', location: 'East Harlem, NY' },
];

export const DEMO_PATIENTS = [
  { id: 'p-rosa', name: 'Rosa Velázquez', language: 'Español', form: 'Paciente nuevo', status: 'En progreso', organization: 'Clínica San Miguel' },
  { id: 'p-elena', name: 'Elena Martínez', language: 'Español', form: 'Historia médica', status: 'Listo para revisar', organization: 'Clínica San Miguel' },
  { id: 'p-carlos', name: 'Carlos Rivera', language: 'Español', form: 'Consentimiento', status: 'Necesita ayuda', organization: 'Clínica San Miguel' },
];

export const DEMO_PROVIDER_FORMS = [
  { id: 'f-new', name: 'Formulario de paciente nuevo', questions: 8, language: 'English', active: true },
  { id: 'f-history', name: 'Historia médica', questions: 12, language: 'English', active: true },
  { id: 'f-consent', name: 'Consentimiento general', questions: 6, language: 'English', active: true },
];
