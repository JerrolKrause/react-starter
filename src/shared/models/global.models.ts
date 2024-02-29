/**
 * Models automatically generated from swagger with nswagstudio
 *
 * Generate models with NSwagStudio: https://github.com/RSuter/NSwag/wiki/NSwagStudio
 * Make sure to point at the docs url in the top green header
 * IE http://localhost:57462/swagger/docs/v1
 * NOT http://localhost:57462/swagger/ui/index#/

 Config Options:
  - Set namespace to Models
  - TS version 2.7
  - Generate DTO types: Checked
  - Type Style: Interface
  - Null Value: Null
  - Leave everything else blank or unchecked here
  - Remove redundent " | undefined" from each one
 */
export module Models {
  /********************************
   *  BEGIN CUSTOM GLOBAL MODELS
   ********************************/
  export interface User {
    id?: number;
    name?: string;
    username?: string;
    email?: string;
    address?: {
      street?: string;
      suite?: string;
      city?: string;
      zipcode?: string;
      geo?: {
        lat?: string;
        lng?: string;
      };
    };
    phone?: string;
    website?: string;
    company?: {
      name?: string;
      catchPhrase?: string;
      bs?: string;
    };
  }

  export interface Post {
    id?: number;
    userId?: string;
    title?: string;
    body?: string;
  }

  export interface AuthState {
    isLoggedIn: boolean;
    token: string | null;
    user?: User | null;
  }

  export interface IFormFields {
    email: string;
    firstName: string;
    lastName: string;
  }
  export interface IAdaptedMUIdata {
    name: string;
    email: string;
    address: string;
    phone: string;
  }

  export interface Name {
    title: string;
    first: string;
    last: string;
  }

  export interface Street {
    number: number;
    name: string;
  }

  export interface Coordinates {
    latitude: string;
    longitude: string;
  }

  export interface Timezone {
    offset: string;
    description: string;
  }

  export interface Location {
    street: Street;
    city: string;
    state: string;
    country: string;
    postcode: number;
    coordinates: Coordinates;
    timezone: Timezone;
  }

  export interface Login {
    uuid: string;
    username: string;
    password: string;
    salt: string;
    md5: string;
    sha1: string;
    sha256: string;
  }

  export interface Dob {
    date: Date;
    age: number;
  }

  export interface Registered {
    date: Date;
    age: number;
  }

  export interface Id {
    name: string;
    value: string;
  }

  export interface Picture {
    large: string;
    medium: string;
    thumbnail: string;
  }

  export interface IResult {
    gender: string;
    name: Name;
    location: Location;
    email: string;
    login: Login;
    dob: Dob;
    registered: Registered;
    phone: string;
    cell: string;
    id: Id;
    picture: Picture;
    nat: string;
  }

  export interface Info {
    seed: string;
    results: number;
    page: number;
    version: string;
  }

  export interface IRootObject {
    results: IResult[];
    info: Info;
  }

  export interface IStyleProps {
    style: any;
  }
  export interface IChildrenProps {
    children?: React.ReactNode;
  }
  interface IServiceRenderer {
    (data: Array<IResult>): React.ReactNode;
  }
  export interface IStarterContext {
    HTMLtitlePre: string;
    JSONdata: IResult[];
    serviceRenderer: IServiceRenderer;
  }

  /********************************
   *  END CUSTOM GLOBAL MODELS
   ********************************/

  /********************************
   *  BEGIN NSWAG STUDIO COPY/PASTE
   ********************************/
  /********************************
   *  END NSWAG STUDIO COPY/PASTE
   ********************************/
}
