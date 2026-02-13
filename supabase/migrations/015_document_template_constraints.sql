-- Migration 015: Expand check constraints on document_templates
-- Add 'manual' provider for ManualSigningProvider (Epic 9)
-- Add document types used by Epic 9 seed data: contract, notice, authorization

ALTER TABLE document_templates DROP CONSTRAINT document_templates_provider_check;
ALTER TABLE document_templates ADD CONSTRAINT document_templates_provider_check
  CHECK (provider = ANY (ARRAY['pandadoc', 'signnow', 'manual']));

ALTER TABLE document_templates DROP CONSTRAINT document_templates_document_type_check;
ALTER TABLE document_templates ADD CONSTRAINT document_templates_document_type_check
  CHECK (document_type = ANY (ARRAY[
    'install_agreement', 'financing_agreement', 'hoa_authorization',
    'interconnection', 'change_order', 'addendum', 'other',
    'contract', 'notice', 'authorization'
  ]));
