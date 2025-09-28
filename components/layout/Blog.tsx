"use client";
import { request, gql } from "graphql-request";
import ReactJson from "react-json-view";
import useSWR from "swr";
// import { remark } from "remark";
// import remarkParse from "remark-parse";
// import html from "remark-html";
import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import ShowLoading from "@/components/layout/ShowLoading";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import _ from "lodash";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const fetcher: any = (query: string) =>
  request("https://arweave.net/graphql", query);

type Transactions = {
  edges: {
    node: {
      id: string;
      tags: {
        name: string;
        value: string;
      }[];
      owner: {
        address: string;
        key: string;
      };
    };
  }[];
};

type FetchResponse = {
  transactions: Transactions;
  firstTransactions?: Transactions;
};

// alana: 0x26f35e0F8F3030907044aC0a43e72c1A17284137
// gtp: 0x9438b8B447179740cD97869997a2FCc9b4AA63a2

const TRANSACTIONS_QUERY = gql`
  query Transactions {
    transactions(
      tags: [
        { name: "App-Name", values: ["MirrorXYZ"] }
        {
          name: "Contributor"
          values: ["0x9438b8B447179740cD97869997a2FCc9b4AA63a2"]
        }
      ]
      sort: HEIGHT_DESC
      first: 200
    ) {
      edges {
        node {
          id
          anchor
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
          tags {
            name
            value
          }
          block {
            id
            timestamp
            height
            previous
          }
          parent {
            id
          }
        }
      }
    }
  }
`;

