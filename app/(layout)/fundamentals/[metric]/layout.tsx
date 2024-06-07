import { Metadata, ResolvingMetadata } from "next";
import { navigationItems } from "@/lib/navigation";
import { MetricsResponse } from "@/types/api/MetricsResponse";
import { MetricsURLs } from "@/lib/urls";
import { CompleteDataFeed, WithContext } from "schema-dts";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import Image from "next/image";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import { notFound } from "next/navigation";
import { track } from "@vercel/analytics/server";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import StableInsights from "@/components/layout/StableInsights";

type Props = {
  params: { metric: string };
};

const unitsMap = {
  value: "",
  usd: "USD",
  eth: "ETH",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (
    !params.metric ||
    navigationItems
      .find((item) => item.label === "Fundamentals")
      ?.options.find((item) => item.urlKey === params.metric) === undefined
  ) {
    track("404 Error", {
      location: "404 Error",
      page: "/fundamentals/" + params.metric,
    });
    return notFound();
  }

  const option = navigationItems
    .find((item) => item.label === "Fundamentals")
    ?.options.find((item) => item.urlKey === params.metric);

  if (option) {
    const currentDate = new Date();
    // Set the time to 2 am
    currentDate.setHours(2, 0, 0, 0);
    // Convert the date to a string in the format YYYYMMDD (e.g., 20240424)
    const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
    return {
      title: option.page?.title,
      description: option.page?.why,
      openGraph: {
        images: [
          {
            url: `https://api.growthepie.xyz/v1/og_images/fundamentals/${params.metric}.png?date=${dateString}`,
            width: 1200,
            height: 627,
            alt: "growthepie.xyz",
          },
        ],
      },
    };
  }

  return {
    title: "Metric not found",
    description: "Metric not found",
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { metric: string };
}) {
  const url = MetricsURLs[params.metric];

  const pageData = navigationItems[1]?.options.find(
    (item) => item.urlKey === params.metric,
  )?.page ?? {
    title: "",
    description: "",
    icon: "",
  };

  console.log(pageData);

  let jsonLd: null | WithContext<CompleteDataFeed> = null;

  // if (url) {
  //   // fetch data from API
  //   const res: MetricsResponse = await fetch(MetricsURLs[params.metric], {
  //     cache: "no-store",
  //   }).then((r) => r.json());

  //   if (res && res.data && res.data.chains) {
  //     jsonLd = {
  //       "@context": "https://schema.org",
  //       "@type": "CompleteDataFeed",
  //       name: res.data.metric_name,
  //       dateModified: new Date(
  //         res.data.chains[Object.keys(res.data.chains)[0]].daily.data[
  //           res.data.chains[Object.keys(res.data.chains)[0]].daily.data.length -
  //             1
  //         ][
  //           res.data.chains[
  //             Object.keys(res.data.chains)[0]
  //           ].daily.types.indexOf("unix")
  //         ],
  //       ).toISOString(),
  //       description: "growthepie",
  //       dataFeedElement: Object.keys(res.data.chains).map((chain) => ({
  //         "@type": "DataFeedItem",
  //         dateModified: new Date(
  //           res.data.chains[Object.keys(res.data.chains)[0]].daily.data[
  //             res.data.chains[Object.keys(res.data.chains)[0]].daily.data
  //               .length - 1
  //           ][
  //             res.data.chains[
  //               Object.keys(res.data.chains)[0]
  //             ].daily.types.indexOf("unix")
  //           ],
  //         ).toISOString(),
  //         item: {
  //           "@type": "PropertyValue",
  //           dateModified: new Date(
  //             res.data.chains[chain].daily.data[
  //               res.data.chains[chain].daily.data.length - 1
  //             ][res.data.chains[chain].daily.types.indexOf("unix")],
  //           ).toISOString(),
  //           name: res.data.chains[chain].chain_name,
  //           value: `${
  //             Math.round(
  //               res.data.chains[chain].daily.data[
  //                 res.data.chains[chain].daily.data.length - 1
  //               ][1] * 100,
  //             ) / 100
  //           } ${unitsMap[res.data.chains[chain].daily.types[1]]}`,
  //         },
  //       })),
  //     };
  //   }
  // }

  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px]">
        <div className="flex justify-between items-start w-full mb-[15px]">
          <div className=" block md:flex items-center ">
            <div className="flex items-center mb-[5px]">
              <Image
                src="/GTP-Fundamentals.svg"
                alt="GTP Chain"
                className="object-contain w-[32px] h-[32px] mr-[8px]"
                height={36}
                width={36}
              />
              <Heading className="text-[36px] leading-snug " as="h1">
                {pageData.title}
              </Heading>
            </div>
            <div className=" md:p-0 md:mb-[5px] pl-[28px]">
              <Link
                href="https://fees.growthepie.xyz/"
                className={`flex items-center justify-center ml-[15px] h-[37px] w-[207px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full  ${
                  params.metric === "transaction-costs" ? "flex" : "hidden"
                }`}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex items-center h-[35px] pl-[5px] w-[205px] gap-x-[8px] font-semibold bg-forest-50 dark:bg-forest-900 rounded-full transition-all duration-300">
                  <div className="w-[24px] h-[24px] bg-[#151A19] rounded-full flex items-center justify-center">
                    <Icon
                      icon="gtp:detailed-fees"
                      className="w-[15px] h-[15px]"
                    />
                  </div>
                  <div className="transition-all duration-300 whitespace-nowrap overflow-hidden text-[14px] font-semibold">
                    Detailed Fees Overview
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <Subheading
          className="text-[16px] mb-[30px] w-[99.5%] mx-auto"
          iconContainerClassName="items-center mb-[15px] md:mb-[32px] relative"
        >
          {typeof pageData.description === "string" &&
          pageData.description.includes("L2Beat.com.") ? (
            <div>
              <p>
                {pageData.description.replace("L2Beat.com.", "")}

                <a
                  className="hover:underline"
                  target="_blank"
                  href="https://l2beat.com/scaling/tvl"
                >
                  L2Beat.com
                </a>
              </p>
            </div>
          ) : (
            pageData.description
          )}

          {pageData.tags && (
            <div className="flex items-center mt-[5px]">
              {pageData.tags.map((tag, i) => (
                <div key={i}>{tag}</div>
              ))}
            </div>
          )}
        </Subheading>
      </Container>
      {/* {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )} */}
      {children}
      <Container className="flex flex-col space-y-[15px] mt-[30px]">
        <QuestionAnswer
          className="rounded-3xl bg-forest-50 dark:bg-forest-900 px-[63px] py-[23px] flex flex-col"
          question={`What does ${pageData.title} tell you?`}
          answer={pageData.why}
          note={
            pageData.note && (
              <div className="text-xs">
                <span className="font-semibold text-forest-200 dark:text-forest-400">
                  Note:{" "}
                </span>
                {pageData.note}
              </div>
            )
          }
          startOpen
        />
      </Container>
      <Container className="mt-[60px]">
        <StableInsights />
      </Container>
    </>
  );
}
