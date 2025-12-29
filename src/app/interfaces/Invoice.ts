import { PaginationMeta } from "../response-type/Type";

export interface Invoice{
    id:number;
    invoice_number:string;
    customer_name:string;
    date:string;
    balance:number;
    amount_paid:number;
    invoice_status:string;
    sale_id:string;
    amount_total:number;
  }

  export type ResponseInvoice = {
    data:Invoice[];
    meta:PaginationMeta
  }