export function Blog({ params }: { params: any }) {
  const { data, error, isLoading, isValidating } = useSWR<FetchResponse>(
    TRANSACTIONS_QUERY,
    fetcher,
  );

  const TagsByUniqueOriginalContentDigest = useMemo<
    {
      originalContentDigest: string;
      contentDigest: string;
    }[]
  >(() => {
    if (!data) return [];

    let tags: {
      originalContentDigest: string;
      contentDigest: string;
    }[] = [];

    for (let i = 0; i < data.transactions.edges.length; i++) {
      const edge = data.transactions.edges[i];
      const originalContentDigest = edge.node.tags.find(
        (tag) => tag.name === "Original-Content-Digest",
      )?.value;
      const contentDigest = edge.node.tags.find(
        (tag) => tag.name === "Content-Digest",
      )?.value;

      if (originalContentDigest && contentDigest) {
        tags.push({
          originalContentDigest,
          contentDigest,
        });
      }
    }

    return _.uniqBy(tags, "originalContentDigest");
    // return tags;
  }, [data]);

  return (
    <>
      <ShowLoading dataLoading={[isLoading]} dataValidating={[isValidating]} />
      <Container className="flex flex-col w-full mt-[25px] md:mt-[25px]">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[50px]">
              Blog
            </Heading>
          </div>
        </div>
        {/* <pre className="w-full">{JSON.stringify(data, null, 2)}</pre> */}
        <div className="grid grid-cols-1 gap-8 mx-auto max-w-3xl">
          {data && (
            <Digest
              tags={{
                originalContentDigest: params.originalContentDigest,
                contentDigest: params.contentDigest,
              }}
              type="full"
            />
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {data &&
              TagsByUniqueOriginalContentDigest.map((value) => {
                return (
                  <Digest
                    key={value.originalContentDigest}
                    tags={value}
                    type="card"
                  />
                );
              })}
          </div>
        </div>
      </Container>
    </>
  );
}

export const Digest = ({
  tags,
  type,
}: {
  tags: {
    originalContentDigest: string;
    contentDigest: string;
  };
  type?: "card" | "preview" | "full";
}) => {
  const DIGEST_QUERY = gql`
  query Transactions {
    transactions(
      tags: [
        { name: "App-Name", values: ["MirrorXYZ"] }
        {
          name: "Original-Content-Digest"
          values: ["${tags.originalContentDigest}"]
        }
      ]
      sort: HEIGHT_DESC
    ) {
      edges {
        node {
          id
          anchor
          signature
          recipient
          owner {
            address
            key
          }
          fee {
            winston
            ar
          }
          quantity {
            winston
            ar
          }
          data {
            size
            type
          }
          tags {
            name
            value
          }
          block {
            id
            timestamp
            height
            previous
          }
          parent {
            id
          }
        }
      }
    }
  }
`;
  const { data, error, isLoading, isValidating } = useSWR<FetchResponse>(
    DIGEST_QUERY,
    fetcher,
  );

  return (
    <>
      {data && (
        <BlogPost
          key={data.transactions.edges[0].node.id}
          lastTransactionId={data.transactions.edges[0].node.id}
          allTransactions={data.transactions.edges}
          type={type}
          tags={tags}
        />
      )}
    </>
  );
};

export const BlogPost = ({
  lastTransactionId,
  allTransactions,
  type,
  tags,
}: {
  lastTransactionId: string;
  allTransactions: any[];
  type?: "card" | "preview" | "full";
  tags: {
    originalContentDigest: string;
    contentDigest: string;
  };
}) => {
  const { data, error } = useSWR(`https://arweave.net/${lastTransactionId}`);

  // const processed = useMemo(() => {
  //   if (!data) return null;
  //   return remark().use(html).processSync(data.content.body).toString();
  // }, [data]);

  const formatForUrl = (title: string) => {
    // strip any non alphanumeric characters
    let formattedTitle = title.replace(/[^a-zA-Z0-9 ]/g, "");
    // replace all spaces with hyphens
    formattedTitle = formattedTitle.replace(/\s+/g, "-").toLowerCase();
    return formattedTitle;
  };

  if (!data) return <div>Loading...</div>;

  if (type === "card")
    return (
      <Link
        href={`/blog/${tags.originalContentDigest}/${formatForUrl(
          data.content.title,
        )}`}
      >
        <div className="rounded-3xl bg-forest-50 dark:bg-forest-900 flex flex-col">
          <BlogImage allTransactions={allTransactions} />
          <div className="flex flex-col justify-between p-3 md:p-4 relative">
            <h2 className="leading-snug text-[14px] md:text-[18px] lg:text-[24px] mb-[15px] md:mb-[30px] font-semibold">
              {data.content.title}
            </h2>
            {/* <div className="flex flex-col w-full overflow-hidden relative">
            <div className="absolute bottom-0 right-0 left-0 top-2/3 from-forest-900 via-forest-900/50 to-transparent bg-gradient-to-t "></div>
          </div> */}
            <div className="flex justify-start w-full sm:justify-between text-xs md:text-base">
              {/* <div className="hidden sm:flex text-color-text-primary bg-color-bg-default dark:bg-color-ui-hover dark:text-forest-300 font-semibold rounded-full px-2 py-0 leading-tight items-center">
                {(data.authorship.contributor as string).slice(0, 6)}
              </div> */}
              <div>{moment.unix(data.content.timestamp).fromNow()}</div>
            </div>
          </div>
        </div>
      </Link>
    );

  if (type === "preview")
    return (
      <Link
        href={`/blog/${tags.originalContentDigest}/${formatForUrl(
          data.content.title,
        )}`}
      >
        <div className="rounded-3xl bg-forest-50 dark:bg-forest-900 flex h-[150px] lg:h-[250px] xl:h-[300px] overflow-hidden">
          <div className="flex h-[150px] lg:h-[250px] xl:h-[300px]">
            <BlogImage allTransactions={allTransactions} type="preview" />
          </div>
          <div className="flex flex-col flex-1 justify-between p-3 md:p-4 relative h-full">
            <h2 className="leading-snug text-[16px] md:text-[22px] lg:text-[28px] mb-[15px] md:mb-[30px] font-semibold">
              {data.content.title}
            </h2>
            <div className="hidden sm:flex flex-col w-full overflow-hidden relative">
              {data && (
                <ReactMarkdown
                  // className="blog"
                  components={{
                    img: ({ node, ...props }) => {
                      return (
                        <figure className="flex flex-col justify-center py-3">
                          <img {...props} />
                          <figcaption className="text-center text-base text-color-text-primary dark:text-forest-300 py-2">
                            {props.alt}
                          </figcaption>
                        </figure>
                      );
                    },
                  }}
                >
                  {data.content.body.slice(0, 500)}
                </ReactMarkdown>
              )}
              <div className="absolute bottom-0 right-0 left-0 top-2/3 dark:from-forest-900 dark:via-forest-900/50 dark:to-transparent bg-gradient-to-t from-forest-50 via-forest-50/50 to-transparent"></div>
            </div>
            <div className="flex justify-start sm:justify-between text-xs md:text-base mt-[15px]">
              {/* <div className="hidden sm:flex text-color-text-primary bg-color-bg-default dark:bg-color-ui-hover dark:text-forest-300 font-semibold rounded-full px-2 py-0 leading-tight items-center">
                {(data.authorship.contributor as string).slice(0, 6)}
              </div> */}
              <div>{moment.unix(data.content.timestamp).fromNow()}</div>
            </div>
          </div>
        </div>
      </Link>
    );

  return (
    <div className="flex flex-col mb-[50px]">
      <BlogImage allTransactions={allTransactions} />
      <div className="flex flex-col px-4 lg:px-16">
        <h2 className="leading-snug text-[45px] mt-[30px] mb-[30px] md:mb-[30px] font-semibold">
          {data.content.title}
        </h2>
        <div className="flex justify-between mb-[15px]">
          <div className="text-base text-color-text-primary bg-color-bg-default dark:bg-forest-900 dark:text-forest-300 font-semibold rounded-full px-2 py-0 leading-tight flex items-center">
            {(data.authorship.contributor as string).slice(0, 6)}
          </div>
          <div>{moment.unix(data.content.timestamp).fromNow()}</div>
        </div>
        {data && (
          <ReactMarkdown
            className="blog"
            components={{
              img: ({ node, ...props }) => {
                return (
                  <figure className="flex flex-col justify-center py-3">
                    <img {...props} />
                    <figcaption className="text-center text-base text-color-text-primary dark:text-forest-300 py-2">
                      {props.alt}
                    </figcaption>
                  </figure>
                );
              },
            }}
          >
            {data.content.body}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export const BlogImage = ({
  allTransactions,
  type,
}: {
  allTransactions: any[];
  type?: "card" | "preview" | "full";
}) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (allTransactions.length > 0) {
      for (let i = 0; i < allTransactions.length; i++) {
        if (data) break;
        const transactionId = allTransactions[i].node.id;
        const res = fetch(`https://arweave.net/${transactionId}`)
          .then((res) => res.json())
          .then((res) => {
            if (res.wnft) {
              setData(res);
            }
          });
      }
    }
  }, [allTransactions, data]);

  if (!data || !data.wnft) return null;

  if (type === "preview") {
    return (
      <div
        className={`${
          data.wnft.hasCustomWnftMedia === false
            ? "aspect-[2/1]"
            : "aspect-[2/1]"
        } relative rounded-none overflow-hidden`}
      >
        <Image
          src={`https://ipfs.io/ipfs/${data.wnft.imageURI}`}
          alt={data.wnft.description}
          title={data.wnft.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover h-full w-full ${
            !data.wnft.hasCustomWnftMedia === false
              ? "object-center"
              : "object-top"
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${
        data.wnft.hasCustomWnftMedia === false ? "aspect-[2/1]" : "aspect-[2/1]"
      } relative rounded-t-3xl overflow-hidden`}
    >
      <Image
        src={`https://ipfs.io/ipfs/${data.wnft.imageURI}`}
        alt={data.wnft.description}
        title={data.wnft.name}
        fill
        className={`object-cover h-full w-full ${
          !data.wnft.hasCustomWnftMedia === false
            ? "object-center"
            : "object-top"
        }`}
      />
    </div>
  );
};
