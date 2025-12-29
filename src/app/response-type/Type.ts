import { ApplicationSettingModel } from "../interfaces/ApplicationSettingModel";
import { Company } from "../interfaces/Company";
import { Manager } from "../interfaces/Manager";
import { Owner } from "../interfaces/Owner";
import { Seller } from "../interfaces/Seller";
import { Store } from "../interfaces/Store";
import { User } from "../interfaces/User";

export type MessageType = 'error-snackbar' | 'success-snackbar';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

// Créez une interface pour le mapping des libellés
export type GenderOption = {
  value: Gender;
  label: string;
}

export type AuthResponse = {
  status: boolean | 'pending_otp';
  message: string;
  requires_otp?: boolean;
  email?:string;
  isDisabled:boolean;
}

export type OtpAuthResponse = {
  status: boolean;
  requires_otp?: boolean;
  email:string;
  otp_expires_in:number;
  message:string;
}

export type CurrentUserAuth = {
  isAuthenticated:boolean;
  user:User;
  owner:Owner;
  company:Company;
  stores:Store[];
  store:Store;
  seller:Seller;
  manager:Manager;
}

export type ResponseAppSetting = {
  data:ApplicationSettingModel;
}

export type ResponseUser = {
  data:User[];
  meta:PaginationMeta;
}

export type ResponseMessage = {
    status:boolean;
    message:string;
    error:boolean;
}

export interface PaginationMeta {
    current_page: number  ;
    per_page: number;
    total: number;
    pageSizeOptions:number[]
}

export const initialPaginationMeta: PaginationMeta = {
  current_page: 1,
  per_page: 10,
  total: 0,
  pageSizeOptions: [5, 10, 25, 50, 100]
};

export type LoginResponse = {
    message: string;
    status: number;
    session_lifetime:string;
}

  export type LogoutResponse = {
    message: string;
  }

  export interface ResponsecheckStatus{
    isAuthenticated: boolean;
    user: User;
  }

  export type ResponseSite = {
    // data:Site[];
    total:number;
  }

  export interface MailSidenavLink {
    label: string;
    route: string[];
    icon: string;
    routerLinkActiveOptions?: { exact: boolean };
  }
