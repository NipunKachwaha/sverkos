// auth.config.ts
const clientId = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default {
  providers: [
    {
      type: "customJwt",
      issuer: `https://clerk.${process.env.CLERK_DOMAIN}`,
      algorithm: "RS256",
      jwks: `https://clerk.${process.env.CLERK_DOMAIN}/.well-known/jwks.json`,
      applicationID: clientId,
    },
  ],
};