export type TenantContext = {
  tenantId: string;
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'READ_ONLY';
};

export type AttributeType =
  | 'TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'STATUS'
  | 'DATE'
  | 'BOOLEAN'
  | 'USER_REF'
  | 'OBJECT_REF';

export type AttributeValueInput = {
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: Record<string, unknown> | null;
};

export type RecordCreatePayload = {
  objectSlug: string;
  attributes: Record<string, unknown>;
};

export type SdiInvoiceSummary = {
  vatNumber: string;
  taxCode: string;
  sdiCode: string;
  companyName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currency: string;
};
