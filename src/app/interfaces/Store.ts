import { PaginationMeta } from "../response-type/Type";

export interface Store {
  id: number;
  company_id: number;
  name: string;
  address: string;
  phone_one: string;
  phone_two?: string | null;
  phone_three?: string | null;
  email?: string | null;
  active: boolean;
}

export type StoreResponse={
  data:Store[]
  meta:PaginationMeta
}
