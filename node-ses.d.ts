import { Response } from "request";

declare module "node-ses" {
  export type Emails = string | string[];
  export interface MessageTag {
    name: string;
    value: any;
  }
  export interface sendEmailOptions {
    from: string;
    subject: string;
    message: string;
    altText?: string;
    to?: Emails;
    cc?: Emails;
    bcc?: Emails;
    replyTo?: string;
    configurationSet?: string;
    messageTags?: MessageTag[];
    key?: string;
    secret?: string;
    amazon?: string;
  }
  export interface sendRawEmailOptions {
    from: string;
    rawMessage: string;
  }
  export interface SendEmailResult {
    MessageId: string;
  }
  export interface ResponseMetadata {
    RequestId: string;
  }
  export interface SendEmailResponse {
    SendEmailResult: SendEmailResult;
    ResponseMetadata: ResponseMetadata;
  }
  export interface SendEmailData {
    SendEmailResponse: SendEmailResponse;
  }
  export interface SendEmailError {
    Type: string;
    Code: string;
    Message: string;
    Detail?: string;
  }
  export type Callback = (
    error: SendEmailError,
    data: SendEmailData,
    response: Response
  ) => any;
  export interface Client {
    sendEmail(options: sendEmailOptions, callback: Callback): void;
    sendemail(options: sendEmailOptions, callback: Callback): void;
    sendRawEmail(options: sendRawEmailOptions, callback: Callback): void;
  }
  export function createClient({
    key,
    secret,
    amazon
  }: {
    key: string;
    secret: string;
    amazon?: string;
  }): Client;
}
