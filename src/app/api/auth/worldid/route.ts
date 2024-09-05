import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import jwt from "jsonwebtoken";
import { WORLDID_OIDC_CONFIG } from "@/lib/worldid-config";

function formatPrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    // Authorization codeをトークンと交換
    const tokenResponse = await fetch(WORLDID_OIDC_CONFIG.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${WORLDID_OIDC_CONFIG.clientId}:${WORLDID_OIDC_CONFIG.clientSecret}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: WORLDID_OIDC_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: 401 }
      );
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.json(
        { error: "No ID token provided" },
        { status: 401 }
      );
    }

    // IDトークンの検証
    const JWKS = jose.createRemoteJWKSet(new URL(WORLDID_OIDC_CONFIG.jwksUri));
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: WORLDID_OIDC_CONFIG.issuer,
      audience: WORLDID_OIDC_CONFIG.clientId,
    });

    if (!payload || !payload.sub) {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }

    const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY;
    if (!JWT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "JWT private key not provided" },
        { status: 500 }
      );
    }

    const [header] = idToken.split(".");
    const decodedHeader = JSON.parse(atob(header));
    const kid = decodedHeader.kid;

    const thirdwebPayload = {
      iss: WORLDID_OIDC_CONFIG.baseUri,
      sub: payload.sub,
      aud: process.env.THIRDWEB_CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const formattedKey = formatPrivateKey(JWT_PRIVATE_KEY);

    const thirdwebToken = jwt.sign(thirdwebPayload, formattedKey, {
      algorithm: "RS256",
      keyid: kid,
    });

    // クライアントにトークンを返す
    return NextResponse.redirect(
      new URL(
        `${WORLDID_OIDC_CONFIG.baseUri}/?token=${thirdwebToken}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error during WorldID authentication:", error);
    return NextResponse.redirect(
      new URL(`${WORLDID_OIDC_CONFIG.baseUri}/?error=auth_failed`, request.url)
    );
  }
}
