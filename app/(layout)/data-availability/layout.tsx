import { Metadata } from 'next';
import { getPageMetadata } from "@/lib/metadata";


export async function generateMetadata(): Promise<Metadata> {
    const metadata = await getPageMetadata(
        '/data-availability',
        {}
    );

    const currentDate = new Date();
    currentDate.setHours(2, 0, 0, 0);
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");

    return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
            images: [
                {
                    url: `https://api.growthepie.com/v1/og_images/data-availability/overview.png?date=${dateString}`,
                    width: 1200,
                    height: 627,
                    alt: "growthepie.com",
                },
            ],
        },
    };
}

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    )
}