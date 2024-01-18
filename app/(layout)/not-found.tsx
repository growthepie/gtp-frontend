import Link from "next/link";
import { headers } from "next/headers";

export default function NotFound() {
  const headersList = headers();
  const domain = headersList.get("host");

  return (
    <div className="flex flex-col items-center justify-center w-full h-[80vh]">
      <h2>404 Not Found</h2>
      <p>Could not find requested page</p>
      <p>
        <Link href="/">Return Home</Link>
      </p>
    </div>
  );
}
