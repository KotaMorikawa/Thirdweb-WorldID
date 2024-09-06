"use server";

import { cookies } from "next/headers";

export const deleteAuthTokenCookie = () => {
  cookies().delete("temp_auth_token");
};

export const deleteAuthErrorCookie = () => {
  cookies().delete("temp_auth_error");
};
