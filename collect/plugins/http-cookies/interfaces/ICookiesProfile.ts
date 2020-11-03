import IBaseProfile from "../../../interfaces/IBaseProfile";

type ICookieProfile = IBaseProfile<ICookieProfileData>;

export default ICookieProfile;

export type ICookieProfileData = (ICreatedCookieData | ICollectedCookieData)[];

export interface ICreatedCookieData {
  group: string;
  setter: ICookieSetter;
  httpProtocol: string;
  cookies: ICreatedCookies;
  url: string;
}

export interface ICollectedCookieData {
  group: string;
  getter: ICookieGetter;
  httpProtocol: string;
  cookies: ICollectedCookies;
  url: string;
}

export enum CookieSetter {
  HttpHeader = 'HttpHeader',
  JsScript = 'JsScript'
}

export enum CookieGetter {
  HttpHeader = 'HttpHeader',
  HttpAssetHeader = 'HttpAssetHeader',
  JsScript = 'JsScript'
}

export type ICookieSetter = keyof typeof CookieSetter;
export type ICookieGetter = keyof typeof CookieGetter;

export interface ICollectedCookies {
  [key: string]: string;
}

export type ICreatedCookies = string[];

