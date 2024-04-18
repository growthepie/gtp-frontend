import { BASE_URL } from "@/lib/helpers";

export default function Page() {
  return (
    <div>
      <h1>Env Debug</h1>
      <p>NEXT_PUBLIC_VERCEL_ENV: {process.env.NEXT_PUBLIC_VERCEL_ENV}</p>
      <p>NEXT_PUBLIC_VERCEL_URL: {process.env.NEXT_PUBLIC_VERCEL_URL}</p>
      <p>BASE_URL: {BASE_URL}</p>
    </div>
  );
}
